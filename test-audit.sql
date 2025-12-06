-- Script de Teste para Sistema de Auditoria
-- Execute este script no SQL Editor do Supabase para diagnosticar problemas

-- 1. Verificar se as colunas de auditoria existem na tabela reservas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservas' 
AND column_name IN ('created_by', 'updated_by')
ORDER BY column_name;

-- 2. Verificar se a tabela de auditoria existe e tem registros
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT reserva_id) as reservas_distintas,
  COUNT(DISTINCT action) as tipos_acao
FROM reservas_audit;

-- 3. Verificar últimas 5 ações registradas
SELECT 
  id,
  reserva_id,
  action,
  user_email,
  changed_fields,
  created_at
FROM reservas_audit
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar se os triggers existem
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'reservas'
ORDER BY trigger_name;

-- 5. Verificar políticas RLS na tabela de auditoria
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
WHERE tablename = 'reservas_audit';

-- 6. Teste manual: Inserir uma reserva de teste
-- IMPORTANTE: Só execute se estiver logado no Supabase
-- Descomente as linhas abaixo para testar:

/*
INSERT INTO reservas (
  id,
  "guestName",
  phone,
  "roomType",
  "startDate",
  "endDate",
  price,
  responsible,
  notes,
  "onClipboard"
) VALUES (
  'test-' || gen_random_uuid()::text,
  'Teste Auditoria',
  '11999999999',
  'duplo',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days',
  150.00,
  'Sistema',
  'Teste de auditoria',
  false
);
*/

-- 7. Verificar se a inserção gerou registro de auditoria
SELECT 
  a.*
FROM reservas_audit a
WHERE a.reserva_id LIKE 'test-%'
ORDER BY a.created_at DESC
LIMIT 1;

-- 8. Teste de UPDATE
-- Descomente para testar:

/*
UPDATE reservas 
SET "guestName" = 'Teste Auditoria MODIFICADO',
    price = 200.00
WHERE id LIKE 'test-%'
LIMIT 1;
*/

-- 9. Verificar se o UPDATE gerou registro de auditoria
SELECT 
  a.action,
  a.user_email,
  a.changed_fields,
  a.old_values->>'guestName' as nome_antigo,
  a.new_values->>'guestName' as nome_novo,
  a.old_values->>'price' as preco_antigo,
  a.new_values->>'price' as preco_novo,
  a.created_at
FROM reservas_audit a
WHERE a.reserva_id LIKE 'test-%'
AND a.action = 'UPDATE'
ORDER BY a.created_at DESC
LIMIT 1;

-- 10. Limpar dados de teste
-- Descomente para limpar:

/*
DELETE FROM reservas WHERE id LIKE 'test-%';
*/
