import React from 'react';
import RankingPageTemplate from '@/components/rankings/RankingPageTemplate';
import { useRankingCorredores } from '@/components/hooks/useRankings';

export default function RankingCorredores() {
  const { ranking, top3, prizes, weekRange, isLoading } = useRankingCorredores();

  const columns = [
    { key: 'score', label: 'Pontos', valueColor: '#FFFFFF' },
    { key: 'dgs_counted', label: 'DGs', valueColor: '#19E0FF' }
  ];

  const restOfRanking = ranking.slice(3, 30);

  return (
    <RankingPageTemplate
      type="corredores"
      pageTitle="Corredor da Semana"
      pageSubtitle="Os Maiores Desbravadores da Semana"
      periodLabel={weekRange}
      prizeType="BRL"
      prizes={prizes}
      top3={top3}
      restOfRanking={restOfRanking}
      columns={columns}
      isLoading={isLoading}
      showBackButton={true}
    />
  );
}