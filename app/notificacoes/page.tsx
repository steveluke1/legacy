import { BellRing, CheckCheck, Mail, ShieldAlert } from "lucide-react";

import { requireUserSession } from "@/server/auth/guards";
import { NotificationService } from "@/server/services/notifications/notificationService";
import { NotificationList } from "@/components/notifications/notification-list";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";

const notificationService = new NotificationService();

export default async function NotificationsPage() {
  const session = await requireUserSession();
  const notifications = await notificationService.listByUserId(session.user!.id);
  const unread = notifications.filter((notification) => !notification.readAt).length;

  return (
    <PageShell>
      <section className="space-y-6">
        <div className="portal-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="max-w-4xl">
            <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Notificações</Badge>
            <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Central de mensagens do jogador</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#A9B2C7]">Consulte avisos do mercado, compras, carteira e atualizações da sua conta em um só lugar.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Mensagens</p><p className="portal-metric-value">{notifications.length}</p></div>
          <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Não lidas</p><p className="portal-metric-value">{unread}</p></div>
          <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Status</p><p className="mt-3 text-xl font-semibold text-white">Caixa local</p></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="portal-panel overflow-hidden">
            <div className="border-b border-[#19E0FF]/10 px-6 py-5">
              <p className="portal-pill">Resumo</p>
              <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Painel de mensagens</h2>
              <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Leitura consolidada do portal, seguindo o mesmo painel visual da área privada antiga.</p>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-3">
              <div className="portal-list-row"><BellRing className="h-5 w-5 text-[#19E0FF]" /><p className="mt-4 font-semibold text-white">Alertas do servidor</p><p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Comunicados rápidos do sistema, loja e mercado local.</p></div>
              <div className="portal-list-row"><Mail className="h-5 w-5 text-[#F7CE46]" /><p className="mt-4 font-semibold text-white">Leitura rápida</p><p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Tudo consolidado em uma única rota com visual do portal.</p></div>
              <div className="portal-list-row"><CheckCheck className="h-5 w-5 text-[#19E0FF]" /><p className="mt-4 font-semibold text-white">Controle local</p><p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Marque mensagens como lidas sem depender de backend externo.</p></div>
            </div>
          </section>

          <section className="portal-panel overflow-hidden">
            <div className="border-b border-[#19E0FF]/10 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="portal-pill">Histórico</p>
                  <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Caixa de entrada</h2>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-[#19E0FF]/10 text-[#19E0FF] md:flex">
                  <ShieldAlert className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <NotificationList notifications={notifications} />
            </div>
          </section>
        </div>
      </section>
    </PageShell>
  );
}
