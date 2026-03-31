---
trigger: always_on
---

# Minha Bolha Política — Project Context

## O que é este projeto

Extensão de navegador Chrome chamada **Minha Bolha Política**.

Analisa a bolha política do usuário logado no Instagram, mostrando quantos dos seus amigos também seguem perfis políticos pré-definidos — começando com Lula e Bolsonaro.

O resultado é exibido com tom bem-humorado e irônico, provocando o usuário de forma leve sobre a bolha em que vive.

---

## Como funciona (lógica central)

O Instagram, ao carregar qualquer perfil, já exibe nativamente uma frase do tipo:

> "Seguido por fulano, ciclano e mais **X pessoas que você segue**"

Esse número é calculado pelo próprio Instagram no servidor deles e entregue pronto via uma requisição interna (GraphQL/fetch) da interface web.

**A extensão apenas captura esse número silenciosamente através de Background Fetch usando os cookies nativos e o X-IG-App-ID.**

Fluxo Atualizado:

1. Usuário abre a extensão na página do Instagram.
2. O Service Worker (background) enfileira requisições REST diretas para a rota `web_profile_info`.
3. Adiciona pausas randômicas (_Anti-Bot Jitter_) para evitar Shadowban.
4. Calcula a proporção e consolida em blocos (Esquerda vs Direita).
5. Exibe o resultado e a proporção de bolha final no Popup.

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

## Stack

- **Linguagem Foco:** TypeScript e CSS
- **Código e Comentários:** Tudo (variáveis, métodos, logs e comments - até no CSS) deve ser escrito em Inglês como regra fundamental. Apenas textos da UI pro usuário podem ser em Português.
- **Manifest:** V3 (padrão atual do Chrome)
- **Construção Segura (Linter):** Sempre rodar linter de formatação automático antes de iniciar o build (ex: prettier incluído).
- **Sem frameworks de UI.** O popup deve ser minimalista e local.
- **Sem dependências externas desnecessárias.**

---

## Regras de privacidade (inegociáveis)

- Nenhum dado do usuário é enviado para servidor externo
- Todo processamento acontece localmente no browser do usuário
- Nenhum dado é armazenado — a análise é feita no momento e descartada
- Não usa a API oficial do Instagram (Graph API)

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
│   │   └── project-context.md
│   └── skills/
│       └── instagram-interception/
│           └── SKILL.md
├── .specify/
│   └── memory/
│       └── constitution.md
├── src/
│   ├── background.ts        # service worker — faz as requests REST direto via fetch anti-bot
│   ├── popup.ts             # lógica orgânica e renderização DOM
│   ├── popup.html           # interface de blocos
│   └── popup.css            # estilização visual com feedback
├── manifest.json
├── tsconfig.json
└── package.json
```
