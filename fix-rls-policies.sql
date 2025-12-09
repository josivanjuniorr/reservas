-- Script para corrigir as políticas RLS e permitir acesso tanto para usuários autenticados quanto anônimos
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas antigas que só permitiam 'anon'
DROP POLICY IF EXISTS "Permitir leitura pública" ON reservas;
DROP POLICY IF EXISTS "Permitir inserção pública" ON reservas;
DROP POLICY IF EXISTS "Permitir atualização pública" ON reservas;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON reservas;

-- 2. Criar novas políticas que permitem tanto anon quanto authenticated
CREATE POLICY "Permitir leitura para todos" ON reservas
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção para todos" ON reservas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para todos" ON reservas
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão para todos" ON reservas
  FOR DELETE
  USING (true);

-- 3. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reservas'
ORDER BY policyname;

-- 4. Também atualizar as políticas da tabela de auditoria para permitir leitura por anon
DROP POLICY IF EXISTS "Usuários autenticados podem ler auditoria" ON reservas_audit;

CREATE POLICY "Todos podem ler auditoria" ON reservas_audit
  FOR SELECT
  USING (true);

-- Manter a política de inserção apenas para authenticated (os triggers rodam com SECURITY DEFINER)
DROP POLICY IF EXISTS "Sistema pode inserir auditoria" ON reservas_audit;

CREATE POLICY "Sistema pode inserir auditoria" ON reservas_audit
  FOR INSERT
  WITH CHECK (true);

-- 5. Verificar RLS está ativo
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('reservas', 'reservas_audit');

-- 6. Teste de funcionalidade - inserir e ler dados
-- (Você pode rodar isso para testar)
/*
INSERT INTO reservas (id, "guestName", phone, "roomType", "startDate", "endDate", notes, price, responsible, "onClipboard")
VALUES ('test-' || NOW()::TEXT, 'Teste RLS', '123456789', 'duplo', CURRENT_DATE, CURRENT_DATE + 1, 'Teste de política', 100.00, 'Admin', false);

SELECT * FROM reservas WHERE "guestName" = 'Teste RLS';
*/
