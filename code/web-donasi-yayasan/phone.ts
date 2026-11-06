/** Normalisasi nomor Indonesia ke format 62xxxxxxxxxx (tanpa +/spasi/strip). */
export function normalizePhoneID(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, "");
  let digits = cleaned.replace(/^\+/, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (digits.startsWith("8")) digits = "62" + digits;
  if (!digits.startsWith("62")) return null;
  // 62 + 9..13 digit lokal (total 11-15 digit)
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

export function toWhatsAppLink(phone62: string, message?: string): string {
  const base = `https://wa.me/${phone62}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function maskPhoneLast4(phone62: string): string {
  return phone62.slice(-4);
}
