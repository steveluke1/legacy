const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatInt(value: number) {
  return value.toLocaleString("pt-BR");
}

export function formatCurrency(value: number, currency: "BRL" | "cash" | "alz" = "BRL") {
  if (currency === "cash") {
    return `${formatInt(value)} CASH`;
  }

  if (currency === "alz") {
    return `${formatInt(value)} ALZ`;
  }

  return currencyFormatter.format(value);
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return date.toLocaleString("pt-BR");
}
