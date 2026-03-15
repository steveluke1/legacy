"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { CharacterRecord } from "@/lib/types/character";
import type { MarketplaceListingRecord } from "@/lib/types/marketplace";
import { useAppUi } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";

const selectClassName =
  "flex h-11 w-full rounded-2xl border border-[#19E0FF]/16 bg-[#09121D] px-4 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function PurchaseButton({ listing, characters }: { listing: MarketplaceListingRecord; characters: CharacterRecord[] }) {
  const router = useRouter();
  const { pushToast } = useAppUi();
  const [characterId, setCharacterId] = useState(characters[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  async function purchase() {
    if (!characterId) {
      pushToast("Escolha um personagem para concluir a compra.", "error");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/marketplace/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, buyerCharacterId: characterId }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        pushToast(data.error ?? "Falha ao comprar a oferta.", "error");
        return;
      }

      pushToast("Compra concluída com sucesso.", "success");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (characters.length === 0) {
    return <p className="text-sm leading-6 text-[#A9B2C7]">Entre com uma conta que tenha personagem para comprar.</p>;
  }

  return (
    <div className="space-y-3">
      <select value={characterId} onChange={(event) => setCharacterId(event.target.value)} className={selectClassName}>
        {characters.map((character) => (
          <option key={character.id} value={character.id}>{character.name}</option>
        ))}
      </select>
      <Button type="button" className="w-full" disabled={pending || !characterId} onClick={() => void purchase()}>
        {pending ? "Comprando..." : "Comprar oferta"}
      </Button>
    </div>
  );
}