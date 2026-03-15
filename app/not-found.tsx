import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-2xl border-[#19E0FF]/18 bg-[#06101A]/92 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <CardContent className="px-8 py-12 text-center sm:px-12">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#19E0FF]">404</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Página não encontrada</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#A9B2C7]">
              O endereço informado não existe ou não está disponível no portal Cabal Legacy.
            </p>
            <Link href="/" className={buttonVariants({ className: "mt-8" })}>
              Voltar para a página inicial
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}