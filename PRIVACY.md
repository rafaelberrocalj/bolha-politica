# Política de Privacidade

## Resumo

A extensão `Minha Bolha Política` foi desenvolvida para analisar, localmente no navegador do usuário, a relação entre a conta autenticada no Instagram e uma lista fixa de perfis públicos utilizados como referência.

Esta extensão não é afiliada ao Instagram.

## Quais dados são acessados

A extensão acessa apenas:

- a sessão já ativa do usuário no Instagram, para que as requisições autenticadas funcionem
- a quantidade de amigos em comum entre o usuário e os perfis públicos configurados no projeto
- resultados temporários da própria análise, armazenados localmente durante a execução
- os dados visuais necessários para gerar a imagem de compartilhamento local quando o usuário usa essa função

A extensão não solicita nome, email, senha, mensagens, lista completa de seguidores ou qualquer dado além do necessário para calcular os totais comparativos exibidos na interface.

## Como os dados são usados

Os dados são usados exclusivamente para:

- calcular os totais de afinidade entre os perfis classificados como `esquerda` e `direita`
- exibir o resultado no popup da extensão
- permitir a geração da imagem de compartilhamento com o resumo do resultado
- baixar essa imagem localmente no navegador do usuário quando solicitado

## Armazenamento

Os resultados da análise são armazenados temporariamente em `chrome.storage.session`.

Isso significa que:

- os dados ficam disponíveis apenas durante a sessão da extensão/navegador
- os dados não são persistidos como histórico permanente do usuário pela própria extensão
- os dados podem ser descartados ao reiniciar a sessão ou ao resetar a análise

## Compartilhamento de dados

A extensão não envia os resultados da análise para servidores próprios, bancos de dados próprios ou ferramentas externas de analytics mantidas pelo projeto.

As comunicações de rede feitas pela extensão são requisições para o domínio do Instagram necessárias para consultar os dados públicos usados no cálculo.

Na prática, isso significa que:

- a extensão se comunica com o Instagram para obter os dados necessários à análise
- cookies de sessão, cabeçalhos e demais dados normalmente envolvidos nessas requisições continuam sujeitos às políticas e ao funcionamento do próprio Instagram
- a extensão não replica esses dados para servidores próprios do projeto

## Venda de dados

A extensão não vende, aluga, comercializa ou compartilha dados pessoais com terceiros para fins de publicidade.

## Controle do usuário

O usuário pode:

- interromper o uso da extensão a qualquer momento
- resetar a análise dentro da interface
- deixar de gerar a imagem de compartilhamento se não quiser exportar o resultado
- remover a extensão do navegador quando desejar

## Segurança

O projeto busca operar com o menor conjunto possível de permissões e manter o processamento principal no ambiente local da extensão.

## Limitações importantes

- a extensão depende da estrutura atual das respostas da web do Instagram
- mudanças na API ou no comportamento do Instagram podem afetar o funcionamento
- o resultado produzido é uma interpretação comparativa baseada em uma lista fixa de perfis e não representa classificação política objetiva ou definitiva do usuário
- esta política descreve o comportamento atual do projeto e deve ser revisada sempre que houver mudanças nas permissões, no fluxo de coleta ou no armazenamento

## Contato e manutenção

Se esta política precisar ser usada em produção na Chrome Web Store, é recomendável complementar este documento com:

- nome do responsável pelo projeto
- email de contato
- URL pública da política de privacidade
- data de vigência
