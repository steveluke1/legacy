import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageCircle, Youtube, Twitch, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#05070B] border-t border-[#19E0FF]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-lg flex items-center justify-center">
                <span className="text-[#05070B] font-black text-lg">L</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-wider">Legacy of</span>
                <span className="text-[#19E0FF] text-xs font-semibold tracking-wide -mt-0.5">Nevareth</span>
              </div>
            </div>
            <p className="text-[#A9B2C7] text-sm leading-relaxed">
              Your portal to Nevareth. Private CABAL Online Server with the best gaming experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl('Ranking')} className="text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors">
                  Ranking
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Guildas')} className="text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors">
                  Guildas
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Mercado')} className="text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors">
                  Mercado
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Recursos</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl('Suporte')} className="text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors">
                  Suporte
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('MinhaConta')} className="text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors">
                  Minha Conta
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Entrar')} className="text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Registrar')} className="text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors">
                  Criar Conta
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Comunidade</h3>
            <div className="flex gap-3">
              <a
                href="https://discord.gg/legacyofnevareth"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg flex items-center justify-center text-[#A9B2C7] hover:text-[#19E0FF] hover:border-[#19E0FF]/50 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@legacyofnevareth"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg flex items-center justify-center text-[#A9B2C7] hover:text-[#FF4B6A] hover:border-[#FF4B6A]/50 transition-all"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://twitch.tv/legacyofnevareth"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg flex items-center justify-center text-[#A9B2C7] hover:text-purple-400 hover:border-purple-400/50 transition-all"
              >
                <Twitch className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-4">
              <a
                href="mailto:support@legacyofnevareth.com"
                className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-[#19E0FF] text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@legacyofnevareth.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#19E0FF]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A9B2C7] text-sm">
            © 2025 Legacy of Nevareth. All rights reserved.
          </p>
          <p className="text-[#A9B2C7]/50 text-xs">
            This is a private server not affiliated with ESTsoft Corp.
          </p>
        </div>
      </div>
    </footer>
  );
}