CREATE TABLE IF NOT EXISTS schema_versao (
    versao INT PRIMARY KEY,
    aplicado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessoes (
    id UUID PRIMARY KEY,
    semente BIGINT NOT NULL,
    cenario_id TEXT NOT NULL,
    causa TEXT NOT NULL,
    nivel TEXT NOT NULL,
    versao_manifesto TEXT NOT NULL,
    criada_em TIMESTAMPTZ NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_sessoes_expira ON sessoes (expira_em);

CREATE TABLE IF NOT EXISTS eventos (
    sessao_id UUID NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
    seq INT NOT NULL,
    tipo TEXT NOT NULL,
    payload JSONB NOT NULL,
    ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (sessao_id, seq)
);

INSERT INTO schema_versao (versao) VALUES (1) ON CONFLICT (versao) DO NOTHING;
