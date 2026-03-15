"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingCart, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

const registerHref = "/entrar?modo=register";

export function SiteHeader({ customLogoSrc }: { customLogoSrc?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-[#19E0FF]/10 bg-[#05070B]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 overflow-visible px-4 sm:px-6 lg:px-8">
        <Link href="/" className={customLogoSrc ? "flex items-center" : "flex items-center gap-2.5"}>
          {customLogoSrc ? (
            <Image
              src={customLogoSrc}
              alt="Cabal Legacy"
              width={410}
              height={150}
              className="h-[5rem] w-auto max-w-[410px] translate-y-2 object-contain"
              priority
            />
          ) : (
            <>
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] text-lg font-black text-[#05070B] shadow-[0_12px_28px_rgba(25,224,255,0.24)]">
                  C
                </div>
                <div className="absolute inset-0 -z-10 rounded-[12px] bg-[#19E0FF]/30 blur-md" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none tracking-[0.02em] text-white">Cabal</span>
                <span className="mt-0.5 text-xs font-semibold leading-none tracking-[0.02em] text-[#19E0FF]">Legacy</span>
              </div>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {siteConfig.navigation.map((item) =>
            item.available ? (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                  item.highlight ? "text-[#F7CE46]" : "text-[#A9B2C7] hover:text-white",
                  pathname === item.href && !item.highlight && "text-white",
                )}
              >
                {item.highlight ? <ShoppingCart className="h-4 w-4" /> : null}
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] transition-all duration-300 group-hover:w-full",
                    pathname === item.href && "w-full",
                  )}
                />
              </Link>
            ) : (
              <span key={item.label} className="px-3 py-2 text-sm font-medium text-[#A9B2C7] opacity-90">
                {item.label}
              </span>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/entrar"
            className="rounded-xl border border-[#19E0FF]/30 px-5 py-2 text-sm font-semibold text-[#19E0FF] transition-all hover:bg-[#19E0FF]/10"
          >
            Entrar
          </Link>
          <Link
            href={registerHref}
            className="rounded-xl bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] px-5 py-2 text-sm font-semibold text-[#05070B] transition-all hover:shadow-lg hover:shadow-[#19E0FF]/20"
          >
            Criar Conta
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-expanded={open}
            aria-label="Abrir menu"
            onClick={() => setOpen((current) => !current)}
            className="border-[#19E0FF]/20 bg-transparent text-[#A9B2C7] hover:bg-[#19E0FF]/10 hover:text-white"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[#19E0FF]/10 bg-[#0C121C] px-4 py-4 sm:px-6 lg:hidden">
          <div className="flex flex-col gap-2">
            {siteConfig.navigation.map((item) =>
              item.available ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm transition-colors",
                    pathname === item.href ? "bg-[#19E0FF]/10 text-white" : "text-[#A9B2C7] hover:bg-[#19E0FF]/10 hover:text-white",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.highlight ? <ShoppingCart className="h-4 w-4 text-[#F7CE46]" /> : null}
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span key={item.label} className="rounded-xl px-4 py-3 text-sm text-[#A9B2C7]/70">
                  {item.label}
                </span>
              ),
            )}
            <div className="mt-3 grid gap-2">
              <Link href="/entrar" onClick={() => setOpen(false)} className="rounded-xl border border-[#19E0FF]/30 px-4 py-3 text-center text-sm font-semibold text-[#19E0FF]">
                Entrar
              </Link>
              <Link href={registerHref} onClick={() => setOpen(false)} className="rounded-xl bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] px-4 py-3 text-center text-sm font-semibold text-[#05070B]">
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
