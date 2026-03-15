export const siteConfig = {
  name: "Cabal Legacy",
  description: "Servidor privado de CABAL com conta local, rankings, guildas, loja e mercado ALZ.",
  navigation: [
    { label: "Início", href: "/", highlight: false, available: true },
    { label: "Ranking", href: "/rankings", highlight: false, available: true },
    { label: "Enquete", href: "/enquetes", highlight: false, available: true },
    { label: "Loja", href: "/loja", highlight: true, available: true },
    { label: "Guildas", href: "/guildas", highlight: false, available: true },
    { label: "TG ao Vivo", href: "/tg-ao-vivo", highlight: false, available: true },
    { label: "Mercado", href: "/mercado", highlight: false, available: true },
    { label: "Suporte", href: "/suporte", highlight: false, available: true },
  ],
} as const;
