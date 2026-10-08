-- =============================================
-- AgendaPro - Tabela de Agendamentos
-- Execute este SQL no SQL Editor do Supabase
-- =============================================

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,           -- formato: YYYY-MM-DD
  time TEXT NOT NULL,           -- formato: HH:MM
  agenda TEXT NOT NULL,         -- 'zona-sul' ou 'santa-monica'
  corretor TEXT NOT NULL,       -- Nome do corretor
  gerente TEXT NOT NULL,        -- Nome do gerente
  cliente TEXT NOT NULL,        -- Nome do cliente
  telefone TEXT NOT NULL,       -- Telefone do cliente
  agencia TEXT NOT NULL,        -- Agência da equipe
  diretor TEXT,                 -- Diretor responsável pelo atendimento (opcional)
  webhook_status TEXT,          -- Status do último disparo: 'ok' ou 'falha (N tentativas): <erro>'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Se a tabela já existir, adicionar colunas ausentes
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS diretor TEXT;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS webhook_status TEXT;


-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_date ON agendamentos(date);
CREATE INDEX IF NOT EXISTS idx_agendamentos_agenda ON agendamentos(agenda);
CREATE INDEX IF NOT EXISTS idx_agendamentos_date_time_agenda ON agendamentos(date, time, agenda);

-- Habilitar RLS (Row Level Security)
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura de agendamentos" ON agendamentos
  FOR SELECT USING (true);

-- Política para permitir inserção pública
CREATE POLICY "Permitir inserção de agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (true);

-- Política para permitir exclusão pública
CREATE POLICY "Permitir exclusão de agendamentos" ON agendamentos
  FOR DELETE USING (true);

-- Trava no banco para 1 agendamento por horário/agenda
CREATE OR REPLACE FUNCTION check_slot_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM agendamentos
    WHERE date = NEW.date
      AND time = NEW.time
      AND agenda = NEW.agenda
  ) >= 1 THEN
    RAISE EXCEPTION 'Limite de 1 atendimento por horário atingido nesta agenda';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_slot_limit ON agendamentos;

CREATE TRIGGER enforce_slot_limit
  BEFORE INSERT ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION check_slot_limit();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE agendamentos;
