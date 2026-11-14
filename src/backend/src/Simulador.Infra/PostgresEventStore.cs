using System.Reflection;
using System.Text.Json;
using Npgsql;
using NpgsqlTypes;
using Simulador.Dominio;

namespace Simulador.Infra;

public sealed class PostgresEventStore : IEventStore
{
    private readonly string _connectionString;

    public PostgresEventStore(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Connection string do Postgres nao configurada.");
        _connectionString = connectionString;
    }

    public async Task InicializarSchemaAsync(CancellationToken ct = default)
    {
        var sql = LerSchemaEmbutido();
        int[] esperasSegundos = [1, 2, 4, 8];
        for (var tentativa = 1; tentativa <= 5; tentativa++)
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync(ct);
                await using var cmd = new NpgsqlCommand(sql, conn);
                await cmd.ExecuteNonQueryAsync(ct);
                return;
            }
            catch when (tentativa < 5)
            {
                await Task.Delay(TimeSpan.FromSeconds(esperasSegundos[tentativa - 1]), ct);
            }
        }
    }

    public async Task<bool> VerificarSaudeAsync(CancellationToken ct = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand("SELECT 1", conn);
        await cmd.ExecuteScalarAsync(ct);
        return true;
    }

    public async Task<bool> CriarSessaoAsync(RegistroSessao sessao, IReadOnlyList<EnvelopeEvento> eventosIniciais, CancellationToken ct = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var tx = await conn.BeginTransactionAsync(ct);

        const string insertSessao = """
            INSERT INTO sessoes (id, semente, cenario_id, causa, nivel, versao_manifesto, criada_em, expira_em)
            VALUES (@id, @semente, @cenario_id, @causa, @nivel, @versao_manifesto, @criada_em, @expira_em);
            """;
        await using (var cmd = new NpgsqlCommand(insertSessao, conn, tx))
        {
            cmd.Parameters.AddWithValue("id", sessao.Id);
            cmd.Parameters.AddWithValue("semente", sessao.Semente);
            cmd.Parameters.AddWithValue("cenario_id", sessao.CenarioId);
            cmd.Parameters.AddWithValue("causa", sessao.Causa);
            cmd.Parameters.AddWithValue("nivel", sessao.Nivel);
            cmd.Parameters.AddWithValue("versao_manifesto", sessao.VersaoManifesto);
            cmd.Parameters.AddWithValue("criada_em", sessao.CriadaEm);
            cmd.Parameters.AddWithValue("expira_em", sessao.ExpiraEm);
            await cmd.ExecuteNonQueryAsync(ct);
        }

        await InserirEventosAsync(conn, tx, sessao.Id, eventosIniciais, ct);
        await tx.CommitAsync(ct);
        return true;
    }

    public async Task<(RegistroSessao? Sessao, IReadOnlyList<EnvelopeEvento> Eventos)> ObterSessaoAsync(Guid sessaoId, CancellationToken ct = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        const string sqlSessao = """
            SELECT id, semente, cenario_id, causa, nivel, versao_manifesto, criada_em, expira_em
            FROM sessoes WHERE id = @id;
            """;
        RegistroSessao? sessao = null;
        await using (var cmd = new NpgsqlCommand(sqlSessao, conn))
        {
            cmd.Parameters.AddWithValue("id", sessaoId);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                sessao = new RegistroSessao(
                    reader.GetGuid(0),
                    reader.GetInt64(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.GetFieldValue<DateTimeOffset>(6),
                    reader.GetFieldValue<DateTimeOffset>(7));
            }
        }
        if (sessao is null) return (null, []);

        const string sqlEventos = """
            SELECT seq, tipo, payload::text
            FROM eventos WHERE sessao_id = @id ORDER BY seq ASC;
            """;
        var lista = new List<EnvelopeEvento>();
        await using (var cmd = new NpgsqlCommand(sqlEventos, conn))
        {
            cmd.Parameters.AddWithValue("id", sessaoId);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var seq = reader.GetInt32(0);
                var tipo = reader.GetString(1);
                var json = reader.GetString(2);
                var doc = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json) ?? [];
                var minuto = doc.TryGetValue("minutoSimulado", out var minEl) && minEl.TryGetInt32(out var m) ? m : 0;
                var dados = new Dictionary<string, object?>();
                if (doc.TryGetValue("dados", out var dadosEl) && dadosEl.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in dadosEl.EnumerateObject())
                        dados[prop.Name] = ConverterJsonElement(prop.Value);
                }
                lista.Add(new EnvelopeEvento(seq, tipo, dados, minuto));
            }
        }
        return (sessao, lista);
    }

    public async Task<ResultadoAnexar> AnexarAsync(Guid sessaoId, int seqEsperado, IReadOnlyList<EnvelopeEvento> novosEventos, CancellationToken ct = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var tx = await conn.BeginTransactionAsync(ct);

        try
        {
            await using (var lockCmd = new NpgsqlCommand("SELECT 1 FROM sessoes WHERE id = @id FOR UPDATE;", conn, tx))
            {
                lockCmd.Parameters.AddWithValue("id", sessaoId);
                var exists = await lockCmd.ExecuteScalarAsync(ct);
                if (exists is null)
                {
                    await tx.RollbackAsync(ct);
                    return new ResultadoAnexar(false, 0, Conflito: false);
                }
            }

            int ultimoSeq;
            await using (var maxCmd = new NpgsqlCommand("SELECT COALESCE(MAX(seq), 0) FROM eventos WHERE sessao_id = @id;", conn, tx))
            {
                maxCmd.Parameters.AddWithValue("id", sessaoId);
                ultimoSeq = Convert.ToInt32(await maxCmd.ExecuteScalarAsync(ct));
            }

            if (ultimoSeq != seqEsperado)
            {
                await tx.RollbackAsync(ct);
                return new ResultadoAnexar(false, ultimoSeq, Conflito: true);
            }

            await InserirEventosAsync(conn, tx, sessaoId, novosEventos, ct);
            await tx.CommitAsync(ct);
            return new ResultadoAnexar(true, novosEventos[^1].Seq, Conflito: false);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            await tx.RollbackAsync(ct);
            return new ResultadoAnexar(false, seqEsperado, Conflito: true);
        }
    }

    private static async Task InserirEventosAsync(
        NpgsqlConnection conn,
        NpgsqlTransaction tx,
        Guid sessaoId,
        IReadOnlyList<EnvelopeEvento> eventos,
        CancellationToken ct)
    {
        const string sql = """
            INSERT INTO eventos (sessao_id, seq, tipo, payload)
            VALUES (@sessao_id, @seq, @tipo, @payload);
            """;
        foreach (var ev in eventos)
        {
            var payload = JsonSerializer.Serialize(new
            {
                minutoSimulado = ev.MinutoSimulado,
                dados = ev.Dados
            });
            await using var cmd = new NpgsqlCommand(sql, conn, tx);
            cmd.Parameters.AddWithValue("sessao_id", sessaoId);
            cmd.Parameters.AddWithValue("seq", ev.Seq);
            cmd.Parameters.AddWithValue("tipo", ev.Tipo);
            cmd.Parameters.Add(new NpgsqlParameter("payload", NpgsqlDbType.Jsonb) { Value = payload });
            await cmd.ExecuteNonQueryAsync(ct);
        }
    }

    private static object? ConverterJsonElement(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.String => el.GetString(),
        JsonValueKind.Number => el.TryGetInt64(out var l) ? l : el.GetDouble(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Null => null,
        JsonValueKind.Array => el.EnumerateArray().Select(ConverterJsonElement).ToArray(),
        JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => ConverterJsonElement(p.Value)),
        _ => el.ToString()
    };

    private static string LerSchemaEmbutido()
    {
        var asm = Assembly.GetExecutingAssembly();
        var resName = asm.GetManifestResourceNames().FirstOrDefault(n => n.EndsWith("schema.sql", StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException("Recurso embutido schema.sql nao encontrado.");
        using var stream = asm.GetManifestResourceStream(resName)!;
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
