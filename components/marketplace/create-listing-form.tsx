"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { CharacterRecord } from "@/lib/types/character";
import { useAppUi } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "mt-2 flex h-11 w-full rounded-2xl border border-[#19E0FF]/16 bg-[#09121D] px-4 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function CreateListingForm({ characters }: { characters: CharacterRecord[] }) {
  const router = useRouter();
  const { pushToast } = useAppUi();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sellerCharacterId: String(formData.get("sellerCharacterId") ?? ""),
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          unitPriceBrl: Number(formData.get("unitPriceBrl") ?? 0),
          alzAmount: Number(formData.get("alzAmount") ?? 0),
        }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        const message = data.error ?? "Falha ao criar a oferta.";
        setError(message);
        pushToast(message, "error");
        return;
      }

      formRef.current?.reset();
      pushToast("Oferta criada com sucesso.", "success");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (characters.length === 0) {
    return <p className="text-sm leading-6 text-[#A9B2C7]">Sua conta precisa ter ao menos um personagem para anunciar ALZ.</p>;
  }

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        void submit(formData);
      }}
    >
      <label className="block text-sm font-medium text-white">
        Personagem anunciante
        <select name="sellerCharacterId" className={selectClassName} defaultValue={characters[0]?.id}>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>{character.name}</option>
          ))}
        </select>
      </label>
      <Input name="title" placeholder="Ex.: lote rápido de 15 mil ALZ" required />
      <Textarea name="description" placeholder="Explique a oferta e o perfil do lote." required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="unitPriceBrl" type="number" min="0.01" step="0.001" placeholder="Preço por ALZ em BRL" required />
        <Input name="alzAmount" type="number" min="1" step="1" placeholder="Quantidade de ALZ" required />
      </div>
      <div className="rounded-xl border border-[#19E0FF]/10 bg-[#08111B] px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8EA4C7]">Dica do mercado</p>
        <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Defina um preço por ALZ competitivo e descreva claramente o lote para aumentar a conversão da oferta.</p>
      </div>
      {error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Anunciando..." : "Criar oferta"}</Button>
    </form>
  );
}
