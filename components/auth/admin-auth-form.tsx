"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAppUi } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminAuthForm() {
  const router = useRouter();
  const { pushToast } = useAppUi();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      const payload = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        const message = data.error ?? "Falha no login do administrador.";
        setError(message);
        pushToast(message, "error");
        return;
      }

      pushToast("Acesso administrativo liberado.", "success");
      router.push("/admin");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="portal-panel overflow-hidden">
      <div className="border-b border-[#F7CE46]/10 px-8 py-6">
        <div className="space-y-3">
          <Badge className="border-[#F7CE46]/24 bg-[#F7CE46]/10 text-[#F7CE46]">Acesso administrativo</Badge>
          <h2 className="text-3xl font-black text-white">Entrar no painel</h2>
          <p className="text-sm leading-6 text-[#A9B2C7]">Use a conta administrativa para acompanhar usuários, mercado e indicadores do servidor.</p>
        </div>
      </div>
      <div className="space-y-6 px-8 py-6">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            void submit(formData);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A9B2C7]">Email administrativo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B2C7]" />
              <Input name="email" type="email" placeholder="admin@legacy.local" required className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A9B2C7]">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B2C7]" />
              <Input name="password" type={showPassword ? "text" : "password"} placeholder="********" required className="pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error ? <p aria-live="polite" className="text-sm text-[#FF6B86]">{error}</p> : null}
          <Button className="w-full" size="lg" type="submit" disabled={pending}>
            {pending ? "Processando..." : "Entrar como administrador"}
          </Button>
        </form>
        <div className="grid gap-3">
          <div className="portal-subpanel px-5 py-4 text-sm text-[#A9B2C7]">
            <div className="flex items-center gap-2 text-white"><Shield className="h-4 w-4 text-[#F7CE46]" /> Conta de demonstração</div>
            <p className="mt-3">admin@legacy.local</p>
            <p>admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
