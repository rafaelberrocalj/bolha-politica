# Constituição — Minha Bolha Política

Estas regras são não negociáveis. Nenhuma decisão de implementação pode violá-las.

---

## Privacidade

- **Zero dados no servidor.** Nenhuma informação do usuário logado pode ser enviada para qualquer servidor externo, incluindo o servidor deste projeto.
- **Persistência local apenas temporária e funcional.** Se necessário para tolerar o ciclo de vida do service worker no MV3, a extensão pode usar armazenamento local temporário. Isso não pode virar histórico permanente, sincronização em nuvem ou base de retenção do usuário.
- **Zero API oficial.** A Graph API do Instagram não deve ser usada em nenhuma hipótese.

## Técnica

- **Inglês estrito e obrigatório.** Todo o código-fonte (nomenclatura de variáveis), lógica interna, e todos os comentários (em `.ts`, `.js`, e `.css`) devem ser escritos apenas em Inglês. As mensagens da Interface com Usuário podem permanecer em PT-BR.
- **Formatação Auto-Linting.** O comando de `build` é obrigatório que execute e limpe todo o estilo do projeto com um linter (como Prettier) automaticamente antes de compilar os recursos para a pasta final.
- **TypeScript obrigatório.** Nenhum arquivo de lógica pode ser escrito em JavaScript puro.
- **Manifest V3.** A extensão deve seguir o padrão atual do Chrome. Manifest V2 não é aceito.
- **Sem frameworks de UI.** Nenhum React, Vue, Svelte ou similar. A interface deve ser HTML/CSS/TS puro.
- **Sem dependências externas desnecessárias.** Cada dependência adicionada precisa de justificativa clara.

## Produto

- **Perfis fixos.** A lista de políticos a comparar é definida no código pelo dono do projeto, não pelo usuário.
- **Tom não ofensivo.** O resultado deve ser bem-humorado e irônico, nunca agressivo ou partidário de forma explícita.
- **Análise dividida em blocos ideológicos fixados.** Em vez de comparar duas personalidades de forma crua, a arquitetura mapeia lados ou grupos (ex: Direita vs Esquerda, totalizando aproximadamente 8 pessoas) para uma predição mais estável do feed.
- **UI sobre o Instagram.** A interface principal deve abrir sobre a própria página do Instagram, não em popup nativo do browser.
- **Reinício por clique.** Cada clique no ícone da extensão deve reabrir a interface no estado inicial de começar a análise.
- **Mensagem percentual final.** O resultado final deve incluir uma mensagem percentual separada da mensagem irônica, posicionada abaixo das barras comparativas e destacada com a cor dominante do lado vencedor.
