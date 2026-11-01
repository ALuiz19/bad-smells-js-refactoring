# Análise manual de `src/ReportGenerator.js`

Anotações feitas antes de rodar o ESLint, lendo o código original.

## Situação inicial

- `npm test` não executava: o projeto usa ESM (`"type": "module"`) e o Jest rodava sem `--experimental-vm-modules`. O script `test` foi ajustado, sem mudar nenhum teste.
- Com o script ajustado, 4 de 5 testes passavam. O teste de HTML do Admin falhava porque o código gerava `<tr ><td>` e o teste espera `<tr><td>`.
- O espaço foi corrigido no arquivo original antes da refatoração, para a rede de segurança começar verde.

## Smells encontrados

### 1. Método Longo (`generateReport`, linhas 11 a 68)

Um único método monta o cabeçalho, filtra os itens por papel, marca prioridade, formata as linhas, soma o total e monta o rodapé. Para mudar qualquer parte é preciso entender o método inteiro, e os testes só conseguem exercitar tudo junto.

### 2. Código Duplicado

- A linha CSV aparece 2 vezes (linhas 36 e 47, nos ramos de Admin e User).
- A linha HTML aparece 2 vezes (linhas 40 e 50).
- `total += item.value` aparece 4 vezes.

Uma mudança no formato da linha ou na regra do total precisa ser repetida em cada ramo. Esquecer um deles gera um relatório diferente por papel, e foi assim que o bug do `<tr >` existiu só no ramo de Admin.

### 3. Condicionais repetidas sobre o tipo do relatório

`reportType === 'CSV'` e `reportType === 'HTML'` aparecem em 4 blocos separados (cabeçalho, linha do Admin, linha do User e rodapé). Incluir um novo formato exige alterar os 4 pontos. A combinação com `user.role` cria caminhos aninhados, que são a principal causa da complexidade.

### Outros pontos

- Números mágicos: `500` e `1000`, sem nome que explique a regra.
- Strings mágicas: `'CSV'`, `'HTML'`, `'ADMIN'` e `'USER'`.
- Efeito colateral: `item.priority = true` altera o objeto recebido por parâmetro.
- Campo sem uso: `this.db` é guardado no construtor e nunca lido.

## Comparação com o ESLint

Resultado de `npx eslint src/`:

| Regra | Linha | Relação com a análise manual |
|---|---|---|
| `sonarjs/cognitive-complexity` (27, limite 5) | 11 | Confirma o Método Longo e dá um número para ele |
| `sonarjs/no-collapsible-if` | 43 | Não estava nas anotações: o `else if` do papel e o `if` do valor podem ser um só |

O ESLint não apontou a duplicação das linhas CSV e HTML, as condicionais repetidas, os números mágicos nem o efeito colateral. Esses pontos só apareceram na leitura do código.
