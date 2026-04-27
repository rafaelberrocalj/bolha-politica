---
trigger: always_on
---

# Minha Bolha Política — Project Context

## O que é este projeto

Extensão de navegador Chrome chamada **Minha Bolha Política**.

Analisa a bolha política do usuário logado no Instagram, mostrando quantos dos seus amigos em comum aparecem associados a perfis políticos pré-definidos divididos entre esquerda e direita.

O resultado é exibido com tom bem-humorado e irônico, provocando o usuário de forma leve sobre a bolha em que vive, junto com uma mensagem percentual final.

---

## Como funciona (lógica central)

O Instagram, ao carregar qualquer perfil, já exibe nativamente uma frase do tipo:

> "Seguido por fulano, ciclano e mais **X pessoas que você segue**"

Esse número é calculado pelo próprio Instagram no servidor deles e entregue pronto via uma requisição interna (GraphQL/fetch) da interface web.

**A extensão captura esse número através de fetch direto no service worker, usando os cookies nativos e o `X-IG-App-ID`.**

Fluxo Atualizado:

1. Usuário clica no ícone da extensão.
2. Se a aba atual não estiver em `instagram.com`, a extensão abre o Instagram primeiro.
3. A interface é exibida como overlay sobre a própria página do Instagram, sem popup nativo e sem aba separada para a UI.
4. O service worker faz requisições REST diretas para a rota `web_profile_info`.
5. A análise agrega os resultados em blocos `left` e `right`.
6. O resultado final mostra a mensagem irônica, as barras comparativas e a mensagem percentual abaixo das barras.
7. Cada novo clique no ícone reinicia a interface no estado inicial.

---

## Perfis monitorados (fixos no código)

```typescript
const PROFILES = [
  // Bloco Esquerda (4 perfis representativos)
  { username: "lulaoficial", label: "Lula", side: "left", url: "..." },
  // ... (Haddad, Janja, Boulos)

  // Bloco Direita (4 perfis representativos)
  {
    username: "jairmessiasbolsonaro",
    label: "Bolsonaro",
    side: "right",
    url: "...",
  },
  // ... (Michelle, Flávio, Nikolas)
];
```

---

## Stack e Diretrizes de IA

- **Linguagem Foco:** TypeScript e CSS.
- **Regras de Idioma:**
    - **Código e Comentários:** Tudo que for código-fonte (`src/`), incluindo variáveis, métodos, logs e comentários técnicos, deve ser escrito em **Inglês**.
    - **Todo o Resto:** Arquivos de documentação (`.md`), textos da UI, instruções de IA e comunicações devem ser em **Português (pt-BR)**.
- **Diretrizes de IA:** Qualquer IA atuando neste projeto deve seguir rigorosamente as regras em [.agents/rules/ai-instructions.md](file:///Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/.agents/rules/ai-instructions.md) e [.agents/rules/pr-review-rules.md](file:///Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/.agents/rules/pr-review-rules.md).
- **Manifest:** V3 (padrão atual do Chrome).
- **Construção Segura (Linter):** Sempre rodar linter de formatação automático antes de iniciar o build (ex: prettier incluído).
- **Sem frameworks de UI:** A interface deve ser HTML/CSS/TS puro, injetada sobre o Instagram.
- **Sem dependências externas desnecessárias.**

---

## Regras de privacidade (inegociáveis)

- Nenhum dado do usuário é enviado para servidor externo. **Chamadas remotas para qualquer domínio que não seja o Instagram são estritamente proibidas.**
- Todo processamento e geração de conteúdo acontece localmente no browser do usuário.
- Apenas persistência local temporária estritamente funcional é aceitável para tolerar o ciclo de vida do service worker no MV3; isso não pode virar histórico permanente do usuário.
- Não usa a API oficial do Instagram (Graph API) e não faz telemetria.

---

## Tom do resultado

Bem-humorado e irônico. Quanto mais desequilibrado o resultado, mais provocativa a frase.

Exemplos:

- "Sua bolha tem cheiro de petróleo 🛢️" (maioria segue Lula)
- "Seu feed tá mais verde e amarelo do que você pensa 🟡🟢" (maioria segue Bolsonaro)
- "Parabéns, você é oficialmente ambidestro político 🤝" (resultado equilibrado)

---

## Estrutura de pastas esperada

```
bolha-politica/
├── .agents/
│   ├── rules/
│   │   ├── project-context.md   # Contexto mestre do projeto
│   │   ├── ai-instructions.md   # Diretrizes de comportamento de IA
│   │   └── pr-review-rules.md   # Regras para revisão de PRs
│   └── skills/
│       └── instagram-interception/
│           └── SKILL.md
├── docs/
│   ├── privacy.md               # Política de privacidade
│   └── test-instructions.md     # Guia de testes manuais
├── src/
│   ├── background.ts            # Service worker (logic/requests)
│   ├── content.ts               # Overlay injection
│   ├── content.css              # Overlay styling
│   ├── popup.ts                 # UI logic and rendering
│   ├── popup.html               # UI structure
│   ├── popup.css                # UI styling
│   └── config.ts                # App configuration (profiles/messages)
├── assets/                      # Icons and static assets
├── manifest.json
├── tsconfig.json
└── package.json
```
