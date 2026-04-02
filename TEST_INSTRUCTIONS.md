# Instruções de Teste para Review

## Pré-requisitos

- Estar logado em uma conta válida do Instagram no navegador.
- Permitir que a extensão seja carregada normalmente no Chrome.

## Fluxo principal esperado

1. Clique no ícone da extensão.
2. Se a aba atual não estiver em `instagram.com`, a extensão abrirá uma nova aba do Instagram.
3. Após o carregamento do Instagram, a interface da extensão aparecerá sobre a própria página.
4. Clique em `Iniciar Análise`.
5. Aguarde a coleta dos perfis configurados.
6. Verifique o resultado:
   - mensagem irônica no card superior
   - barras comparativas de `Esquerda` e `Direita`
   - card percentual final abaixo das barras
   - botão `Gerar Imagem para Storie`
   - imagem exportada em proporção de storie do Instagram com o card percentual final destacado

## Comportamentos importantes

- A interface não usa `default_popup` do navegador.
- A interface não abre em aba separada da extensão.
- A interface é exibida como overlay sobre a própria página do Instagram.
- Cada clique no ícone da extensão reinicia a interface no estado inicial.

## Cenário de erro esperado

Se o usuário não estiver logado no Instagram, ou se o Instagram bloquear a requisição, a interface deve exibir uma mensagem de erro visível em vez de ficar travada indefinidamente.

## Permissões e dados

- A extensão usa apenas `host_permissions` para `https://*.instagram.com/*`.
- Nenhum dado do usuário é enviado para servidores próprios.
- Os dados temporários da análise são mantidos localmente apenas para suportar a execução da extensão.
