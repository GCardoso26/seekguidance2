# User Rules — Cursor (backup 2026-06-08)

Regras configuradas pelo usuário que orientam o comportamento do agente.

---

## committing-changes-with-git

- Só criar commits quando o usuário pedir explicitamente
- **Nunca** alterar `git config`
- **Nunca** comandos destrutivos (`push --force`, `hard reset`) sem pedido explícito
- **Nunca** pular hooks (`--no-verify`) sem pedido explícito
- **Nunca** force push para `main`/`master` — avisar o usuário
- Evitar `git commit --amend` exceto quando todas as condições forem atendidas
- Se commit falhar por hook, corrigir e criar **novo** commit (não amend)
- Antes de commit: `git status`, `git diff`, `git log` em paralelo
- Mensagem via HEREDOC; foco no "porquê"
- Não commitar arquivos com segredos (`.env`, credentials)
- Não fazer push sem pedido explícito
- Não usar flags interativas (`git rebase -i`, `git add -i`)

---

## creating-pull-requests

- Usar `gh` para tarefas GitHub
- Antes do PR: status, diff, tracking remoto, log desde base branch
- Push com `-u` se necessário; corpo do PR via HEREDOC
- Retornar URL do PR ao finalizar

---

## Regras gerais de código

1. **Minimizar escopo** — diff simples e focado
2. **Evitar over-engineering** — sem abstrações desnecessárias
3. **Seguir convenções existentes** do repositório
4. **Comentários** só para lógica não óbvia
5. **Testes** só quando pedidos ou com valor real

---

## Comunicação

- Responder **sempre em Português**
- Usar citações de código no formato `startLine:endLine:filepath`
- Links completos (sem encurtar URLs)
- Prosa clara; evitar excesso de negrito/backticks
- Respostas proporcionais à complexidade da tarefa

---

## Ambiente

- Ambiente real com shell e rede — executar comandos, não desistir na primeira falha
- Seguir skills, regras de sistema e instruções de MCP quando relevantes

---

## Nota Vercel Hobby

Commits com `Co-authored-by: Cursor` podem bloquear deploy em plano Hobby. O usuário deve commitar manualmente no PowerShell quando necessário.
