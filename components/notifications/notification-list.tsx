"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { NotificationRecord } from "@/lib/types/notification";
import { formatDateTime } from "@/lib/formatters";
import { useAppUi } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const NOTIFICATION_KIND_LABELS: Record<string, string> = {
  order: "Pedido",
  shop: "Loja",
  wallet: "Carteira",
  system: "Sistema",
};

export function NotificationList({ notifications }: { notifications: NotificationRecord[] }) {
  const router = useRouter();
  const { pushToast } = useAppUi();
  const [pendingTarget, setPendingTarget] = useState<string | "all" | null>(null);

  async function markOne(notificationId: string) {
    setPendingTarget(notificationId);

    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        pushToast(data.error ?? "Falha ao marcar notificação.", "error");
        return;
      }

      pushToast("Notificação marcada como lida.", "success");
      router.refresh();
    } finally {
      setPendingTarget(null);
    }
  }

  async function markAll() {
    setPendingTarget("all");

    try {
      const response = await fetch("/api/notifications/read-all", { method: "POST" });
      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        pushToast(data.error ?? "Falha ao marcar todas as notificações.", "error");
        return;
      }

      pushToast("Todas as notificações foram marcadas como lidas.", "success");
      router.refresh();
    } finally {
      setPendingTarget(null);
    }
  }

  if (notifications.length === 0) {
    return <div className="portal-empty">Nenhuma notificação disponível no momento.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="portal-subpanel flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="portal-metric">Mensagens registradas</p>
          <p className="mt-2 text-sm text-[#A9B2C7]">{notifications.length} notificações no histórico local.</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={pendingTarget !== null} onClick={() => void markAll()}>
          {pendingTarget === "all" ? "Atualizando..." : "Marcar todas como lidas"}
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => {
          const isPending = pendingTarget === notification.id;

          return (
            <article key={notification.id} className="portal-list-row">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={notification.readAt ? "border-white/10 bg-white/5 text-[#7B8AA7]" : "border-[#19E0FF]/20 bg-[#0D2432] text-[#19E0FF]"}>
                      {NOTIFICATION_KIND_LABELS[notification.kind] ?? "Aviso"}
                    </Badge>
                    {!notification.readAt ? (
                      <Badge className="border-[#F7CE46]/20 bg-[#2A2110]/70 text-[#F7CE46]">Nova</Badge>
                    ) : null}
                    <span className="text-xs text-[#7B8AA7]">{formatDateTime(notification.createdAt)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
                  <p className="max-w-3xl text-sm leading-6 text-[#A9B2C7]">{notification.body}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingTarget !== null || !!notification.readAt}
                  onClick={() => void markOne(notification.id)}
                >
                  {notification.readAt ? "Lida" : isPending ? "Marcando..." : "Marcar como lida"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
