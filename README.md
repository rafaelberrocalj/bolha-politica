# Minha Bolha Política

Extensão de navegador que analisa sua bolha política no Instagram com base em conexões mútuas com perfis públicos pré-definidos. O resultado mostra um comparativo entre `esquerda` e `direita`, exibe uma mensagem irônica e permite gerar uma imagem para compartilhamento.

Este projeto não é afiliado ao Instagram.

## Visão geral

A extensão foi construída para funcionar localmente no navegador e usa a sessão já autenticada do usuário no Instagram para consultar dados públicos de perfis configurados no projeto.

Importante:

- o fluxo da extensão depende de contexto ativo do `instagram.com`
- se o usuário clicar no ícone fora do Instagram, a extensão abre uma nova aba do Instagram antes de mostrar sua interface
- se o usuário já estiver em `instagram.com`, a interface da extensão é aberta sobre a própria página, sem popup e sem aba separada para a interface
- cada clique no ícone reinicia a interface no estado inicial de `Iniciar Análise`

Fluxo principal:

- ao clicar no ícone, verifica se a aba atual está em `instagram.com`
- se não estiver, abre uma nova aba do Instagram antes de exibir a interface da extensão
- a interface é exibida como painel sobre a própria página do Instagram
- consulta perfis públicos definidos no projeto
- lê a quantidade de amigos em comum com cada perfil
- agrega os resultados por lado político
- mostra uma mensagem irônica e, abaixo das barras, um card percentual destacado do tipo `Seus amigos tendem a ser X% para ESQUERDA/DIREITA`
- mostra um resumo visual na interface da extensão
- permite exportar uma imagem em proporção de storie para Instagram, baixada localmente pelo navegador

## Como funciona

Os principais pontos do projeto são:

- [background.ts](src/background.ts)
  Faz as requisições ao Instagram, agrega os resultados, reseta a interface a cada clique no ícone e persiste estado temporário local apenas para tolerar o ciclo de vida do service worker no MV3 durante a execução.
- [popup.ts](src/popup.ts)
  Renderiza a interface da extensão, acompanha o progresso via mensagens com o background, exibe os totais, trata falhas de forma visível, mostra o percentual final em um card destacado abaixo das barras e gera a imagem de compartilhamento.
- [content.ts](src/content.ts)
  Injeta a interface da extensão sobre a própria página do Instagram quando o usuário clica no ícone.
- [content.css](src/content.css)
  Controla o overlay centralizado da interface sobre a página do Instagram.
- [config.ts](src/config.ts)
  Centraliza a lista de perfis analisados, subtítulos, mensagens de carregamento e textos irônicos.

## Stack

- TypeScript
- Chrome Extensions Manifest V3
- esbuild
- Prettier

## Permissões usadas

O projeto usa o menor conjunto de permissões necessário para funcionar no estado atual:

- `host_permissions` para `https://*.instagram.com/*`
  Usada para permitir as requisições à API web do Instagram a partir do service worker da extensão.

Manifesto atual:

- [manifest.json](manifest.json)

## Requisitos

- Node.js 20+ recomendado
- npm
- Google Chrome ou navegador compatível com extensões MV3
- sessão ativa no Instagram
- acesso ao `instagram.com` no navegador no momento de uso

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

## Política de Privacidade

A política de privacidade do projeto está em:

- [PRIVACY.md](PRIVACY.md)

## Instruções para Review

Um passo a passo enxuto para reviewers e testes manuais está em:

- [TEST_INSTRUCTIONS.md](TEST_INSTRUCTIONS.md)

## Observações

- a interface da extensão é aberta a partir do clique no ícone e o fluxo exige contexto do Instagram
- fora do Instagram, o clique abre primeiro uma nova aba em `https://www.instagram.com/` e só então mostra a interface
- a interface não abre em popup nem em aba separada da extensão; ela aparece sobre a página do Instagram
- cada clique no ícone reinicia a análise no estado inicial, mesmo que exista um resultado anterior
- o estado temporário da análise pode ser preservado localmente pelo navegador apenas para recuperar a execução se o service worker reiniciar durante uma análise em andamento
- se no futuro a extensão migrar para `side panel`, a experiência pode ficar mais persistente
- se o fluxo de coleta mudar, a política de privacidade também deve ser revisada para continuar fiel ao comportamento real do código
- a extensão depende da resposta atual da web do Instagram e pode parar de funcionar se a estrutura da plataforma mudar
