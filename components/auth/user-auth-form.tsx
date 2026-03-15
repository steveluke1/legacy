"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Shield, User, Wallet } from "lucide-react";

import { useAppUi } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register" | "resetRequest" | "resetConfirm";

const MODE_TITLES: Record<Mode, string> = {
  login: "Entrar na conta",
  register: "Criar conta",
  resetRequest: "Recuperar acesso",
  resetConfirm: "Definir nova senha",
};

interface UserAuthFormProps {
  initialMode?: Mode;
}

export function UserAuthForm({ initialMode = "login" }: UserAuthFormProps) {
  const router = useRouter();
  const { pushToast } = useAppUi();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const title = useMemo(() => MODE_TITLES[mode], [mode]);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setShowPassword(false);
    setShowNewPassword(false);
    if (nextMode !== "resetConfirm") {
      setResetToken(null);
    }
  }

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      if (mode === "resetRequest") {
        const email = String(formData.get("email") ?? "").trim();
        setResetEmail(email);

        const response = await fetch("/api/auth/password-reset/request", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = (await response.json()) as { success: boolean; error?: string; localOnlyToken?: string | null };
        if (!response.ok || !data.success) {
          setError(data.error ?? "Falha ao iniciar a recuperação de senha.");
          return;
        }

        setResetToken(data.localOnlyToken ?? null);
        setMode("resetConfirm");
        pushToast("Token local de recuperação gerado com sucesso.", "success");
        return;
      }

      if (mode === "resetConfirm") {
        const token = String(formData.get("token") ?? "");
        const newPassword = String(formData.get("newPassword") ?? "");
        const response = await fetch("/api/auth/password-reset/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        });

        const data = (await response.json()) as { success: boolean; error?: string };
        if (!response.ok || !data.success) {
          setError(data.error ?? "Falha ao redefinir a senha.");
          return;
        }

        pushToast("Senha redefinida com sucesso. Entre com a nova senha.", "success");
        changeMode("login");
        return;
      }

      const payload =
        mode === "login"
          ? {
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
            }
          : {
              email: String(formData.get("email") ?? ""),
              username: String(formData.get("username") ?? ""),
              displayName: String(formData.get("displayName") ?? ""),
              password: String(formData.get("password") ?? ""),
            };

      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { success: boolean; error?: string };

      if (!response.ok || !data.success) {
        setError(data.error ?? "Falha na autenticação do usuário.");
        return;
      }

      pushToast(mode === "login" ? "Login realizado com sucesso." : "Conta criada com sucesso.", "success");
      router.push("/conta");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="portal-panel overflow-hidden">
      <div className="border-b border-[#19E0FF]/10 px-8 py-6">
        <div className="space-y-3">
          <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Conta do jogador</Badge>
          <h2 className="text-3xl font-black text-white">{title}</h2>
          <p className="text-sm leading-6 text-[#A9B2C7]">Use sua conta local para acessar o portal, movimentar ALZ e acompanhar o servidor.</p>
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
          {mode !== "resetConfirm" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A9B2C7]">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B2C7]" />
                <Input name="email" type="email" placeholder="buyer@legacy.local" required defaultValue={resetEmail} className="pl-10" />
              </div>
            </div>
          ) : null}
          {mode === "register" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#A9B2C7]">Usuário</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B2C7]" />
                  <Input name="username" placeholder="buyer_demo" required className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#A9B2C7]">Nome exibido</label>
                <Input name="displayName" placeholder="Nome exibido no portal" required />
              </div>
            </>
          ) : null}
          {mode === "login" || mode === "register" ? (
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
          ) : null}
          {mode === "resetConfirm" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#A9B2C7]">Token</label>
                <Input name="token" placeholder="Token local de recuperação" required defaultValue={resetToken ?? ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#A9B2C7]">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B2C7]" />
                  <Input name="newPassword" type={showNewPassword ? "text" : "password"} placeholder="Nova senha com 8 ou mais caracteres" required className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShowNewPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white">
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-[#FF6B86]/24 bg-[#2A1019]/70 px-4 py-3 text-sm text-[#FF9CB0]">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p aria-live="polite">{error}</p>
              </div>
            </div>
          ) : null}
          {mode === "resetConfirm" && resetToken ? (
            <div className="rounded-2xl border border-[#19E0FF]/16 bg-[#09111B]/92 p-4 text-sm text-[#A9B2C7]">
              <p className="font-semibold text-white">Token local gerado</p>
              <p className="mt-2 break-all font-mono text-xs text-[#19E0FF]">{resetToken}</p>
            </div>
          ) : null}
          <Button className="w-full" size="lg" type="submit" disabled={pending}>
            {pending
              ? "Processando..."
              : mode === "login"
                ? "Entrar na conta"
                : mode === "register"
                  ? "Criar conta e entrar"
                  : mode === "resetRequest"
                    ? "Gerar token local"
                    : "Salvar nova senha"}
          </Button>
        </form>

        <div className="flex flex-wrap gap-3 text-sm text-[#A9B2C7]">
          <button className="underline-offset-4 hover:text-white hover:underline" type="button" onClick={() => changeMode("login")}>Já tenho conta</button>
          <button className="underline-offset-4 hover:text-white hover:underline" type="button" onClick={() => changeMode("register")}>Quero me cadastrar</button>
          <button className="underline-offset-4 hover:text-white hover:underline" type="button" onClick={() => changeMode("resetRequest")}>Esqueci minha senha</button>
          {mode === "resetConfirm" ? (
            <button className="underline-offset-4 hover:text-white hover:underline" type="button" onClick={() => changeMode("login")}>Voltar ao login</button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="portal-subpanel px-5 py-4 text-sm text-[#A9B2C7]">
            <div className="flex items-center gap-2 text-white"><Wallet className="h-4 w-4 text-[#19E0FF]" /> Conta demo 1</div>
            <p className="mt-3">buyer@legacy.local</p>
            <p>buyer123</p>
          </div>
          <div className="portal-subpanel px-5 py-4 text-sm text-[#A9B2C7]">
            <div className="flex items-center gap-2 text-white"><Wallet className="h-4 w-4 text-[#19E0FF]" /> Conta demo 2</div>
            <p className="mt-3">seller@legacy.local</p>
            <p>seller123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
