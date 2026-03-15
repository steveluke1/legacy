"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Plus, Sparkles } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

type PollOption = {
  id: string;
  label: string;
  votes: number;
};

type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  active: boolean;
  createdAt: string;
};

const initialPolls: Poll[] = [
  {
    id: "poll_event",
    question: "Qual deve ser o próximo evento do servidor?",
    options: [
      { id: "event_bingo", label: "Bingo", votes: 128 },
      { id: "event_natal", label: "Natal", votes: 342 },
      { id: "event_pascoa", label: "Páscoa", votes: 96 },
    ],
    active: true,
    createdAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "poll_dg",
    question: "Qual DG deve ser liberada primeiro?",
    options: [
      { id: "dg_drag", label: "Drag 3SS", votes: 214 },
      { id: "dg_t3", label: "T3", votes: 187 },
      { id: "dg_miragem", label: "Ilha da Miragem", votes: 401 },
    ],
    active: true,
    createdAt: "2026-03-02T14:30:00.000Z",
  },
  {
    id: "poll_tg",
    question: "Qual modelo de TG você prefere?",
    options: [
      { id: "tg_player", label: "TG focada em player", votes: 356 },
      { id: "tg_mob", label: "TG focada em mob", votes: 142 },
      { id: "tg_mista", label: "TG mista", votes: 289 },
    ],
    active: true,
    createdAt: "2026-03-03T16:00:00.000Z",
  },
];

export default function PollsPage() {
  const [polls, setPolls] = useState(initialPolls);
  const [votes, setVotes] = useState<Record<string, string>>({ poll_event: "event_natal" });

  const totalResponses = useMemo(
    () => polls.reduce((sum, poll) => sum + poll.options.reduce((acc, option) => acc + option.votes, 0), 0),
    [polls],
  );

  function handleVote(pollId: string, optionId: string) {
    if (votes[pollId]) {
      return;
    }

    setVotes((current) => ({ ...current, [pollId]: optionId }));
    setPolls((current) =>
      current.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: poll.options.map((option) =>
                option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
              ),
            }
          : poll,
      ),
    );
  }

  return (
    <PageShell>
      <section className="space-y-10">
        <div className="portal-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="portal-pill">Enquetes</div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">Enquetes da comunidade</h1>
              <p className="mt-4 text-base leading-8 text-[#A9B2C7]">
                Vote e ajude a decidir os próximos passos do servidor com o mesmo clima visual do portal antigo.
              </p>
            </div>
            <div className="portal-subpanel flex items-center gap-3 px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#19E0FF]/12 text-[#19E0FF]">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Participação total</p>
                <p className="mt-1 text-2xl font-black text-white">{totalResponses.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="portal-subpanel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Enquetes ativas</p>
            <p className="mt-3 text-2xl font-black text-white">{polls.length}</p>
          </div>
          <div className="portal-subpanel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Votação aberta</p>
            <p className="mt-3 text-2xl font-black text-white">Comunidade</p>
          </div>
          <div className="portal-subpanel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Status</p>
            <p className="mt-3 text-2xl font-black text-white">Portal local</p>
          </div>
        </div>

        <div className="space-y-6">
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            const votedOptionId = votes[poll.id];

            return (
              <section key={poll.id} className="portal-panel overflow-hidden">
                <div className="border-b border-[#19E0FF]/10 px-6 py-6 sm:px-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-3xl">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#19E0FF]/10 text-[#19E0FF]">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <h2 className="text-3xl font-bold text-white">{poll.question}</h2>
                      <p className="mt-3 text-sm leading-7 text-[#A9B2C7]">{totalVotes.toLocaleString("pt-BR")} votos registrados na enquete.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD76A]/25 bg-[#2A2110]/70 px-4 py-2 text-sm font-semibold text-[#FFD76A]">
                      <Sparkles className="h-4 w-4" /> Enquete ativa
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-6 py-6 sm:px-8">
                  {poll.options.map((option) => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    const selected = votedOptionId === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleVote(poll.id, option.id)}
                        disabled={Boolean(votedOptionId)}
                        className="portal-subpanel block w-full p-4 text-left transition-all duration-200 hover:border-[#19E0FF]/24 disabled:cursor-default disabled:hover:border-[#19E0FF]/12"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className={`h-5 w-5 ${selected ? "text-[#19E0FF]" : "text-[#A9B2C7]"}`} />
                            <span className="font-semibold text-white">{option.label}</span>
                          </div>
                          <span className="text-sm font-bold text-white">{percentage}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#04101B]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#8EA4C7]">
                          <span>{option.votes.toLocaleString("pt-BR")} votos</span>
                          {selected ? <span>Seu voto</span> : null}
                        </div>
                      </button>
                    );
                  })}

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">
                      Criada em {new Date(poll.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <Button type="button" className="sm:w-auto" disabled={Boolean(votedOptionId)}>
                      {votedOptionId ? "Votação registrada" : "Participar da votação"}
                    </Button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="portal-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-black text-white">Sugira a próxima enquete</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A9B2C7]">
                As próximas votações da comunidade seguem o mesmo fluxo do legado: tema do servidor, dungeons, TG e ajustes do portal.
              </p>
            </div>
            <Button asChild variant="outline" size="lg" className="gap-2 sm:w-auto">
              <Link href="/suporte">
                <Plus className="h-4 w-4" /> Enviar sugestão
              </Link>
            </Button>
          </div>
        </section>
      </section>
    </PageShell>
  );
}
