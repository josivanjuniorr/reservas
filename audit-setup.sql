-- Sistema de Auditoria para Reservas
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar campos de auditoria na tabela reservas
ALTER TABLE reservas 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 2. Criar tabela de histórico de auditoria
CREATE TABLE IF NOT EXISTS reservas_audit (
  id BIGSERIAL PRIMARY KEY,
  reserva_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_audit_reserva_id ON reservas_audit(reserva_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON reservas_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON reservas_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON reservas_audit(action);

-- 3. Habilitar RLS na tabela de auditoria
ALTER TABLE reservas_audit ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para auditoria
CREATE POLICY "Usuários autenticados podem ler auditoria" ON reservas_audit
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir que triggers insiram registros de auditoria (SECURITY DEFINER resolve isso, mas garantir política)
CREATE POLICY "Sistema pode inserir auditoria" ON reservas_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Função para registrar criação de reserva
CREATE OR REPLACE FUNCTION audit_reserva_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir created_by automaticamente
  NEW.created_by := auth.uid();
  NEW.updated_by := auth.uid();
  
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

-- 6. Função para registrar atualização de reserva
CREATE OR REPLACE FUNCTION audit_reserva_updated()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}';
BEGIN
  -- Definir updated_by automaticamente
  NEW.updated_by := auth.uid();
  
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

-- 7. Função para registrar exclusão de reserva
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

-- 8. Criar triggers para auditoria automática
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

-- 9. View para facilitar consulta de auditoria com informações do usuário
CREATE OR REPLACE VIEW reservas_audit_view AS
SELECT 
  a.id,
  a.reserva_id,
  a.action,
  a.user_email,
  p.full_name as user_name,
  a.changed_fields,
  a.old_values,
  a.new_values,
  a.created_at
FROM reservas_audit a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- 10. Função auxiliar para obter histórico de uma reserva
CREATE OR REPLACE FUNCTION get_reserva_history(p_reserva_id TEXT)
RETURNS TABLE (
  id BIGINT,
  action TEXT,
  user_email TEXT,
  user_name TEXT,
  changed_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.action,
    a.user_email,
    p.full_name as user_name,
    a.changed_fields,
    a.created_at
  FROM reservas_audit a
  LEFT JOIN profiles p ON a.user_id = p.id
  WHERE a.reserva_id = p_reserva_id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar configuração
SELECT 
  'Total de registros de auditoria' as info,
  COUNT(*) as quantidade
FROM reservas_audit
UNION ALL
SELECT 
  'Reservas com auditoria' as info,
  COUNT(DISTINCT reserva_id) as quantidade
FROM reservas_audit;

-- Exemplo de consulta: Ver últimas 10 ações
SELECT 
  action,
  user_email,
  reserva_id,
  changed_fields,
  created_at
FROM reservas_audit_view
LIMIT 10;