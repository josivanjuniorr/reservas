# Reservas (Hotel Padre Cícero)

Este repositório contém uma aplicação de gerência de reservas (HTML/CSS/JS) que utiliza **Supabase como banco de dados**.

## 🚀 Configuração do Supabase

⚠️ **IMPORTANTE**: Se você está vendo o aviso "Supabase não configurado", siga os passos abaixo:

### Passo 1: Criar a Tabela no Banco de Dados

1. Acesse seu projeto Supabase: https://app.supabase.com/project/abcjhhzqyknvgashtpbm
2. Vá para **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **New Query**
4. Copie o conteúdo do arquivo [`database.sql`](./database.sql) deste repositório
5. Cole no editor e clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a mensagem de sucesso ✅

### Passo 2: Verificar a Configuração

O arquivo `config.js` já está configurado com suas credenciais:
- URL: `https://abcjhhzqyknvgashtpbm.supabase.co`
- Anon Key: Configurada ✅

### Passo 3: Testar a Aplicação

Após criar a tabela, recarregue a página da aplicação. O aviso não deve mais aparecer.

## 📁 Estrutura do Projeto

- `index.html` - Interface principal
- `app.js` - Lógica de negócios
- `supabase-integration.js` - Integração com Supabase
- `config.js` - Credenciais do Supabase (já configurado)
- `database.sql` - Script SQL para criar a tabela
- `styles.css` - Estilos da aplicação

## 🌐 Acesso

Site publicado: **https://josivanjuniorr.github.io/reservas/**

## ❓ Resolução de Problemas

**Problema**: Aviso "Supabase não configurado"
- **Solução**: Execute o script `database.sql` no SQL Editor do Supabase (Passo 1 acima)

**Problema**: Erro ao salvar reservas
- **Solução**: Verifique se a tabela `reservas` existe no banco de dados
- Verifique o console do navegador (F12) para detalhes do erro



