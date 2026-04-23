# Minha Bolha Política

Extensão local para navegador que analisa sua bolha política no Instagram usando sua sessão já autenticada.

Ela compara quantos amigos em comum você tem com perfis públicos pré-definidos de esquerda e de direita, mostra percentuais que somam 100%, exibe uma mensagem irônica e permite exportar uma imagem para compartilhar.

Disponível na Chrome Web Store: https://chromewebstore.google.com/detail/minha-bolha-pol%C3%ADtica/flgnjmedoddphfekpjfaggneaeeolhci

> Este projeto não é afiliado ao Instagram.

## Visão geral

A extensão funciona diretamente no navegador e depende do Instagram aberto e logado. Ela injeta a interface sobre a própria página do Instagram, consulta perfis públicos definidos no projeto e calcula o resultado com base nas conexões mútuas.

### Como usar

- Abra uma aba em `https://www.instagram.com/` e certifique-se de estar logado.
- Clique no ícone da extensão.
- Se estiver fora do Instagram, a extensão abre uma aba em `instagram.com` antes de iniciar.
- A interface aparece sobre a página do Instagram, e a análise é executada localmente no navegador.

## Uso rápido

### O que a extensão faz

- Analisa quantos amigos em comum você tem com perfis políticos de esquerda e de direita.
- Exibe dois percentuais que somam 100%.
- Mostra uma mensagem irônica sobre a sua bolha política.
- Gera uma imagem exportável para compartilhar o resultado.

### Requisitos

- Sessão ativa no Instagram.
- Aba aberta em `https://www.instagram.com/`.
- Navegador compatível com extensões Chrome Manifest V3.
- Permissão de host para `https://*.instagram.com/*`.

## Como funciona

### Principais arquivos

- `src/background.ts`
  - Executa as requisições ao Instagram, agrega resultados e mantém o estado temporário de análise.
- `src/popup.ts`
  - Renderiza a interface, mostra progresso, exibe totais e gera a imagem de compartilhamento.
- `src/content.ts`
  - Injeta a interface sobre a página do Instagram.
- `src/content.css`
  - Estiliza o overlay centralizado sobre o Instagram.
- `src/config.ts`
  - Define perfis, mensagens de carregamento e textos irônicos.

## Stack

- TypeScript
- Chrome Extensions Manifest V3
- esbuild
- Prettier

## Permissões usadas

- `host_permissions` para `https://*.instagram.com/*`

Isso é necessário para permitir que o service worker realize consultas ao Instagram enquanto a extensão está ativa.

Manifesto atual:

- [manifest.json](manifest.json)

## Desenvolvimento

### Instalação

```bash
npm install
```

### Build

```bash
npm run build
```

### Modo de desenvolvimento

```bash
npm run watch
```

### Carregar no Chrome

1. Rode `npm run build`.
2. Abra `chrome://extensions`.
3. Ative o `Modo do desenvolvedor`.
4. Clique em `Carregar sem compactação`.
5. Selecione a pasta `dist/`.

## Estrutura do projeto

```text
src/
  background.ts
  content.ts
  content.css
  popup.ts
  popup.html
  popup.css
  config.ts
assets/
  icons/
  webstore/
manifest.json
package.json
README.md
PRIVACY.md
```

## Privacidade

- [PRIVACY.md](PRIVACY.md)

## Instruções para review

- [TEST_INSTRUCTIONS.md](TEST_INSTRUCTIONS.md)
