export type Evangelist = "Mateus" | "Marcos" | "Lucas" | "João";

export type CatenaCard = {
  evangelist: Evangelist;
  reference: string;
  kind: "direta" | "temática" | "sem_paralelo";
  commentary: string;
  fathers: string;
  gospelText: string;
};

export type Harmony = {
  id: string;
  title: string;
  shortTitle: string;
  aliases: string[];
  primary: {
    evangelist: CatenaCard["evangelist"];
    reference: string;
    text: string;
  };
  catena: CatenaCard[];
};

export const harmonies: Harmony[] = [
  {
    id: "cura-do-paralitico",
    title: "A cura do paralítico e o perdão dos pecados",
    shortTitle: "Cura do paralítico",
    aliases: ["Marcos 2 1 12", "Mateus 9 1 8", "Lucas 5 17 26", "paralitico", "perdao dos pecados"],
    primary: {
      evangelist: "Marcos",
      reference: "Marcos 2,1-12",
      text: "Vendo Jesus a fé que tinham, disse ao paralítico: Meu filho, perdoados te são os pecados.",
    },
    catena: [
      {
        evangelist: "Mateus",
        reference: "Mateus 9,1-8",
        kind: "direta",
        commentary: "Os Padres destacam que Cristo começa pela cura invisível da alma e confirma, pela cura do corpo, sua autoridade divina para perdoar pecados.",
        fathers: "Crisóstomo · Jerônimo · Hilário",
        gospelText: "Tem confiança, meu filho; os teus pecados te são perdoados.",
      },
      {
        evangelist: "Marcos",
        reference: "Marcos 2,1-12",
        kind: "direta",
        commentary: "A abertura do teto torna-se imagem da fé perseverante: os que carregam o paralítico vencem os obstáculos e o apresentam diretamente ao Salvador.",
        fathers: "Beda · Teofilato · Crisóstomo",
        gospelText: "Vendo Jesus a fé que tinham, disse ao paralítico: Meu filho, perdoados te são os pecados.",
      },
      {
        evangelist: "Lucas",
        reference: "Lucas 5,17-26",
        kind: "direta",
        commentary: "Lucas evidencia a presença do poder do Senhor para curar. A palavra de perdão revela a divindade de Cristo antes que o milagre se torne visível a todos.",
        fathers: "Ambrósio · Cirilo · Beda",
        gospelText: "Homem, os teus pecados te são perdoados.",
      },
      {
        evangelist: "João",
        reference: "João 5,1-9",
        kind: "temática",
        commentary: "Não há paralelo narrativo direto, mas a cura junto à piscina manifesta a mesma palavra eficaz de Cristo, que levanta o homem de sua enfermidade.",
        fathers: "Agostinho · Crisóstomo · Teofilato",
        gospelText: "Levanta-te, toma o teu leito e anda.",
      },
    ],
  },
  {
    id: "batismo-de-jesus",
    title: "O batismo de Jesus no Jordão",
    shortTitle: "Batismo de Jesus",
    aliases: ["Mateus 3 13 17", "Marcos 1 9 11", "Lucas 3 21 22", "Joao 1 29 34", "jordao", "batismo"],
    primary: {
      evangelist: "Mateus",
      reference: "Mateus 3,13-17",
      text: "Este é meu Filho muito amado, em quem pus toda a minha afeição.",
    },
    catena: [
      {
        evangelist: "Mateus",
        reference: "Mateus 3,13-17",
        kind: "direta",
        commentary: "Cristo não procura purificação para si: entra nas águas para santificá-las e cumprir toda a justiça, inaugurando o batismo dos fiéis.",
        fathers: "Jerônimo · Crisóstomo · Agostinho",
        gospelText: "Este é meu Filho muito amado, em quem pus toda a minha afeição.",
      },
      {
        evangelist: "Marcos",
        reference: "Marcos 1,9-11",
        kind: "direta",
        commentary: "Os céus abertos indicam que, pelo batismo, o caminho do Reino torna-se acessível; a pomba manifesta a mansidão e a unidade do Espírito.",
        fathers: "Beda · Teofilato · Jerônimo",
        gospelText: "Tu és o meu Filho amado; em ti ponho minha afeição.",
      },
      {
        evangelist: "Lucas",
        reference: "Lucas 3,21-22",
        kind: "direta",
        commentary: "Lucas associa o batismo à oração de Jesus. A voz do Pai e a descida do Espírito revelam conjuntamente o mistério da Trindade.",
        fathers: "Ambrósio · Cirilo · Gregório",
        gospelText: "Tu és o meu Filho bem-amado; em ti ponho minha afeição.",
      },
      {
        evangelist: "João",
        reference: "João 1,29-34",
        kind: "direta",
        commentary: "O Batista reconhece o Cordeiro de Deus pelo sinal do Espírito que desce e permanece sobre Ele, testemunhando que Jesus é o Filho de Deus.",
        fathers: "Agostinho · Crisóstomo · Alcuíno",
        gospelText: "Eu vi e dou testemunho de que ele é o Filho de Deus.",
      },
    ],
  },
  {
    id: "ressurreicao",
    title: "A ressurreição do Senhor",
    shortTitle: "Ressurreição",
    aliases: ["Mateus 28", "Marcos 16", "Lucas 24", "Joao 20", "sepulcro vazio", "ressurreicao"],
    primary: {
      evangelist: "João",
      reference: "João 20,1-18",
      text: "Viu e creu. Em verdade, ainda não haviam entendido a Escritura, segundo a qual Jesus devia ressuscitar dentre os mortos.",
    },
    catena: [
      {
        evangelist: "Mateus",
        reference: "Mateus 28,1-10",
        kind: "direta",
        commentary: "O terremoto, o anjo e a pedra removida não tornam possível a ressurreição; manifestam aos discípulos aquilo que o poder divino já realizou.",
        fathers: "Jerônimo · Hilário · Crisóstomo",
        gospelText: "Não está aqui: ressuscitou como disse.",
      },
      {
        evangelist: "Marcos",
        reference: "Marcos 16,1-8",
        kind: "direta",
        commentary: "As mulheres levam aromas a quem julgavam morto e recebem, no lugar do corpo, o anúncio pascal: Ele ressuscitou, não está aqui.",
        fathers: "Beda · Gregório · Teofilato",
        gospelText: "Ele ressuscitou, já não está aqui. Eis o lugar onde o depositaram.",
      },
      {
        evangelist: "Lucas",
        reference: "Lucas 24,1-12",
        kind: "direta",
        commentary: "Os mensageiros celestes reconduzem as mulheres à palavra de Cristo. A memória do que Ele predissera prepara a passagem do temor à fé.",
        fathers: "Ambrósio · Cirilo · Beda",
        gospelText: "Por que buscais entre os mortos aquele que está vivo? Não está aqui, mas ressuscitou.",
      },
      {
        evangelist: "João",
        reference: "João 20,1-18",
        kind: "direta",
        commentary: "Pedro e João correm juntos, mas chegam de modos distintos ao mistério. Os panos ordenados testemunham que não se tratou de remoção humana do corpo.",
        fathers: "Agostinho · Crisóstomo · Gregório",
        gospelText: "Viu e creu. Ainda não haviam entendido a Escritura, segundo a qual Jesus devia ressuscitar dentre os mortos.",
      },
    ],
  },
];
