-- ===================================================================
-- CORREÇÃO COMPLETA: Políticas RLS + Triggers de Auditoria
-- Execute este script completo no SQL Editor do Supabase
-- ===================================================================

-- PARTE 1: CORRIGIR POLÍTICAS RLS
-- ===================================================================

-- Remover políticas antigas que só permitiam 'anon'
DROP POLICY IF EXISTS "Permitir leitura pública" ON reservas;
DROP POLICY IF EXISTS "Permitir inserção pública" ON reservas;
DROP POLICY IF EXISTS "Permitir atualização pública" ON reservas;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON reservas;

-- Criar novas políticas que permitem tanto anon quanto authenticated
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

-- Atualizar políticas da tabela de auditoria
DROP POLICY IF EXISTS "Usuários autenticados podem ler auditoria" ON reservas_audit;
DROP POLICY IF EXISTS "Sistema pode inserir auditoria" ON reservas_audit;

CREATE POLICY "Todos podem ler auditoria" ON reservas_audit
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir auditoria" ON reservas_audit
  FOR INSERT
  WITH CHECK (true);

-- PARTE 2: CORRIGIR TRIGGERS DE AUDITORIA
-- ===================================================================

-- Função para registrar criação (compatível com anon e authenticated)
CREATE OR REPLACE FUNCTION audit_reserva_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir created_by apenas se usuário estiver autenticado
  IF auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
  END IF;
  
  -- Registrar no histórico
  INSERT INTO reservas_audit (
    reserva_id,
    action,
    user_id,
    user_email,
    new_values
  )
  VALUES (
    NEW.id,
    'INSERT',
    auth.uid(),
    auth.email(),
    to_jsonb(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar atualização (compatível com anon e authenticated)
CREATE OR REPLACE FUNCTION audit_reserva_updated()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}';
BEGIN
  -- Definir updated_by apenas se usuário estiver autenticado
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by := auth.uid();
  END IF;
  
  -- Detectar campos alterados
  IF OLD."guestName" IS DISTINCT FROM NEW."guestName" THEN
    changed_fields := changed_fields || jsonb_build_object('guestName', true);
  END IF;
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    changed_fields := changed_fields || jsonb_build_object('phone', true);
  END IF;
  IF OLD."roomType" IS DISTINCT FROM NEW."roomType" THEN
    changed_fields := changed_fields || jsonb_build_object('roomType', true);
  END IF;
  IF OLD."startDate" IS DISTINCT FROM NEW."startDate" THEN
    changed_fields := changed_fields || jsonb_build_object('startDate', true);
  END IF;
  IF OLD."endDate" IS DISTINCT FROM NEW."endDate" THEN
    changed_fields := changed_fields || jsonb_build_object('endDate', true);
  END IF;
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    changed_fields := changed_fields || jsonb_build_object('price', true);
  END IF;
  IF OLD.responsible IS DISTINCT FROM NEW.responsible THEN
    changed_fields := changed_fields || jsonb_build_object('responsible', true);
  END IF;
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    changed_fields := changed_fields || jsonb_build_object('notes', true);
  END IF;
  IF OLD."onClipboard" IS DISTINCT FROM NEW."onClipboard" THEN
    changed_fields := changed_fields || jsonb_build_object('onClipboard', true);
  END IF;
  
  -- Registrar no histórico apenas se houver mudanças
  IF changed_fields != '{}' THEN
    INSERT INTO reservas_audit (
      reserva_id,
      action,
      user_id,
      user_email,
      changed_fields,
      old_values,
      new_values
    )
    VALUES (
      NEW.id,
      'UPDATE',
      auth.uid(),
      auth.email(),
      changed_fields,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar exclusão (compatível com anon e authenticated)
CREATE OR REPLACE FUNCTION audit_reserva_deleted()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reservas_audit (
    reserva_id,
    action,
    user_id,
    user_email,
    old_values
  )
  VALUES (
    OLD.id,
    'DELETE',
    auth.uid(),
    auth.email(),
    to_jsonb(OLD)
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar todos os triggers
DROP TRIGGER IF EXISTS reserva_created_audit ON reservas;
CREATE TRIGGER reserva_created_audit
  BEFORE INSERT ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION audit_reserva_created();

DROP TRIGGER IF EXISTS reserva_updated_audit ON reservas;
CREATE TRIGGER reserva_updated_audit
  BEFORE UPDATE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION audit_reserva_updated();

DROP TRIGGER IF EXISTS reserva_deleted_audit ON reservas;
CREATE TRIGGER reserva_deleted_audit
  AFTER DELETE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION audit_reserva_deleted();

-- PARTE 3: VERIFICAÇÃO
-- ===================================================================

-- Verificar políticas RLS
SELECT 
  '📋 Políticas RLS' as tipo,
  tablename,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename IN ('reservas', 'reservas_audit')
ORDER BY tablename, policyname;

-- Verificar triggers
SELECT 
  '⚡ Triggers' as tipo,
  trigger_name as nome,
  event_object_table as tabela,
  action_timing as quando,
  event_manipulation as evento
FROM information_schema.triggers
WHERE event_object_table = 'reservas'
ORDER BY trigger_name;

-- Verificar RLS está ativo
SELECT 
  '🔒 RLS Status' as tipo,
  tablename as tabela,
  CASE WHEN rowsecurity THEN '✅ Ativo' ELSE '❌ Inativo' END as status
FROM pg_tables
WHERE tablename IN ('reservas', 'reservas_audit');

-- Mensagem final
SELECT '✅ CORREÇÃO CONCLUÍDA! Agora tente salvar uma reserva no sistema.' as mensagem;
