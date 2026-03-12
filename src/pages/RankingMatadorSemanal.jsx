import React from 'react';
import RankingPageTemplate from '@/components/rankings/RankingPageTemplate';
import { useRankingMatador } from '@/components/hooks/useRankings';

export default function RankingMatadorSemanal() {
  const { ranking, top3, prizes, periodLabel, isLoading } = useRankingMatador();

  const columns = [
    { key: 'nation', label: 'Nação', valueColor: '#19E0FF' },
    { key: 'kills', label: 'Kills', valueColor: '#FF4B6A' }
  ];

  const restOfRanking = ranking.slice(3);

  return (
    <RankingPageTemplate
      type="matador"
      pageTitle="Matador da Semana"
      pageSubtitle="Os Maiores Assassinos da Semana"
      periodLabel={periodLabel}
      prizeType="CASH"
      prizes={prizes}
      top3={top3}
      restOfRanking={restOfRanking}
      columns={columns}
      isLoading={isLoading}
      showBackButton={false}
    />
  );
}