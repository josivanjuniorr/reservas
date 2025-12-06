# 🔧 CORREÇÃO URGENTE - Problema de Salvamento

## ❌ Erro Atual
```
Could not find the 'endDate' column of 'reservas' in the schema cache
```

## ✅ Solução Rápida

### Passo 1: Acessar SQL Editor do Supabase
Vá para: https://app.supabase.com/project/abcjhhzqyknvgashtpbm/sql

### Passo 2: Executar este comando

```sql
-- ATENÇÃO: Isso vai APAGAR a tabela existente!
-- Se você tem dados importantes, faça backup primeiro

DROP TABLE IF EXISTS reservas CASCADE;

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

-- Criar índices
CREATE INDEX idx_reservas_dates ON reservas("startDate", "endDate");
CREATE INDEX idx_reservas_roomType ON reservas("roomType");
CREATE INDEX idx_reservas_guestName ON reservas("guestName");

-- Habilitar RLS
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público
CREATE POLICY "Permitir leitura pública" ON reservas
  FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir inserção pública" ON reservas
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Permitir atualização pública" ON reservas
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão pública" ON reservas
  FOR DELETE TO anon USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Passo 3: Verificar

Execute este comando para confirmar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservas' 
ORDER BY ordinal_position;
```

Você deve ver colunas com nomes exatos: `guestName`, `roomType`, `startDate`, `endDate`, `onClipboard`

### Passo 4: Testar no Navegador

1. Recarregue a página do sistema
2. Abra o Console (F12)
3. Execute: `window.testSupabase()`
4. Você deve ver: `✅ Teste bem-sucedido!`

## 📝 O que aconteceu?

PostgreSQL converte nomes de colunas para minúsculas automaticamente, a menos que você use aspas duplas. 

- ❌ `CREATE TABLE (endDate ...)` → vira `enddate`
- ✅ `CREATE TABLE ("endDate" ...)` → mantém `endDate`

O script corrigido usa aspas duplas para preservar o camelCase.
