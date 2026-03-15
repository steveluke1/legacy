"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAppUi } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  endpoint: string;
  redirectTo: string;
  children: React.ReactNode;
}

export function LogoutButton({ endpoint, redirectTo, children }: LogoutButtonProps) {
  const router = useRouter();
  const { pushToast } = useAppUi();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setError(null);
    setPending(true);

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!response.ok || data?.success === false) {
        const message = data?.error ?? "Falha ao encerrar a sessão.";
        setError(message);
        pushToast(message, "error");
        return;
      }

      pushToast("Sessão encerrada com sucesso.", "success");
      router.push(redirectTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={() => void handleLogout()} disabled={pending}>
        {pending ? "Saindo..." : children}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}