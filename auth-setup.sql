-- Configuração de Autenticação no Supabase
-- Execute este script no SQL Editor do Supabase após criar a tabela reservas

-- 1. A autenticação já está habilitada por padrão no Supabase
-- Os usuários são armazenados na tabela auth.users automaticamente

-- 2. Atualizar políticas RLS para usar autenticação
-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Permitir leitura pública" ON reservas;
DROP POLICY IF EXISTS "Permitir inserção pública" ON reservas;
DROP POLICY IF EXISTS "Permitir atualização pública" ON reservas;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON reservas;

-- 3. Criar políticas baseadas em autenticação
-- Apenas usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem ler" ON reservas
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas usuários autenticados podem inserir
CREATE POLICY "Usuários autenticados podem inserir" ON reservas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Apenas usuários autenticados podem atualizar
CREATE POLICY "Usuários autenticados podem atualizar" ON reservas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Apenas usuários autenticados podem deletar
CREATE POLICY "Usuários autenticados podem deletar" ON reservas
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Criar tabela de perfis de usuário (opcional, mas recomendado)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7. Função para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. IMPORTANTE: Configurar Email Templates no Supabase Dashboard
-- Vá em: Authentication > Email Templates
-- Configure os templates de:
-- - Confirm signup (confirmação de cadastro)
-- - Magic Link (link mágico de login)
-- - Reset password (redefinir senha)

-- 10. IMPORTANTE: Configurar Site URL no Supabase Dashboard
-- Vá em: Authentication > URL Configuration
-- Site URL: https://josivanjuniorr.github.io/reservas/
-- Redirect URLs: https://josivanjuniorr.github.io/reservas/

-- Verificar configuração
SELECT 
  'Tabela reservas' as tabela,
  COUNT(*) as total_registros
FROM reservas
UNION ALL
SELECT 
  'Tabela profiles' as tabela,
  COUNT(*) as total_registros
FROM profiles;

-- Listar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('reservas', 'profiles')
ORDER BY tablename, policyname;
