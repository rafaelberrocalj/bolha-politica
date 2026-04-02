# Skill: Instagram Request Interception (Atualizado: Background Fetch)

## Quando usar esta skill

Use quando precisar capturar dados restritos que o Instagram carrega internamente — especialmente o número de amigos em comum e contadores escondidos — mantendo a extensão leve e usando fetch direto no service worker. A interface do projeto atual pode ser injetada sobre a própria página do Instagram.

---

## Como o Instagram entrega o dado

Historicamente, o dado vinha encapsulado num GraphQL gigante. Hoje o endpoint mais confiável (embora protegido) é a rota interna Web Profile Info:
`https://www.instagram.com/api/v1/users/web_profile_info/?username={username}`

Nela, o campo alvo reside dentro de:
`data.user.edge_mutual_followed_by.count` ou `data.user.edge_mutual_followed_by_count`

---

## A Evolução: Background Fetch (Estratégia Atual)

No passado, precisávamos injetar content scripts (`monkey patching` do `window.fetch`) e abrir abas escondidas para interceptar respostas. Isso sujava a sessão do usuário, demorava e era instável.

Agora, a coleta usa **fetch direto via Background Service Worker** do Manifest V3. O content script do projeto atual é usado apenas para abrir a interface sobre a página do Instagram, não para interceptar `fetch`.

### Regras de Ouro para o Fetch no Background (MANDATÓRIO)

O Instagram possui *Rate Limiters* severos e *CORS* estritos. Para o Fetch direto funcionar silenciosamente pela extensão:

1. **Permissões de Host:** O `manifest.json` **precisa** declarar `"host_permissions": ["https://*.instagram.com/*"]`. Isso garante que os cookies de autenticação do usuário logado fluam na requisição.
2. **X-IG-App-ID:** O Instagram rejeita com erro `403` ou falha qualquer Request sem identificação. É *crucial* injetar o header:
    `'X-IG-App-ID': '936619743392459'` (ID Clássico Padrão do Instagram Web).
3. **Mime type:** Passar `'X-Requested-With': 'XMLHttpRequest'`.

```typescript
// Exemplo canônico na extensão
async function fetchProfileData(username: string) {
  const endpointUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  
  const response = await fetch(endpointUrl, {
    method: 'GET',
    headers: {
      'X-IG-App-ID': '936619743392459',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
  return await response.json();
}
```

---

## Orquestração e Evitação de Bloqueios ("Rate Limits")

- **Sem paralelismo agressivo:** Nunca dispare dezenas de fetchs simultaneamente (`Promise.all()`). Use laços assíncronos `for...of` para limitar o ritmo de chamadas.
- **Tratamento de Exceções Lógicas:** Contadores podem vir como `null` ou inexistentes dependendo das regras de privacidade do alvo. SEMPRE valide `payload?.data?.user?.edge_mutual_followed_by` via Optional Chaining antes de definir a contagem.

---

## Armadilhas solucionadas nesta arquitetura

- **Receiving end does not exist:** Quando usamos Service Workers enviando mensagens (`chrome.runtime.sendMessage`) para atualizar as barrinhas de progresso no popup, o popup fechado dá crash na Promessa. Crie wrappers defensivos vazios para ignorar o `lastError`.
- **Overlay no Instagram:** No projeto atual, o clique no ícone deve abrir a interface sobre a própria página do Instagram. Se o usuário não estiver em `instagram.com`, a extensão abre uma nova aba do Instagram, espera a página carregar e então envia uma mensagem ao content script para abrir o overlay.
- **Estado reiniciado por clique:** No projeto atual, cada clique no ícone deve resetar a análise para o estado inicial antes de exibir a interface.
