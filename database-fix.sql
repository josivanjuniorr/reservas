-- SCRIPT DE CORREÇÃO: Recriar tabela com colunas corretas
-- Execute este script no SQL Editor do Supabase se a tabela já existe com nomes errados

-- 1. Primeiro, faça backup dos dados (se houver)
-- CREATE TABLE reservas_backup AS SELECT * FROM reservas;

-- 2. Remover tabela existente
DROP TABLE IF EXISTS reservas CASCADE;

-- 3. Criar tabela com nomes corretos (usando aspas para preservar camelCase)
CREATE TABLE reservas (
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

-- 4. Criar índices
CREATE INDEX idx_reservas_dates ON reservas("startDate", "endDate");
CREATE INDEX idx_reservas_roomType ON reservas("roomType");
CREATE INDEX idx_reservas_guestName ON reservas("guestName");

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas para permitir acesso público (anon key)
CREATE POLICY "Permitir leitura pública" ON reservas
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Permitir inserção pública" ON reservas
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública" ON reservas
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão pública" ON reservas
  FOR DELETE
  TO anon
  USING (true);

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at
CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Restaurar dados do backup (se necessário)
-- INSERT INTO reservas SELECT * FROM reservas_backup;

-- 10. Remover backup (se quiser)
-- DROP TABLE reservas_backup;

-- VERIFICAR: Execute isso para confirmar que a tabela foi criada corretamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservas' 
ORDER BY ordinal_position;
