import { format, isValid, parseISO } from "date-fns";

/**
 * Normaliza fechas provenientes de la base de datos que llegan con sufijos de zona horaria
 * (ej: "2026-11-11 00:00:00.000Z") y devuelve un objeto Date en la medianoche local
 * para conservar el día original.
 */
export function parseDateFromDb(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const trimmed = dateString.trim();
  if (!trimmed) return null;

  const datePart = trimmed.includes("T")
    ? trimmed.split("T")[0]
    : trimmed.split(" ")[0];

  const target = datePart || trimmed;
  const parsed = parseISO(target);

  if (!isValid(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Formatea cadenas de fecha de la base de datos conservando el día original.
 */
export function formatDateFromDb(
  dateString: string | null | undefined,
  dateFormat: string,
  options?: Parameters<typeof format>[2]
): string | null {
  const parsed = parseDateFromDb(dateString);
  if (!parsed) return null;
  return format(parsed, dateFormat, options);
}
