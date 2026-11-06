const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // tanpa 0/O/1/I agar tak rancu

/** Kode donasi acak kriptografis, mis. DON-7K3Q9XDM. */
export function generateDonationCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `DON-${out}`;
}

/** Token akses acak (bukan data pribadi) dipakai di URL, disimpan sebagai hash di DB. */
export function generateAccessToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Kode unik transfer 1-999 acak, dipakai untuk cocokkan mutasi bank. */
export function randomUniqueCode(): number {
  return 1 + Math.floor((crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32) * 999);
}

export function generateAidRequestCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `BTU-${out}`;
}
