-- Script para corrigir os triggers de auditoria para funcionar com usuários anônimos
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar função de criação para funcionar com anon e authenticated
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

-- 2. Atualizar função de atualização para funcionar com anon e authenticated
CREATE OR REPLACE FUNCTION audit_reserva_updated()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}';
BEGIN
  -- Definir updated_by apenas se usuário estiver autenticado
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by := auth.uid();
  END IF;
  
  -- Detectar campos alterados (usando aspas duplas para nomes de colunas)
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

-- 3. Atualizar função de exclusão para funcionar com anon e authenticated
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

-- 4. Recriar os triggers
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

-- 5. Verificar se os triggers estão ativos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'reservas'
ORDER BY trigger_name;
