import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export const metadata: Metadata = {
  title: {
    default: "Cabal Legacy",
    template: "%s | Cabal Legacy",
  },
  description: "Portal local enxuto com conta, rankings, guildas, loja, marketplace ALZ e admin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const customLogoSrc =
    [
      "/logo_L_sem_fundo_transparente_cortado_FINAL.png",
      "/cabal_legacy_sem_fundo_cortado_FINAL.png",
      "/logo-cabal-legacy.png",
      "/logo-cabal-legacy.svg",
      "/logo-cabal-legacy.webp",
      "/logo-cabal-legacy.jpg",
      "/logo-cabal-legacy.jpeg",
      "/cabal_legacy_transparente_preview.png",
    ].find(
      (candidate) => fs.existsSync(path.join(process.cwd(), "public", candidate.replace(/^\//, ""))),
    ) ?? null;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AppProviders>
          <div className="min-h-screen">
            <SiteHeader customLogoSrc={customLogoSrc} />
            {children}
            <SiteFooter customLogoSrc={customLogoSrc} />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
