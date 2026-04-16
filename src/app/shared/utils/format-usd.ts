const USD_NUMBER_FORMAT = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/** Monto en USD para mostrar: separadores de miles y 2 decimales (locale es-VE). */
export function formatUsd(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (Number.isNaN(n)) {
    return '—';
  }
  return '$ ' + USD_NUMBER_FORMAT.format(n);
}
