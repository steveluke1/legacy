// DEPRECATED: This file has been neutralized and should no longer be used in production.
// All ranking data must come from real DGCompletion and TGWarPlayerScore entities.
// This file is kept only to prevent import errors during migration.
// DO NOT USE THESE FUNCTIONS IN PRODUCTION CODE.

export function generateMockCorredores() {
  console.warn('WARNING: generateMockCorredores is deprecated and should not be used');
  return [];
}

export function generateMockMatador() {
  console.warn('WARNING: generateMockMatador is deprecated and should not be used');
  return [];
}

export function getCurrentWeekKey(timezone = 'America/Sao_Paulo') {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function getWeekDates(weekKey, timezone = 'America/Sao_Paulo') {
  const [year, week] = weekKey.split('-W').map(Number);
  const jan1 = new Date(year, 0, 1);
  const daysToFirstMonday = (8 - jan1.getDay()) % 7;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return {
    start: weekStart.toISOString(),
    end: weekEnd.toISOString()
  };
}

export function formatPeriodLabel(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startDay = String(startDate.getDate()).padStart(2, '0');
  const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endYear = endDate.getFullYear();
  return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${endYear}`;
}

export function formatBRL(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function formatCASH(value) {
  return `${value.toLocaleString('pt-BR')} CASH`;
}