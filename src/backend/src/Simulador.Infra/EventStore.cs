using System.Collections.Concurrent;
using Simulador.Dominio;

namespace Simulador.Infra;

public sealed record RegistroSessao(
    Guid Id,
    long Semente,
    string CenarioId,
    string Causa,
    string Nivel,
    string VersaoManifesto,
    DateTimeOffset CriadaEm,
    DateTimeOffset ExpiraEm);

public sealed record ResultadoAnexar(bool Sucesso, int UltimoSeq, bool Conflito = false);

public interface IEventStore
{
    Task<bool> CriarSessaoAsync(RegistroSessao sessao, IReadOnlyList<EnvelopeEvento> eventosIniciais, CancellationToken ct = default);
    Task<(RegistroSessao? Sessao, IReadOnlyList<EnvelopeEvento> Eventos)> ObterSessaoAsync(Guid sessaoId, CancellationToken ct = default);
    Task<ResultadoAnexar> AnexarAsync(Guid sessaoId, int seqEsperado, IReadOnlyList<EnvelopeEvento> novosEventos, CancellationToken ct = default);
}

public sealed class InMemoryEventStore : IEventStore
{
    private sealed class SessaoEmMemoria
    {
        public required RegistroSessao Meta { get; init; }
        public List<EnvelopeEvento> Eventos { get; } = [];
        public object Sync { get; } = new();
    }

    private readonly ConcurrentDictionary<Guid, SessaoEmMemoria> _sessoes = new();

    public Task<bool> CriarSessaoAsync(RegistroSessao sessao, IReadOnlyList<EnvelopeEvento> eventosIniciais, CancellationToken ct = default)
    {
        var item = new SessaoEmMemoria { Meta = sessao };
        lock (item.Sync)
        {
            item.Eventos.AddRange(eventosIniciais);
        }
        return Task.FromResult(_sessoes.TryAdd(sessao.Id, item));
    }

    public Task<(RegistroSessao? Sessao, IReadOnlyList<EnvelopeEvento> Eventos)> ObterSessaoAsync(Guid sessaoId, CancellationToken ct = default)
    {
        if (!_sessoes.TryGetValue(sessaoId, out var item))
            return Task.FromResult<(RegistroSessao?, IReadOnlyList<EnvelopeEvento>)>((null, []));

        lock (item.Sync)
        {
            return Task.FromResult<(RegistroSessao?, IReadOnlyList<EnvelopeEvento>)>((item.Meta, item.Eventos.ToArray()));
        }
    }

    public Task<ResultadoAnexar> AnexarAsync(Guid sessaoId, int seqEsperado, IReadOnlyList<EnvelopeEvento> novosEventos, CancellationToken ct = default)
    {
        if (!_sessoes.TryGetValue(sessaoId, out var item))
            return Task.FromResult(new ResultadoAnexar(false, 0, Conflito: false));

        lock (item.Sync)
        {
            var ultimo = item.Eventos.Count == 0 ? 0 : item.Eventos[^1].Seq;
            if (ultimo != seqEsperado)
                return Task.FromResult(new ResultadoAnexar(false, ultimo, Conflito: true));

            item.Eventos.AddRange(novosEventos);
            return Task.FromResult(new ResultadoAnexar(true, item.Eventos[^1].Seq, Conflito: false));
        }
    }
}
