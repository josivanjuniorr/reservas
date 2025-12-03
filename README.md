# Reservas (Hotel Padre Cícero)

Este repositório contém uma aplicação de gerência de reservas (HTML/CSS/JS) que utiliza **Supabase como banco de dados**.

## Requisitos
- Projeto no [Supabase](https://app.supabase.com/) com tabela `reservas` criada.

## Como configurar

1. **Crie um projeto no Supabase**:
   - Acesse https://app.supabase.com/ e crie um novo projeto.

2. **Crie a tabela `reservas`** no SQL Editor:

```sql
create table if not exists reservas (
  id text primary key,
  guestName text,
  phone text,
  roomType text,
  startDate date,
  endDate date,
  notes text,
  price numeric,
  responsible text,
  onClipboard boolean
);
```

3. **Configure `config.js`**:
   - Copie `config.example.js` para `config.js`.
   - Preencha `url` e `anonKey` com os valores do seu projeto Supabase:
     - **URL**: https://app.supabase.com/project/YOUR_PROJECT_REF/settings/api
     - **Anon Key**: mesma página, seção "Project API keys"

4. **Rode o servidor local**:

```bash
python3 -m http.server 8000
# Abra http://localhost:8000/ no navegador
```

A aplicação carregará as reservas de Supabase automaticamente e sincronizará todas as mudanças (add, edit, delete) com o banco de dados.

## Segurança

Para produção, é **recomendado**:
- Não usar a `anon` key com permissões de escrita diretas no cliente.
- Implementar **Row Level Security (RLS)** no Supabase.
- Usar autenticação (JWT + Supabase Auth) ou um **backend** que use `service_role` key.

## Estrutura de arquivos

- `index.html` — HTML principal, carrega Supabase e scripts.
- `styles.css` — Estilos da aplicação.
- `app.js` — Lógica principal (integração Supabase obrigatória).
- `config.example.js` — Modelo para `config.js` (não commitado).
- `config.js` — Seu arquivo de configuração (não commitado; use `.gitignore`).
- `supabase-integration.js` — Wrapper que inicializa o cliente Supabase.
