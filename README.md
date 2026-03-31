# Minha Bolha Política

Extensão de navegador que analisa sua bolha política no Instagram com base em conexões mútuas com perfis públicos pré-definidos. O resultado mostra um comparativo entre `esquerda` e `direita`, gera uma mensagem irônica e permite exportar uma imagem para compartilhamento.

## O que o projeto faz

- Abre ou redireciona o usuário para o Instagram ao clicar no ícone da extensão.
- Consulta perfis públicos configurados no projeto.
- Lê a quantidade de amigos em comum com cada perfil.
- Soma os resultados por lado político.
- Exibe o resultado em uma interface simples dentro da extensão.
- Gera uma imagem pronta para compartilhar.

## Como funciona

O fluxo principal está dividido em dois pontos:

- [background.ts](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/src/background.ts)
  Responsável por abrir o popup, buscar os dados no Instagram, agregar os resultados e salvar o estado em `chrome.storage.session`.
- [popup.ts](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/src/popup.ts)
  Responsável por renderizar a interface, mostrar o progresso, exibir o resultado final e gerar a imagem de compartilhamento.

Os perfis analisados, mensagens aleatórias e textos irônicos ficam em [config.ts](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/src/config.ts).

## Stack

- TypeScript
- Chrome Extensions Manifest V3
- esbuild
- Prettier

## Requisitos

- Node.js 20+ recomendado
- npm
- Google Chrome ou navegador compatível com extensões MV3
- Sessão ativa no Instagram para obter os dados corretamente

## Instalação local

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
.github/workflows/
  release-extension.yml
manifest.json
package.json
```

## Geração de release

O projeto possui um workflow em [release-extension.yml](/Users/rafaelberrocalj/LocalDocuments/GitHub/bolha-politica/.github/workflows/release-extension.yml) que:

- dispara em cada `push` para a branch `main`
- instala dependências
- roda o build
- empacota a pasta `dist/` em `.zip`
- cria uma GitHub Release automaticamente com o arquivo anexado

Isso permite baixar facilmente a versão compilada da extensão direto pela aba de Releases do GitHub.

## Privacidade

O projeto foi pensado para rodar localmente no navegador. Os dados analisados são usados apenas para montar o resultado da interface durante a execução local da extensão.

## Observações

- A leitura depende da estrutura atual das respostas do Instagram. Se a API interna mudar, a extensão pode precisar de ajuste.
- O projeto usa uma lista fixa de perfis para comparar os resultados.
- O popup da extensão é temporário por natureza no Chrome. Para uma interface persistente, o caminho ideal seria migrar para `side panel`.
