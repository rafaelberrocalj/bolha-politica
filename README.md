# Minha Bolha Política

Extensão de navegador que analisa sua bolha política no Instagram com base em conexões mútuas com perfis públicos pré-definidos. O resultado mostra um comparativo entre `esquerda` e `direita`, exibe uma mensagem irônica e permite gerar uma imagem para compartilhamento.

Este projeto não é afiliado ao Instagram.

## Visão geral

A extensão foi construída para funcionar localmente no navegador e usa a sessão já autenticada do usuário no Instagram para consultar dados públicos de perfis configurados no projeto.

Fluxo principal:

- abre uma nova aba do Instagram caso o usuário não esteja em uma aba do Instagram
- consulta perfis públicos definidos no projeto
- lê a quantidade de amigos em comum com cada perfil
- agrega os resultados por lado político
- mostra um resumo visual no popup
- gera uma imagem pronta para compartilhar, baixada localmente pelo navegador

## Como funciona

Os principais pontos do projeto são:

- [background.ts](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/src/background.ts)
  Controla a abertura da extensão, abre o Instagram quando necessário, faz as requisições ao Instagram, agrega os resultados e salva o estado temporário da análise.
- [popup.ts](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/src/popup.ts)
  Renderiza a interface, acompanha o progresso, exibe os totais e gera a imagem de compartilhamento.
- [config.ts](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/src/config.ts)
  Centraliza a lista de perfis analisados, subtítulos, mensagens de carregamento e textos irônicos.

## Stack

- TypeScript
- Chrome Extensions Manifest V3
- esbuild
- Prettier

## Permissões usadas

O projeto usa o menor conjunto de permissões necessário para funcionar no estado atual:

- `storage`
  Usada para guardar temporariamente os resultados da análise em `chrome.storage.session`.
- `host_permissions` para `https://*.instagram.com/*`
  Usada para permitir as requisições à API web do Instagram a partir do service worker da extensão.

Manifesto atual:

- [manifest.json](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/manifest.json)

## Requisitos

- Node.js 20+ recomendado
- npm
- Google Chrome ou navegador compatível com extensões MV3
- sessão ativa no Instagram

## Instalação

```bash
npm install
```

## Desenvolvimento

Para gerar o build da extensão:

```bash
npm run build
```

Para acompanhar mudanças durante o desenvolvimento:

```bash
npm run watch
```

## Como carregar a extensão no Chrome

1. Rode `npm run build`.
2. Abra `chrome://extensions`.
3. Ative o `Modo do desenvolvedor`.
4. Clique em `Carregar sem compactação`.
5. Selecione a pasta `dist/`.

## Estrutura do projeto

```text
src/
  background.ts
  popup.ts
  popup.html
  popup.css
  config.ts
assets/
  icon-brazil.svg
  icons/
  store/
.github/workflows/
  release-extension.yml
manifest.json
package.json
README.md
PRIVACY.md
```

## Release manual

O projeto possui um workflow em [release-extension.yml](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/.github/workflows/release-extension.yml) para gerar releases sob demanda no GitHub Actions.

Esse workflow:

- instala dependências
- roda o build
- empacota a pasta `dist/` em `.zip`
- cria uma GitHub Release com o arquivo anexado

Para usar:

1. abra a aba `Actions` no GitHub
2. selecione o workflow `Release Extension`
3. clique em `Run workflow`

## Política de Privacidade

A política de privacidade do projeto está em:

- [PRIVACY.md](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/PRIVACY.md)

## Observações

- o popup da extensão continua sendo temporário por natureza no Chrome
- se no futuro a extensão migrar para `side panel`, a experiência pode ficar mais persistente
- se o fluxo de coleta mudar, a política de privacidade também deve ser revisada para continuar fiel ao comportamento real do código
- a extensão depende da resposta atual da web do Instagram e pode parar de funcionar se a estrutura da plataforma mudar
