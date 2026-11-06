import { z } from "zod";
import { normalizePhoneID } from "./phone.js";

export const donationCreateSchema = z.object({
  programSlug: z.string().min(1),
  packageId: z.number().int().positive().nullable().optional(),
  packageQty: z.number().int().positive().max(999).optional().default(1),
  baseAmount: z.number().int().min(1000).max(2_000_000_000),
  bankAccountId: z.number().int().positive(),
  donorName: z.string().trim().min(1).max(80),
  isAnonymous: z.boolean().default(false),
  donorPhone: z
    .string()
    .trim()
    .refine((v) => normalizePhoneID(v) !== null, "Nomor WhatsApp tidak valid"),
  donorEmail: z.string().trim().email().optional().or(z.literal("")),
  onBehalfOf: z.string().trim().max(80).optional().or(z.literal("")),
  prayer: z.string().trim().max(500).optional().or(z.literal("")),
  prayerPublic: z.boolean().default(true),
  fundraiserRef: z.string().trim().max(40).optional(),
  idempotencyKey: z.string().uuid(),
  turnstileToken: z.string().min(1),
});
export type DonationCreateInput = z.infer<typeof donationCreateSchema>;

export const donationCheckSchema = z.object({
  code: z.string().trim().min(4).max(20),
  phoneLast4: z.string().trim().regex(/^\d{4}$/),
});

export const volunteerSchema = z.object({
  eventId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(80),
  phone: z.string().refine((v) => normalizePhoneID(v) !== null, "Nomor tidak valid"),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  skills: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  turnstileToken: z.string().min(1),
});

export const aidRequestSchema = z.object({
  applicantName: z.string().trim().min(1).max(80),
  phone: z.string().refine((v) => normalizePhoneID(v) !== null, "Nomor tidak valid"),
  city: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().min(10).max(1000),
  amountNeeded: z.number().int().min(0).max(2_000_000_000).optional(),
  turnstileToken: z.string().min(1),
});

export const reminderSubscribeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  frequency: z.enum(["weekly_friday", "monthly"]),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  programId: z.number().int().positive().nullable().optional(),
  turnstileToken: z.string().min(1),
});

export const fundraiserApplySchema = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(400).optional().or(z.literal("")),
  targetAmount: z.number().int().min(0).max(2_000_000_000).optional(),
  phone: z.string().refine((v) => normalizePhoneID(v) !== null, "Nomor tidak valid"),
  email: z.string().email().optional().or(z.literal("")),
  turnstileToken: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const programUpsertSchema = z.object({
  title: z.string().trim().min(3).max(150),
  categoryId: z.number().int().positive().nullable(),
  summary: z.string().trim().min(10).max(160),
  storyMd: z.string().trim().min(10),
  targetAmount: z.number().int().positive().nullable(),
  minDonation: z.number().int().positive().nullable(),
  startAt: z.number().int().nullable(),
  endAt: z.number().int().nullable(),
  status: z.enum(["draft", "active", "completed", "archived"]),
  isFeatured: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  acceptsZakat: z.boolean().default(false),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  beneficiariesCount: z.number().int().min(0).nullable().optional(),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
});

export const gallerySchema = z.object({
  albumId: z.number().int().positive().nullable().optional(),
  programId: z.number().int().positive().nullable().optional(),
  caption: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["draft", "published", "hidden"]).default("published"),
  embedUrl: z.string().url().optional(),
});
