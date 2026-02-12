/**
 * Parsea un string de fecha como fecha local (sin desplazamiento de zona horaria).
 *
 * Problema: Cuando el backend devuelve una fecha como "2024-01-15" (solo fecha, sin hora),
 * `new Date("2024-01-15")` la interpreta como medianoche UTC. Al mostrarla con el DatePipe
 * de Angular, se convierte a la zona horaria local, lo que puede desplazar el día.
 * Ejemplo: "2024-01-15T00:00:00Z" en UTC-4 se muestra como "14/01/2024".
 *
 * Esta función detecta fechas que representan solo un día (sin hora significativa)
 * y las parsea como fecha local para evitar el desplazamiento.
 *
 * @param dateValue - Valor de fecha (string ISO, string de fecha, o Date)
 * @returns Date parseada como fecha local
 */
export function parseLocalDate(dateValue: string | Date | undefined | null): Date {
  if (!dateValue) return new Date(NaN); // Retorna fecha inválida si es null/undefined
  if (dateValue instanceof Date) return dateValue;

  if (typeof dateValue === 'string') {
    // Fecha tipo "YYYY-MM-DD" → parsear como local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Fecha tipo "YYYY-MM-DDT00:00:00.000Z" donde la hora es medianoche UTC
    // (probablemente representa solo una fecha, sin hora significativa)
    if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?Z$/.test(dateValue)) {
      const [year, month, day] = dateValue.substring(0, 10).split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  }

  // Para cualquier otro formato (con hora real), usar el constructor estándar
  return new Date(dateValue);
}

/**
 * Versión segura de parseLocalDate que acepta undefined/null y retorna undefined.
 * Útil para campos opcionales de fecha.
 */
export function parseLocalDateOptional(dateValue: string | Date | undefined | null): Date | undefined {
  if (!dateValue) return undefined;
  return parseLocalDate(dateValue);
}

/**
 * Formatea un objeto Date como string "YYYY-MM-DD" usando componentes locales.
 *
 * IMPORTANTE: NO usar `date.toISOString().split('T')[0]` porque toISOString()
 * convierte a UTC, lo que puede desplazar el día si la hora local + offset
 * cruza la medianoche UTC.
 * Ejemplo: 2026-02-11 20:00 en UTC-4 → toISOString() → "2026-02-12T00:00:00Z" → "2026-02-12" (¡incorrecto!)
 *
 * @param date - Objeto Date a formatear
 * @returns String en formato "YYYY-MM-DD" basado en la fecha local
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
