# Guia de Debug - Sistema de Reservas

## Problema: Reservas não são salvas no banco

### ⚠️ ERRO COMUM: "Could not find the 'endDate' column"

Se você vê este erro no console:
```
❌ Erro no teste: {code: 'PGRST204', details: null, hint: null, 
message: "Could not find the 'endDate' column of 'reservas' in the schema cache"}
```

**Causa:** A tabela foi criada com nomes de colunas em minúsculas (enddate) em vez de camelCase (endDate).

**Solução:**

1. Acesse o SQL Editor do Supabase: https://app.supabase.com/project/SEU_PROJECT/sql

2. Execute o script `database-fix.sql` completo

   OU copie e cole este comando:
   ```sql
   DROP TABLE IF EXISTS reservas CASCADE;
   
   CREATE TABLE reservas (
     id TEXT PRIMARY KEY,
     "guestName" TEXT NOT NULL,
     phone TEXT,
     "roomType" TEXT NOT NULL,
     "startDate" DATE NOT NULL,
     "endDate" DATE NOT NULL,
     notes TEXT,
     price NUMERIC(10, 2),
     responsible TEXT,
     "onClipboard" BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Execute as políticas RLS (copie do arquivo `database.sql`)

4. Recarregue a página e teste novamente

### Checklist de Verificação

1. **Abra o Console do Navegador (F12)**
   - Procure por mensagens de erro em vermelho
   - Verifique se há mensagens começando com ❌

2. **Verifique a Inicialização do Supabase**
   
   Ao carregar a página, você deve ver:
   ```
   🔄 Iniciando conexão com Supabase...
   📝 Config encontrada: { url: '...' }
   🔄 Inicializando Supabase diretamente...
   ✅ Cliente Supabase criado: OK
   ✅ Carregadas X reservas do Supabase
   ```

3. **Teste a Conexão Manualmente**
   
   No console do navegador, execute:
   ```javascript
   window.testSupabase()
   ```
   
   Você deve ver:
   ```
   🧪 Iniciando teste de salvamento...
   ✅ Teste bem-sucedido! Dados salvos: [...]
   ```

4. **Ao Salvar uma Reserva**
   
   Você deve ver:
   ```
   🔄 Sincronizando 1 reservas com Supabase...
   ✅ Sincronização com Supabase concluída com sucesso
   ```

### Erros Comuns

#### ❌ SUPABASE_CONFIG não encontrado
**Solução:** Certifique-se de que o arquivo `config.js` existe e contém:
```javascript
window.SUPABASE_CONFIG = {
  url: 'sua-url-do-supabase',
  anonKey: 'sua-chave-anon'
};
```

#### ❌ Biblioteca Supabase não carregada
**Solução:** Verifique se o script do Supabase está sendo carregado no `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js"></script>
```

#### ❌ Erro ao carregar reservas: Row Level Security
**Solução:** Execute o arquivo `database.sql` completo no SQL Editor do Supabase para criar as políticas RLS corretas.

#### ❌ sbClient não está inicializado
**Solução:** Recarregue a página e verifique se não há erros na inicialização.

### Verificar Políticas RLS no Supabase

1. Acesse: https://app.supabase.com/project/SEU_PROJECT/editor
2. Vá em "Authentication" > "Policies"
3. Verifique se a tabela `reservas` tem as 4 políticas:
   - Permitir leitura pública (SELECT)
   - Permitir inserção pública (INSERT)
   - Permitir atualização pública (UPDATE)
   - Permitir exclusão pública (DELETE)

### Teste Manual no Supabase

No SQL Editor do Supabase, execute:

```sql
-- Testar inserção
INSERT INTO reservas (id, guestName, roomType, startDate, endDate)
VALUES ('test-manual', 'Teste Manual', 'duplo', '2025-12-10', '2025-12-11');

-- Verificar se foi inserido
SELECT * FROM reservas WHERE id = 'test-manual';

-- Limpar teste
DELETE FROM reservas WHERE id = 'test-manual';
```

Se o teste manual funcionar, mas a aplicação não, o problema é na conexão JavaScript.

### Logs Importantes

Todos os logs do sistema usam emojis para facilitar identificação:
- 🔄 = Operação em andamento
- ✅ = Sucesso
- ❌ = Erro
- ⚠️ = Aviso
- 🧪 = Teste
- 💡 = Dica
- 📝 = Informação
