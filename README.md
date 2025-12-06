# Reservas (Hotel Padre Cícero)

Este repositório contém uma aplicação de gerência de reservas (HTML/CSS/JS) que utiliza **Supabase como banco de dados**.

## 🚀 Como Configurar

### 1. Configure o Supabase

1. Acesse https://app.supabase.com/ e faça login
2. Crie um novo projeto ou selecione um existente
3. Vá para **Settings** > **API** e copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **Anon Key** (chave pública)

### 2. Crie a Tabela no Banco de Dados

1. No Supabase, vá para **SQL Editor**
2. Abra o arquivo `database.sql` deste repositório
3. Copie todo o conteúdo e cole no SQL Editor
4. Clique em **Run** para executar o script
5. A tabela `reservas` será criada com as políticas de segurança

### 3. Configure as Credenciais

1. Abra o arquivo `config.js`
2. Substitua `url` e `anonKey` pelos valores copiados:

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://SEU_PROJECT_REF.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### 4. Teste Localmente

Abra o arquivo `index.html` em um navegador ou use um servidor local:

```bash
# Com Python 3
python3 -m http.server 8000

# Com Node.js
npx serve
```

## 📦 Estrutura do Projeto

- `index.html` - Interface principal
- `styles.css` - Estilos da aplicação
- `app.js` - Lógica de negócios e interação
- `supabase-integration.js` - Integração com Supabase
- `config.js` - Configuração (URL e chave do Supabase)
- `database.sql` - Script SQL para criar a tabela

## 🌐 Deploy

O site está publicado em: https://josivanjuniorr.github.io/reservas/

## ⚠️ Segurança

- A `anonKey` é pública e pode ser compartilhada
- As políticas RLS (Row Level Security) protegem os dados
- Para produção, considere adicionar autenticação de usuários

