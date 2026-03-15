"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Lock, Shield } from "lucide-react";

import { useAppUi } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const { pushToast } = useAppUi();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function handleSubmit(formData: FormData, form: HTMLFormElement) {
    setError(null);
    setSuccess(null);
    setPending(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(formData.get("currentPassword") ?? ""),
          newPassword: String(formData.get("newPassword") ?? ""),
        }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        const message = data.error ?? "Falha ao alterar a senha.";
        setError(message);
        pushToast(message, "error");
        return;
      }

      pushToast("Senha atualizada com sucesso.", "success");
      setSuccess("Nova senha salva na conta local. Use essa credencial nos próximos acessos.");
      form.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        void handleSubmit(formData, form);
      }}
    >
      <div className="rounded-2xl border border-[#19E0FF]/12 bg-[#08111C]/92 p-4 text-sm leading-6 text-[#A9B2C7]">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Shield className="h-4 w-4 text-[#19E0FF]" />
          Segurança da conta
        </div>
        <p className="mt-2">Atualize sua senha local para proteger carteira, compras e acesso ao painel do jogador.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A9B2C7]">Senha atual</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B2C7]" />
          <Input
            name="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Informe sua senha atual"
            required
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] transition-colors hover:text-white"
            aria-label={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A9B2C7]">Nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B2C7]" />
          <Input
            name="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Nova senha com 8 ou mais caracteres"
            required
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] transition-colors hover:text-white"
            aria-label={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[#FF6B86]/24 bg-[#2A1019]/70 px-4 py-3 text-sm text-[#FF9CB0]">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p aria-live="polite">{error}</p>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-[#19E0FF]/20 bg-[#0D2432]/70 px-4 py-3 text-sm text-[#D7F7FF]">
          <p aria-live="polite">{success}</p>
        </div>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Atualizando..." : "Alterar senha"}
      </Button>
    </form>
  );
}

