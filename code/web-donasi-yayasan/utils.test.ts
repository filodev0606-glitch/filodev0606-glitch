import { describe, expect, it } from "vitest";
import { formatRupiah, parseRupiahInput, percentProgress } from "../rupiah.js";
import { normalizePhoneID } from "../phone.js";
import { slugify } from "../slug.js";
import { parseEmbedUrl } from "../embed.js";
import { daysRemaining } from "../date.js";
import { hitungZakatMaal, hitungZakatFitrah } from "../zakat.js";

describe("rupiah", () => {
  it("formats integer rupiah", () => {
    expect(formatRupiah(1250000)).toBe("Rp1.250.000");
    expect(formatRupiah(0)).toBe("Rp0");
  });
  it("parses free-form input", () => {
    expect(parseRupiahInput("Rp 1.250.000")).toBe(1250000);
    expect(parseRupiahInput("")).toBe(0);
  });
  it("computes percent progress capped at 100", () => {
    expect(percentProgress(50000, 100000)).toBe(50);
    expect(percentProgress(150000, 100000)).toBe(100);
    expect(percentProgress(1000, null)).toBe(0);
  });
});

describe("phone", () => {
  it("normalizes common ID formats", () => {
    expect(normalizePhoneID("08123456789")).toBe("628123456789");
    expect(normalizePhoneID("+62 812-3456-789")).toBe("628123456789");
    expect(normalizePhoneID("8123456789")).toBe("628123456789");
  });
  it("rejects invalid", () => {
    expect(normalizePhoneID("123")).toBeNull();
    expect(normalizePhoneID("abc")).toBeNull();
  });
});

describe("slug", () => {
  it("slugifies indonesian titles", () => {
    expect(slugify("Bantu Yatim & Dhuafa!")).toBe("bantu-yatim-dhuafa");
    expect(slugify("  Wakaf Qur'an  ")).toBe("wakaf-quran");
  });
});

describe("embed", () => {
  it("parses youtube variants", () => {
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.id).toBe(
      "dQw4w9WgXcQ",
    );
    expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ")?.id).toBe("dQw4w9WgXcQ");
    expect(parseEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")?.id).toBe(
      "dQw4w9WgXcQ",
    );
  });
  it("parses instagram and tiktok", () => {
    expect(parseEmbedUrl("https://www.instagram.com/reel/Cabc123/")?.provider).toBe(
      "instagram",
    );
    expect(parseEmbedUrl("https://www.tiktok.com/@user/video/1234567890")?.provider).toBe(
      "tiktok",
    );
  });
  it("returns null for unknown", () => {
    expect(parseEmbedUrl("not a url")).toBeNull();
    expect(parseEmbedUrl("https://example.com")).toBeNull();
  });
});

describe("date", () => {
  it("computes days remaining", () => {
    expect(daysRemaining(null)).toBeNull();
    expect(daysRemaining(Date.now() - 1000)).toBe(0);
    expect(daysRemaining(Date.now() + 25 * 60 * 60 * 1000)).toBeGreaterThanOrEqual(1);
  });
});

describe("zakat", () => {
  it("computes zakat maal", () => {
    const r = hitungZakatMaal({ hartaRupiah: 100_000_000, hutangRupiah: 0, hargaEmasPerGram: 1_000_000 });
    expect(r.nisab).toBe(85_000_000);
    expect(r.wajibZakat).toBe(true);
    expect(r.zakat).toBe(2_500_000);
  });
  it("computes zakat fitrah", () => {
    expect(hitungZakatFitrah(4, 45000)).toBe(180000);
  });
});

describe("embed variants", () => {
  const cases: [string, string | null][] = [
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=", null],
    ["https://evil.com/watch?v=dQw4w9WgXcQ", null],
    ["javascript:alert(1)", null],
    ["https://www.instagram.com/p/Cabc123/", "Cabc123"],
    ["https://www.tiktok.com/@u/video/7000000000000000000", "7000000000000000000"],
  ];
  for (const [url, id] of cases) {
    it(`parses ${url}`, () => expect(parseEmbedUrl(url)?.id ?? null).toBe(id));
  }
});

describe("validation schemas", () => {
  it("rejects too-small donation and bad phone", async () => {
    const { donationCreateSchema } = await import("../schema.js");
    const ok = { programSlug: "p", baseAmount: 50000, bankAccountId: 1, donorName: "A", isAnonymous: false, donorPhone: "081234567890", prayerPublic: true, idempotencyKey: crypto.randomUUID(), turnstileToken: "t" };
    expect(donationCreateSchema.safeParse(ok).success).toBe(true);
    expect(donationCreateSchema.safeParse({ ...ok, baseAmount: 10 }).success).toBe(false);
    expect(donationCreateSchema.safeParse({ ...ok, donorPhone: "123" }).success).toBe(false);
    expect(donationCreateSchema.safeParse({ ...ok, idempotencyKey: "not-uuid" }).success).toBe(false);
  });
});
