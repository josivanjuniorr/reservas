-- SQL para criar a tabela de reservas no Supabase
-- Execute este script no SQL Editor do Supabase:
-- https://app.supabase.com/project/YOUR_PROJECT/editor

-- IMPORTANTE: PostgreSQL converte nomes não-quoted para lowercase
-- Use aspas duplas para preservar camelCase

-- Remover tabela existente se necessário (CUIDADO: apaga dados!)
-- DROP TABLE IF EXISTS reservas CASCADE;

-- Criar a tabela reservas com nomes de colunas entre aspas para preservar camelCase
CREATE TABLE IF NOT EXISTS reservas (
  id TEXT PRIMARY KEY,
  "guestName" TEXT NOT NULL,
  phone TEXT,
  "roomType" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  notes TEXT,
  price NUMERIC(10, 2),
  responsible TEXT,
  "onClipboard" BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_reservas_dates ON reservas("startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_reservas_roomType ON reservas("roomType");
CREATE INDEX IF NOT EXISTS idx_reservas_guestName ON reservas("guestName");

-- Habilitar Row Level Security (RLS)
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública (anon key)
CREATE POLICY "Permitir leitura pública" ON reservas
  FOR SELECT
  TO anon
  USING (true);

-- Criar política para permitir inserção pública
CREATE POLICY "Permitir inserção pública" ON reservas
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Criar política para permitir atualização pública
CREATE POLICY "Permitir atualização pública" ON reservas
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Criar política para permitir exclusão pública
CREATE POLICY "Permitir exclusão pública" ON reservas
  FOR DELETE
  TO anon
  USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
