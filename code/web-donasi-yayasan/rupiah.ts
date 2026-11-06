/** Uang selalu integer rupiah, tidak pernah float. */
const RUPIAH_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount)) return "Rp0";
  // Beberapa versi ICU menyisipkan spasi (termasuk NBSP) antara "Rp" dan angka; kita hilangkan agar konsisten.
  return RUPIAH_FORMATTER.format(Math.trunc(amount)).replace(/[\s\u00a0\u202f]/g, "");
}

/** Format tanpa "Rp" untuk input/label ringkas, mis. "1.250.000". */
export function formatNumberID(amount: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Math.trunc(amount),
  );
}

/** Parse string input rupiah (dengan/tanpa titik, spasi, "Rp") jadi integer aman. */
export function parseRupiahInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

export function percentProgress(collected: number, target: number | null): number {
  if (!target || target <= 0) return 0;
  const pct = (collected / target) * 100;
  if (!Number.isFinite(pct) || pct < 0) return 0;
  return Math.min(100, Math.round(pct));
}
