import Link from "next/link";
import Image from "next/image";
import { Mail, MessageCircle, Twitch, Youtube } from "lucide-react";

export function SiteFooter({ customLogoSrc }: { customLogoSrc?: string | null }) {
  return (
    <footer className="border-t border-[#19E0FF]/10 bg-[#05070B]">
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4">
              {customLogoSrc ? (
                <Image
                  src={customLogoSrc}
                  alt="Cabal Legacy"
                  width={390}
                  height={140}
                  className="h-[4.75rem] w-auto max-w-[390px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] text-lg font-black text-[#05070B] shadow-[0_12px_28px_rgba(25,224,255,0.24)]">
                      C
                    </div>
                    <div className="absolute inset-0 -z-10 rounded-[12px] bg-[#19E0FF]/25 blur-md" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-none tracking-[0.02em] text-white">Cabal</span>
                    <span className="mt-0.5 text-xs font-semibold leading-none tracking-[0.02em] text-[#19E0FF]">Legacy</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed text-[#A9B2C7]">
              Seu portal em Nevareth. Private CABAL Online Server com visual clássico, rankings, guildas, loja premium e mercado ALZ.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Links rápidos</h3>
            <ul className="space-y-2 text-sm text-[#A9B2C7]">
              <li><Link href="/rankings" className="hover:text-[#19E0FF]">Ranking</Link></li>
              <li><Link href="/guildas" className="hover:text-[#19E0FF]">Guildas</Link></li>
              <li><Link href="/mercado" className="hover:text-[#19E0FF]">Mercado</Link></li>
              <li><Link href="/loja" className="hover:text-[#19E0FF]">Loja</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Recursos</h3>
            <ul className="space-y-2 text-sm text-[#A9B2C7]">
              <li><Link href="/suporte" className="hover:text-[#19E0FF]">Suporte</Link></li>
              <li><Link href="/conta" className="hover:text-[#19E0FF]">Minha Conta</Link></li>
              <li><Link href="/entrar" className="hover:text-[#19E0FF]">Login</Link></li>
              <li><Link href="/entrar?modo=register" className="hover:text-[#19E0FF]">Criar Conta</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Comunidade</h3>
            <div className="flex gap-3">
              <a href="https://discord.gg/caballegacy" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#19E0FF]/20 bg-[#0C121C] text-[#A9B2C7] transition-all hover:border-[#19E0FF]/50 hover:text-[#19E0FF]">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="https://youtube.com/@caballegacy" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#19E0FF]/20 bg-[#0C121C] text-[#A9B2C7] transition-all hover:border-[#FF4B6A]/50 hover:text-[#FF4B6A]">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://twitch.tv/caballegacy" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#19E0FF]/20 bg-[#0C121C] text-[#A9B2C7] transition-all hover:border-purple-400/50 hover:text-purple-400">
                <Twitch className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-4">
              <a href="mailto:suporte@caballegacy.com" className="inline-flex items-center gap-2 text-sm text-[#A9B2C7] transition-colors hover:text-[#19E0FF]">
                <Mail className="h-4 w-4" />
                suporte@caballegacy.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#19E0FF]/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#A9B2C7]">© 2026 Cabal Legacy. Todos os direitos reservados.</p>
          <p className="text-xs text-[#A9B2C7]/60">Portal local independente e sem vínculo oficial com a publicadora original.</p>
        </div>
      </div>
    </footer>
  );
}
