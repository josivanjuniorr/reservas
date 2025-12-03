# Reservas (Hotel Padre Cícero)

Este repositório contém uma aplicação simples de gerência de reservas (HTML/CSS/JS). A aplicação agora suporta persistência local via `localStorage` e integração opcional com Supabase para armazenar as reservas em banco de dados.

## O que foi adicionado
- `config.example.js` — modelo para `config.js` contendo `SUPABASE_CONFIG` (URL e anon key).
- `supabase-integration.js` — pequeno wrapper que inicializa o cliente Supabase e expõe funções (`SB.init`, `SB.loadAll`, `SB.upsertMany`, `SB.deleteById`).
- `app.js` — atualizado para usar Supabase quando configurado; mantém fallback para `localStorage`.

## Como configurar Supabase
1. Crie um projeto no https://app.supabase.com/
2. No SQL Editor, crie a tabela `reservas` com este esquema (exemplo):

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

3. Para desenvolvimento rápido, você pode usar a `anon` key do projeto (não recomendado em produção).
4. Copie `config.example.js` para `config.js` e preencha `url` e `anonKey` com os valores do seu projeto Supabase.

## Regras de segurança (recomendação)
- Em produção, evite usar a `anon` key com permissões de escrita. Prefira usar autenticação (JWT) ou uma API backend que use a `service_role` key com cuidado e políticas (RLS).
- Configure Row Level Security (RLS) no Supabase caso precise limitar quem pode ver/alterar reservas.

## Rodando localmente
```bash
# dentro da raiz do repositório
python3 -m http.server 8000
# abra http://localhost:8000/ no seu navegador
```

Se `config.js` existir e estiver correto, a aplicação irá tentar carregar e sincronizar reservas com Supabase; caso contrário, continuará usando `localStorage`.

## Observações
- Este é um exemplo simples. Para uso real em produção, implemente autenticação e políticas de segurança adequadas, e trate conflitos de concorrência/overbooking com validação no backend.
- Para depuração, abra o console do navegador para ver mensagens sobre o estado do Supabase.
