# Como obter URL e Anon Key do Supabase

## Passo 1: Acesse seu projeto Supabase
1. Vá para https://app.supabase.com/
2. Faça login com sua conta
3. Clique no seu projeto na lista

## Passo 2: Vá para as configurações da API
1. No menu esquerdo, procure por **Settings** (engrenagem ⚙️)
2. Clique em **API** (ou **Configuration**)

## Passo 3: Copie URL e Anon Key

Você verá algo como:

```
Project URL:     https://xxxxxxxxxxx.supabase.co
Anon Key:        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (não use este)
```

### URL
- Procure por **Project URL** ou **API URL**
- Deve estar no formato: `https://YOUR_PROJECT_REF.supabase.co`
- Clique no ícone de copiar ao lado

### Anon Key
- Procure por **Anon Key** ou **Public API Key** (anon key é pública)
- É uma string longa começando com `eyJ...`
- Clique no ícone de copiar ao lado

## Passo 4: Preecha config.js

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://xxxxxxxxxxx.supabase.co',  // Cole aqui
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Cole aqui
};
```

## ⚠️ Importante

- **Nunca compartilhe a Anon Key em público** (GitHub, internet, etc.)
- Use `.gitignore` para não commitar `config.js` acidentalmente
- A Anon Key é pública, mas use Row Level Security (RLS) para proteger dados

---

Se não conseguir encontrar, abra o console do navegador (F12) e procure por mensagens de erro que indicarão o que falta.
