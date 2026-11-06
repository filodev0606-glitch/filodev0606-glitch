# Muhammad Ilham Rantri

Software developer. Android (Flutter) and web applications. Based in Kampar, Riau, Indonesia (UTC+7).

Since 2022 I have built operational software for small and mid-sized businesses: multi-outlet point of sale, school and foundation management, and web admin panels, under the studio name Filodev. The systems usually need to keep working on unreliable connections, enforce per-role access, and be handed over with enough documentation for someone else to run them.

## Selected work

| Project | Domain | Stack |
| :-- | :-- | :-- |
| [FiloKasir and FiloLaundry](projects/filokasir-filolaundry.md) | Subscription POS, Android and Windows | Flutter, Firebase, Play Billing, SQLite |
| [Palmera POS](projects/palmera-pos.md) | Multi-outlet POS | Flutter, Riverpod, Firestore, SQLite |
| [School and Foundation System](projects/sistem-yayasan-sekolah.md) | Academics, finance, admissions | Next.js 16, Supabase, Tailwind |
| [Filodev Control Center](projects/filodev-control-center.md) | Admin panel and billing ledger | Cloudflare Workers, D1 |
| [Foundation Donation Site](projects/web-donasi-yayasan.md) | Donations | Astro 5, Workers, D1, R2 |
| [Umrah Registration Platform](projects/registrasi-umroh.md) | Registration, branch dashboards | React, Vite, Firebase |
| [Jam Kopi POS](projects/jam-kopi-kasir.md) | Roastery POS | Flutter, Cubit, Firestore |
| [Filodev site](projects/situs-filodev.md) | Bilingual studio site | Next.js 16, Firebase Hosting |

On Google Play: AI Kasir and Takmuru Quran.

Project pages are written in Indonesian.

## Recurring patterns

- Offline-first writes to SQLite with a sync queue, idempotent by local ID, last-write-wins on `updatedAt`.
- Tenant isolation enforced by database rules, not only application code.
- Low-ops hosting: Workers and D1, Firebase, Supabase, static hosting.
- Admin tools with hashed sessions, CSRF protection and audit logs. Financial records are corrected by voiding, never deleting.
- Handover material: PRD, hand-off notes, deploy guides, admin SOPs, UAT checklists.

## Contact

- Site: https://filodev-web.web.app
