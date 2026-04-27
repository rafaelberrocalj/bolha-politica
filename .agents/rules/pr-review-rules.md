# Regras de Revisão de PR — Minha Bolha Política

Qualquer revisão de Pull Request (PR) neste repositório deve seguir estas regras rigorosamente.

## 1. Verificações de Idioma

- O código alterado/adicionado está em **Inglês**? (Identificadores, lógica, comentários técnicos).
- Os textos de interface, documentação (`.md`) e descrições da PR estão em **Português (pt-BR)**?
- **Bloqueie** qualquer PR que misture esses contextos ou use o idioma errado.

## 2. Verificações de Segurança e Privacidade

- **Bloqueio de Chamadas Remotas (Prioridade Máxima):** Verifique rigorosamente se não há chamadas para `fetch`, `XMLHttpRequest` ou qualquer outra forma de comunicação remota que não seja para os endpoints autorizados do Instagram. Nenhum conteúdo extraído ou gerado (ex: imagens de compartilhamento) pode sair do navegador.
- **Vazamento de Dados:** Verifique se dados sensíveis (cookies, tokens, amigos em comum) não estão sendo expostos ou persistidos de forma permanente.
- **Dependências:** Alguma dependência externa nova foi adicionada? Se sim, verifique se ela não possui telemetria oculta ou chamadas de rede.

## 3. Verificações Técnicas

- **Manifest V3:** A mudança é compatível com o ciclo de vida do MV3?
- **CSS Isolation:** Os novos estilos usam prefixos ou seletores que garantem que não haverá conflito com o Instagram?
- **TypeScript:** A tipagem está correta e evita o uso de `any`?
- **Performance:** As requisições ao Instagram são feitas de forma otimizada para evitar bloqueios por rate limit?

## 4. Tom e Estilo

- O tom irônico e bem-humorado da aplicação foi preservado nos textos voltados ao usuário?
- A interface permanece limpa e premium, seguindo os padrões definidos no projeto?

## 5. Critérios de Aprovação

- [ ] Sem violações de privacidade.
- [ ] Idiomas aplicados corretamente (Código: EN, Docs/UI: PT-BR).
- [ ] Compatível com Manifest V3.
- [ ] Sem bugs aparentes de lógica.
- [ ] Mudança segue o escopo solicitado.
