# 📜 Sistema de Auditoria - Documentação

## ✨ Funcionalidades Implementadas

O sistema agora rastreia **automaticamente** todas as ações realizadas nas reservas:

- ✅ **Criação**: Quem criou a reserva e quando
- ✅ **Edição**: Quem editou, quando e quais campos foram alterados
- ✅ **Exclusão**: Quem excluiu e quando
- ✅ **Histórico completo**: Timeline visual de todas as alterações
- ✅ **Informações do usuário**: Email e nome de quem fez cada ação

## 🎯 Como Funciona

### Auditoria Automática (Triggers)

Toda vez que uma reserva é:
- **Criada** → Registra automaticamente no histórico
- **Editada** → Detecta quais campos mudaram e registra
- **Excluída** → Salva snapshot antes de excluir

### Campos Rastreados

Para cada ação, o sistema salva:
- **ID da reserva**
- **Tipo de ação** (INSERT/UPDATE/DELETE)
- **ID do usuário** (UUID do auth.users)
- **Email do usuário**
- **Timestamp** (data e hora exata)
- **Campos alterados** (apenas em UPDATE)
- **Valores antigos e novos** (JSON completo)

## 🚀 Como Configurar

### Passo 1: Executar SQL de Auditoria

1. Acesse o SQL Editor do Supabase:
   ```
   https://app.supabase.com/project/SEU_PROJECT/sql
   ```

2. Execute o arquivo `audit-setup.sql` **completo**

3. Isso irá criar:
   - Campos `created_by` e `updated_by` na tabela `reservas`
   - Tabela `reservas_audit` para histórico
   - Triggers automáticos para rastreamento
   - View `reservas_audit_view` para consultas fáceis
   - Função `get_reserva_history()` para buscar histórico

### Passo 2: Verificar Configuração

Execute no SQL Editor:

```sql
-- Ver políticas criadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('reservas', 'reservas_audit');

-- Ver triggers ativos
SELECT tgname, tgtype 
FROM pg_trigger 
WHERE tgrelid = 'reservas'::regclass;
```

## 📋 Como Usar

### Ver Informações de Auditoria nos Cards

Cada card de reserva agora mostra:
```
📝 Criado: 06/12/2025 14:30:00
✏️ Atualizado: 06/12/2025 16:45:00
```

### Ver Histórico Completo

1. Clique no botão **"📜 Histórico"** em qualquer reserva

2. Uma modal será exibida com timeline de todas as alterações

3. Cada entrada mostra:
   - **Ação** (Criado/Editado/Excluído)
   - **Data e hora**
   - **Usuário responsável**
   - **Campos alterados** (em caso de edição)

### Exemplo de Timeline

```
✨ Criado
06/12/2025 14:30:00
👤 usuario@exemplo.com

✏️ Editado
06/12/2025 15:15:00
👤 admin@exemplo.com
Campos alterados: price startDate

✏️ Editado
06/12/2025 16:45:00
👤 usuario@exemplo.com
Campos alterados: notes onClipboard
```

## 🔍 Consultas SQL Úteis

### Ver últimas 10 ações no sistema

```sql
SELECT 
  action,
  user_email,
  reserva_id,
  timestamp
FROM reservas_audit_view
LIMIT 10;
```

### Ver histórico de uma reserva específica

```sql
SELECT * FROM get_reserva_history('ID_DA_RESERVA');
```

### Ver quem criou mais reservas

```sql
SELECT 
  user_email,
  COUNT(*) as total_criadas
FROM reservas_audit
WHERE action = 'INSERT'
GROUP BY user_email
ORDER BY total_criadas DESC;
```

### Ver quem editou mais reservas

```sql
SELECT 
  user_email,
  COUNT(*) as total_edicoes
FROM reservas_audit
WHERE action = 'UPDATE'
GROUP BY user_email
ORDER BY total_edicoes DESC;
```

### Ver alterações nas últimas 24 horas

```sql
SELECT 
  action,
  user_email,
  changed_fields,
  timestamp
FROM reservas_audit
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

## 🎨 Interface Visual

### Botão de Histórico

Novo botão azul em cada reserva:
- **Cor**: Gradiente azul (#60a5fa → #3b82f6)
- **Ícone**: 📜
- **Texto**: "Histórico"
- **Ação**: Abre modal com timeline

### Modal de Histórico

- **Design**: Card moderno com max-width 700px
- **Conteúdo**: Timeline vertical com efeitos
- **Hover**: Items se destacam e deslocam
- **Tags**: Campos alterados em tags coloridas
- **Responsivo**: Ajusta para mobile

### Timeline de Auditoria

- **Background**: Cinza claro com hover
- **Borda esquerda**: 4px roxa (accent color)
- **Animação**: Slide para direita no hover
- **Tags de campos**: Background roxo com texto branco

## 🔒 Segurança

### Proteção de Dados

- ✅ Apenas usuários **autenticados** podem ver auditoria
- ✅ Histórico é **read-only** (não pode ser editado)
- ✅ Triggers executam como **SECURITY DEFINER**
- ✅ Usuário registrado automaticamente (não pode falsificar)

### Row Level Security (RLS)

Política aplicada na tabela `reservas_audit`:
```sql
CREATE POLICY "Usuários autenticados podem ler auditoria"
  FOR SELECT TO authenticated USING (true);
```

## 📊 Dados Armazenados

### Estrutura da Tabela `reservas_audit`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único do registro de auditoria |
| reserva_id | TEXT | ID da reserva afetada |
| action | TEXT | INSERT, UPDATE ou DELETE |
| user_id | UUID | ID do usuário (auth.users) |
| user_email | TEXT | Email do usuário |
| changed_fields | JSONB | Campos alterados (UPDATE) |
| old_values | JSONB | Valores antes da alteração |
| new_values | JSONB | Valores depois da alteração |
| timestamp | TIMESTAMPTZ | Data/hora da ação |

### Campos Rastreados em `reservas`

| Campo | Descrição |
|-------|-----------|
| created_by | UUID do usuário que criou |
| updated_by | UUID do último usuário que editou |
| created_at | Data/hora de criação |
| updated_at | Data/hora da última atualização |

## 🧪 Testar Auditoria

### Teste Manual

1. **Crie uma reserva** → Verifique que aparece "Criado: [data]"

2. **Edite a reserva** → Verifique que aparece "Atualizado: [data]"

3. **Clique em Histórico** → Veja as 2 entradas (criado + editado)

4. **Edite novamente** → Clique em Histórico → Veja 3 entradas

5. **Verifique campos alterados** → Devem aparecer tags coloridas

### Teste via SQL

```sql
-- Criar teste
INSERT INTO reservas (id, "guestName", "roomType", "startDate", "endDate")
VALUES ('test-audit', 'Teste Auditoria', 'duplo', '2025-12-10', '2025-12-11');

-- Ver auditoria
SELECT * FROM reservas_audit WHERE reserva_id = 'test-audit';

-- Atualizar
UPDATE reservas SET price = 150 WHERE id = 'test-audit';

-- Ver novamente
SELECT * FROM reservas_audit WHERE reserva_id = 'test-audit';

-- Limpar
DELETE FROM reservas WHERE id = 'test-audit';
```

## 📱 Responsividade

A interface de auditoria é totalmente responsiva:

- ✅ **Desktop**: Timeline espaçada com hover effects
- ✅ **Tablet**: Ajuste de espaçamentos
- ✅ **Mobile**: Stack vertical otimizado

## 🎯 Benefícios

### Para Gestão
- 📊 **Transparência**: Saber quem fez o quê
- 🔍 **Rastreabilidade**: Histórico completo de mudanças
- 🛡️ **Segurança**: Auditoria à prova de adulteração
- 📈 **Analytics**: Dados para análise de uso

### Para Usuários
- ✅ **Confiança**: Sistema transparente
- 🕐 **Histórico visual**: Fácil de entender
- 👥 **Colaboração**: Saber quem editou

## 🔧 Manutenção

### Limpar Auditoria Antiga

Para liberar espaço, pode-se limpar registros antigos:

```sql
-- Deletar auditoria com mais de 1 ano
DELETE FROM reservas_audit
WHERE timestamp < NOW() - INTERVAL '1 year';
```

### Backup de Auditoria

```sql
-- Exportar para CSV via Supabase Dashboard
-- Ou fazer backup periódico:
COPY reservas_audit TO '/tmp/audit_backup.csv' CSV HEADER;
```

## 📚 Próximas Melhorias

Sugestões para evolução:

- [ ] Exportar histórico para PDF
- [ ] Filtrar histórico por usuário/período
- [ ] Dashboard de analytics de auditoria
- [ ] Notificações de alterações importantes
- [ ] Restaurar versão anterior (rollback)
- [ ] Comparação visual entre versões

---

**Sistema de auditoria completo e profissional implementado!** 📜✨
