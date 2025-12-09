# 🔧 CORREÇÃO: Reservas não ficam salvas

## 🐛 Problema Identificado

As reservas aparecem momentaneamente após serem salvas, mas desaparecem em seguida. Isso ocorre porque:

### Causa Raiz
As **políticas RLS (Row Level Security)** do Supabase estavam configuradas para permitir acesso apenas a usuários **anônimos** (`anon`), mas o sistema exige **autenticação**. Quando um usuário autenticado tenta salvar uma reserva:

1. ✅ A reserva é adicionada ao array local `reservations[]`
2. ❌ O `upsert` no Supabase falha silenciosamente (bloqueado pelo RLS)
3. ✅ A interface mostra a reserva (usando dados locais)
4. ❌ Ao recarregar a página, a reserva desaparece (não está no banco)

### Conflito de Configurações

**`database.sql`** (configuração original):
```sql
-- Políticas que só permitem acesso 'anon' (não autenticado)
CREATE POLICY "Permitir leitura pública" ON reservas
  FOR SELECT
  TO anon
  USING (true);
```

**Sistema de autenticação** (`auth.js`):
- Requer login do usuário
- Usuário autenticado tem role `authenticated`, não `anon`
- RLS bloqueia operações de usuários `authenticated`

## ✅ Solução

Execute o script **`FIX-COMPLETO.sql`** no SQL Editor do Supabase:

### O que o script faz:

1. **Remove políticas antigas** que só permitiam `anon`
2. **Cria novas políticas** que permitem **todos** os usuários (autenticados ou não)
3. **Corrige triggers de auditoria** para funcionar com ambos os tipos de usuário
4. **Valida a configuração** com queries de verificação

### Como aplicar:

1. Acesse o Supabase: https://app.supabase.com
2. Vá em **SQL Editor**
3. Copie todo o conteúdo de `FIX-COMPLETO.sql`
4. Cole no editor e execute (**Run**)
5. Verifique os resultados da verificação no final

## 🧪 Como Testar

Após executar o script:

1. **Faça login** no sistema
2. **Crie uma nova reserva**
3. **Atualize a página** (F5)
4. **Verifique** se a reserva continua aparecendo

### Teste no Console (opcional)

No console do navegador, execute:
```javascript
await window.testSupabase()
```

Deve retornar: `✅ Teste bem-sucedido! Dados salvos`

## 📊 Arquivos Criados

- **`FIX-COMPLETO.sql`** - Script completo de correção (RECOMENDADO)
- **`fix-rls-policies.sql`** - Apenas políticas RLS
- **`fix-audit-triggers.sql`** - Apenas triggers de auditoria

## 🔍 Diagnóstico Adicional

Se o problema persistir, verifique:

### 1. Configuração do Supabase
```javascript
// No console do navegador
console.log(window.SUPABASE_CONFIG)
console.log(sbClient)
```

### 2. Erros de salvamento
Abra o **Console do navegador** (F12) e procure por:
- ❌ Erros vermelhos ao salvar
- Mensagens de "policy violation" ou "RLS"

### 3. Teste direto no Supabase
No SQL Editor do Supabase:
```sql
-- Listar reservas existentes
SELECT * FROM reservas ORDER BY created_at DESC LIMIT 10;

-- Verificar políticas ativas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'reservas';

-- Verificar se RLS está ativo
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'reservas';
```

## 🎯 Próximos Passos

Após a correção:

1. ✅ Reservas devem ser salvas permanentemente
2. ✅ Sistema de auditoria funcionará corretamente
3. ✅ Histórico de alterações será registrado
4. ✅ Tanto usuários autenticados quanto anônimos podem operar (se configurado)

## 💡 Notas Importantes

- O RLS continua **ativo** (boa prática de segurança)
- As políticas agora permitem **todos** os usuários
- Se quiser restringir acesso apenas a autenticados no futuro, altere `USING (true)` para `USING (auth.uid() IS NOT NULL)`
- O sistema de auditoria registrará o email do usuário quando autenticado
