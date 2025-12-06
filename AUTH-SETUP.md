# 🔐 Módulo de Autenticação - Guia de Configuração

## ✨ Funcionalidades Implementadas

- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Logout com limpeza de sessão
- ✅ Persistência de sessão (auto-login)
- ✅ Proteção de rotas (apenas usuários autenticados)
- ✅ Interface moderna e responsiva
- ✅ Validação de formulários
- ✅ Mensagens de erro/sucesso
- ✅ Integração total com Supabase Auth

## 🚀 Como Configurar

### Passo 1: Executar SQL de Autenticação

1. Acesse o SQL Editor do Supabase:
   ```
   https://app.supabase.com/project/SEU_PROJECT/sql
   ```

2. Execute o arquivo `auth-setup.sql` completo

3. Verifique se as políticas foram criadas corretamente

### Passo 2: Configurar URLs no Supabase Dashboard

1. Vá em **Authentication > URL Configuration**

2. Configure:
   - **Site URL**: `https://josivanjuniorr.github.io/reservas/`
   - **Redirect URLs**: Adicione:
     - `https://josivanjuniorr.github.io/reservas/`
     - `http://localhost:5500/` (para desenvolvimento)

### Passo 3: Configurar Email Templates (Opcional)

Se quiser confirmação por email:

1. Vá em **Authentication > Email Templates**

2. Configure os templates:
   - **Confirm signup**: Template de confirmação de cadastro
   - **Magic Link**: Link mágico de login
   - **Reset Password**: Redefinir senha

### Passo 4: Desabilitar Confirmação de Email (Para Teste)

Para facilitar testes durante desenvolvimento:

1. Vá em **Authentication > Providers > Email**

2. Desabilite **"Confirm email"**

3. Isso permite login imediato após cadastro

## 📋 Como Usar

### Criar Primeira Conta

1. Abra o sistema: `https://josivanjuniorr.github.io/reservas/`

2. Clique em **"✨ Criar nova conta"**

3. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)

4. Clique em **"🎉 Criar Conta"**

5. Se a confirmação de email estiver desabilitada, você será logado automaticamente

### Fazer Login

1. Na tela de login, digite:
   - Email
   - Senha

2. Clique em **"🔓 Entrar"** ou pressione Enter

3. Você será redirecionado para a aplicação

### Fazer Logout

1. No header, clique no botão **"🚪 Sair"**

2. Você será redirecionado para a tela de login

## 🎨 Interface

### Tela de Login
- Design moderno com gradiente roxo
- Logo com efeito glassmorphism
- Formulários com validação
- Mensagens de erro claras
- Alternância entre login/cadastro

### Header Autenticado
- Exibe nome do usuário ou email
- Botão de logout estilizado
- Responsivo para mobile

## 🔒 Segurança

### Políticas RLS (Row Level Security)

As seguintes políticas foram configuradas:

#### Tabela `reservas`:
- ✅ Apenas usuários **autenticados** podem:
  - Ler (SELECT)
  - Inserir (INSERT)
  - Atualizar (UPDATE)
  - Deletar (DELETE)

#### Tabela `profiles`:
- ✅ Usuários podem ver/editar **apenas seu próprio perfil**

### Proteção de Dados

- ❌ Usuários não autenticados **não** têm acesso aos dados
- ✅ Sessões são gerenciadas pelo Supabase (seguras)
- ✅ Tokens JWT com expiração automática
- ✅ HTTPS obrigatório em produção

## 🧪 Testar Autenticação

### No Console do Navegador:

```javascript
// Verificar se está autenticado
Auth.isAuthenticated()

// Obter usuário atual
Auth.getCurrentUser()

// Ver sessão
Auth.session

// Logout programático
await Auth.logout()
```

## ⚙️ Arquivos Criados

- **`auth.js`** - Módulo de autenticação
- **`auth.css`** - Estilos da tela de login
- **`auth-setup.sql`** - Configuração do banco
- **`AUTH-SETUP.md`** - Este guia (documentação)

## 🔧 Personalização

### Alterar Cores do Login

No arquivo `auth.css`, modifique as variáveis:

```css
background: var(--bg-gradient);  /* Gradiente do fundo */
color: var(--accent);            /* Cor dos links */
```

### Customizar Validações

No arquivo `auth.js`, funções `login()` e `signup()`:

```javascript
// Adicionar validações personalizadas
if (password.length < 8) {
  return { success: false, error: 'Senha muito curta' };
}
```

## 🐛 Troubleshooting

### Erro: "Email not confirmed"
**Solução**: Desabilite confirmação de email nas configurações do Supabase

### Erro: "Invalid login credentials"
**Solução**: Verifique email e senha. Certifique-se que o usuário existe.

### Erro: "Not authenticated"
**Solução**: Execute o arquivo `auth-setup.sql` para configurar as políticas RLS

### Login não persiste após recarregar
**Solução**: Verifique se as URLs estão configuradas corretamente no Supabase

### Não consigo criar conta
**Solução**: 
1. Verifique se a autenticação está habilitada no Supabase
2. Veja o console para erros específicos
3. Confirme que o email é válido

## 📱 Responsividade

O módulo de autenticação é **totalmente responsivo**:

- ✅ Desktop: Modal centralizado grande
- ✅ Tablet: Modal ajustado
- ✅ Mobile: Modal full-width com padding reduzido

## 🎯 Próximos Passos

Melhorias futuras sugeridas:

- [ ] Recuperação de senha (forgot password)
- [ ] Login com Google/GitHub (OAuth)
- [ ] Login com Magic Link (email sem senha)
- [ ] Gerenciamento de perfil de usuário
- [ ] Controle de permissões por role (admin/user)
- [ ] Auditoria de ações (logs de quem criou/editou)

## 📚 Recursos

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Sistema agora possui autenticação completa e segura!** 🎉🔐
