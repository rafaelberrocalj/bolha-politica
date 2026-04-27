# Diretrizes de IA — Minha Bolha Política

Estas diretrizes são agnósticas e devem ser seguidas por qualquer sistema de IA (ChatGPT, Gemini, Claude, Codex, etc.) que interaja com este repositório.

## 1. Regras de Idioma (Mandatório)

- **Código Fonte e Comentários Técnicos:** Devem ser escritos exclusivamente em **Inglês**. Isso inclui nomes de variáveis, funções, classes, tipos (TypeScript), logs de console e comentários dentro dos arquivos de código (`.ts`, `.css`, `.html` na pasta `src/`).
- **Todo o Resto:** Deve ser escrito em **Português (pt-BR)**. Isso inclui:
    - Arquivos de documentação (`.md`).
    - Mensagens de interface para o usuário.
    - Instruções para humanos ou outras IAs.
    - Descrições de Pull Requests.
    - Comunicação direta com o usuário durante o desenvolvimento.
    - Planos de implementação e logs de progresso.

## 2. Princípios de Execução

- **Agnóstico ao Modelo:** Não assuma capacidades específicas de um modelo. Siga padrões de engenharia de software universais e APIs padrão (Chrome Extension MV3, Web APIs).
- **Local-First (Prioridade Máxima):** O projeto foca em privacidade absoluta. Todo conteúdo extraído do Instagram ou gerado pela extensão (resultados, imagens, logs) deve permanecer **exclusivamente local**. Nunca introduza código que faça chamadas remotas ou envie dados para servidores externos. Qualquer tentativa de telemetria ou envio de dados deve ser bloqueada.
- **Minimalismo:** Prefira a solução mais simples e direta. Evite adicionar dependências externas desnecessárias.
- **Contexto Local:** Antes de realizar qualquer alteração, leia os arquivos de contexto em `.agents/rules/` para garantir alinhamento com a arquitetura e tom do projeto.

## 3. Comportamento Esperado

1. **Análise de Contexto:** Sempre verifique se a mudança respeita o `project-context.md`.
2. **Qualidade de Código:** Garanta tipagem forte no TypeScript e evite `any`.
3. **Isolamento de CSS:** Garanta que os estilos injetados não afetem o layout nativo do Instagram.
4. **Respeito ao Usuário:** Mantenha o tom irônico e bem-humorado nos textos da interface, conforme definido nas regras do projeto.

## 4. Revisão e Auditoria

A IA deve auditar seu próprio trabalho e o de terceiros (em reviews de PR) garantindo que:
- Nenhuma violação de privacidade foi introduzida.
- As regras de idioma foram rigorosamente seguidas.
- O código é compatível com Manifest V3.
