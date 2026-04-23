// Static data configuration and environment constants for Minha Bolha Politica Extension

export type Profile = {
  username: string;
  name: string;
  side: "left" | "right";
  url: string;
};

export const PROFILES: Profile[] = [
  // Left-wing profiles
  {
    username: "lulaoficial",
    name: "Lula",
    side: "left",
    url: "https://www.instagram.com/lulaoficial/",
  },
  {
    username: "janjalula",
    name: "Janja",
    side: "left",
    url: "https://www.instagram.com/janjalula/",
  },
  {
    username: "fernandohaddadoficial",
    name: "Haddad",
    side: "left",
    url: "https://www.instagram.com/fernandohaddadoficial/",
  },
  {
    username: "guilhermeboulos.oficial",
    name: "Boulos",
    side: "left",
    url: "https://www.instagram.com/guilhermeboulos.oficial/",
  },

  // Right-wing profiles
  {
    username: "jairmessiasbolsonaro",
    name: "Bolsonaro",
    side: "right",
    url: "https://www.instagram.com/jairmessiasbolsonaro/",
  },
  {
    username: "flaviobolsonaro",
    name: "Flávio",
    side: "right",
    url: "https://www.instagram.com/flaviobolsonaro/",
  },
  {
    username: "nikolasferreiradm",
    name: "Nikolas",
    side: "right",
    url: "https://www.instagram.com/nikolasferreiradm/",
  },
  {
    username: "michellebolsonaro",
    name: "Michelle",
    side: "right",
    url: "https://www.instagram.com/michellebolsonaro/",
  },
];

export const RANDOM_SUBTITLES = [
  "Descubra quão fundo você está no seu cercadinho ideológico.",
  "O raio-x do seu algoritmo de estimação, sem anestesia.",
  "Sua chance de provar que não é gado de ninguém... será?",
  "Preparado para descobrir de qual lado do muro seu feed mora?",
  "A hora do juízo final para as suas curtidas no Instagram.",
  "Uma agulha de sensatez no palheiro da polarização... ou não.",
];

export const RANDOM_LOADING_MESSAGES = [
  "Infiltrando nos perfis (e segurando a vontade de ler os comentários)...",
  "Puxando os dados no sigilo (relaxa, nada sai do seu PC)...",
  "Calculando o nível de radiação política do seu feed...",
  "Distribuindo foices e martelos para os algoritmos...",
  "Lustrando coturnos virtuais e preparando o relatório...",
  "Fazendo uma regra de três complexa (ou quase isso)...",
];

// Structural mapping from layout to localized strings
export const IRONIC_MESSAGES = {
  LEFT_DOMINANT: [
    "Sua bolha tem cheiro de mortadela fresca no ar. O MST já acampou no seu celular? ⛺",
    "Companheiro, se a sua bolha fosse um carro, ele só faria curva para a esquerda. 🚗",
    "Seu feed é uma assembleia do sindicato constante. ✊",
    "Cuidado para não esbarrar numa pauta identitária ou na próxima taxa federal na próxima rolagem. 💸",
    "O seu feed é tão vermelho que a antiga União Soviética ficaria orgulhosa camarada. ☭",
  ],
  RIGHT_DOMINANT: [
    "Seu feed tá mais verde e amarelo do que você pensa. Cuidado que o algoritmo vai pedir intervenção militar! 🪖",
    "Capitão, a cloroquina tá em dia? O pneu de caminhão tá pronto pra cantar hino? 🫡",
    "Sua bolha é um legítimo churrasco de domingo no quartel com direito a motociata de Pix. 🏍️",
    "Você é tão de direita que seu Wi-Fi só pega se estiver enrolado na bandeira do Brasil, talquei? 🇧🇷",
    "Seus amigos estão a dois posts de montar um acampamento na frente de um regimento virtual. 🏕️",
  ],
  BALANCED: [
    "Parabéns, você é um verdadeiro isentão orgulhoso. Nem mortadela, nem coxinha. Você almoça o quê? 🍽️",
    "Você vive em cima do muro. Cuidado que esse muro aí tá causando dor nas costas, hein. 🧱",
    "Seu feed é a perfeita Suíça do algoritmo: neutro, blindado e sem tomar posição. 🇨🇭",
    "Mestre Jedi das redes sociais, a Força está equilibrada no seu cercadinho de tretas. ⚖️",
    "Incrível, o seu algoritmo não sabe se te vende toalha ou te manda pro quartel. 🤝",
  ],
  EMPTY: [
    "Sua bolha é um deserto. Nem comunistas, nem patriotas. Você usa a internet só pra ver meme de gato? 🐈",
    "Ninguém na sua rede social liga pra política. A inveja que eu tenho da sua paz de espírito é gigante. ✨",
    "Você alcançou o Nirvana digital. Zero estresse, zero política. E zero amigos influentes também. 🧘‍♂️",
  ],
};
