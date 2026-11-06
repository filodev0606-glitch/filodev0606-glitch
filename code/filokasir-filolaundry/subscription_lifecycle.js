/*
 * STATUS: endpoint verifyPlayPurchase dan playBillingRtdn sudah dipensiunkan (HTTP 410).
 * Alur aktif: pembayaran QRIS, lalu admin menyetujui klaim. Siklus status
 * (active, grace, expired) di bawah dipakai bersama oleh kedua alur.
 */
/**
 * Google Play Billing — verify purchase + RTDN (Real-time Developer Notifications).
 *
 * Env:
 *   PLAY_PACKAGE_LAUNDRY (default com.filolaundry.filo_laundry)
 *   PLAY_PACKAGE_KASIR (default com.filolaundry.filokasir)
 *   PLAY_GRACE_DAYS (default 3)
 *
 * Optional Google Play Developer API (recommended in production):
 *   Uses Application Default Credentials / service account with
 *   Android Publisher API enabled + Play Console linked.
 */
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("crypto");

const db = getFirestore();
const GRACE_DAYS = Number(process.env.PLAY_GRACE_DAYS || 3);
const PKG_LAUNDRY =
  process.env.PLAY_PACKAGE_LAUNDRY || "com.filolaundry.filo_laundry";
const PKG_KASIR =
  process.env.PLAY_PACKAGE_KASIR || "com.filolaundry.filokasir";

function productIdFromPackage(pkg) {
  if (pkg === PKG_KASIR || (pkg && String(pkg).includes("filokasir"))) {
    return "filokasir";
  }
  return "filolaundry";
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function getAndroidPublisher() {
  try {
    const { google } = require("googleapis");
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    const authClient = await auth.getClient();
    return google.androidpublisher({ version: "v3", auth: authClient });
  } catch (e) {
    console.warn("Play API unavailable:", e.message || e);
    return null;
  }
}

/**
 * Verify subscription with Play Developer API when credentials exist.
 * Returns { ok, expiryTimeMillis?, orderId? } or null if API unavailable.
 */
async function verifyWithPlayApi({
  packageName,
  subscriptionId,
  purchaseToken,
}) {
  const publisher = await getAndroidPublisher();
  if (!publisher) return null;
  try {
    // Subscriptions v2
    const res = await publisher.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
    });
    const data = res.data || {};
    const lineItems = data.lineItems || [];
    const first = lineItems[0] || {};
    const expiry = first.expiryTime
      ? Date.parse(first.expiryTime)
      : undefined;
    const state = (data.subscriptionState || "").toUpperCase();
    const active =
      state.includes("ACTIVE") ||
      state.includes("IN_GRACE") ||
      state.includes("CANCELED"); // still entitled until expiry
    return {
      ok: active || Boolean(expiry && expiry > Date.now()),
      expiryTimeMillis: expiry,
      orderId: data.latestOrderId || null,
      rawState: state,
      subscriptionId: first.productId || subscriptionId,
    };
  } catch (e) {
    // Fallback to legacy subscriptions.get
    try {
      if (!subscriptionId) throw e;
      const legacy = await publisher.purchases.subscriptions.get({
        packageName,
        subscriptionId,
        token: purchaseToken,
      });
      const d = legacy.data || {};
      return {
        ok: true,
        expiryTimeMillis: d.expiryTimeMillis
          ? Number(d.expiryTimeMillis)
          : undefined,
        orderId: d.orderId || null,
        rawState: "legacy",
        subscriptionId,
      };
    } catch (e2) {
      console.error("Play API verify failed:", e2.message || e2);
      return { ok: false, error: String(e2.message || e2) };
    }
  }
}

async function findTenantByPlayToken(purchaseToken) {
  if (!purchaseToken) return null;
  const snap = await db
    .collection("tenants")
    .where("playPurchaseToken", "==", purchaseToken)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

async function activateTenant(
  tenantId,
  {
    purchaseToken,
    orderId,
    packageName,
    expiryTimeMillis,
    productId,
  } = {}
) {
  const ref = db.collection("tenants").doc(tenantId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("tenant not found");

  const now = new Date();
  let expiredAt = expiryTimeMillis
    ? new Date(Number(expiryTimeMillis))
    : addDays(now, 30);

  const cur = snap.data() || {};
  const curExp = cur.expiredAt ? new Date(cur.expiredAt) : null;
  if (curExp && !isNaN(curExp) && curExp > expiredAt) {
    expiredAt = curExp;
  }

  const pid =
    productId ||
    cur.productId ||
    productIdFromPackage(packageName);

  await ref.set(
    {
      subscriptionStatus: "active",
      expiredAt: expiredAt.toISOString(),
      productId: pid,
      graceEndsAt: FieldValue.delete(),
      softDeletedAt: FieldValue.delete(),
      lockReason: FieldValue.delete(),
      statusBeforeSuspend: FieldValue.delete(),
      forceSessionRevokeAt: FieldValue.delete(),
      playPurchaseToken: purchaseToken || cur.playPurchaseToken || null,
      playOrderId: orderId || cur.playOrderId || null,
      playPackageName: packageName || cur.playPackageName || null,
      updatedAt: now.toISOString(),
      billingProvider: "play",
    },
    { merge: true }
  );
  return { ok: true, tenantId, expiredAt: expiredAt.toISOString(), productId: pid };
}

async function enterGrace(tenantId) {
  const ref = db.collection("tenants").doc(tenantId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("tenant not found");
  const cur = snap.data() || {};
  const base = cur.expiredAt ? new Date(cur.expiredAt) : new Date();
  const graceEndsAt = addDays(base, GRACE_DAYS);
  await ref.set(
    {
      subscriptionStatus: "grace",
      graceEndsAt: graceEndsAt.toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { ok: true, tenantId, graceEndsAt: graceEndsAt.toISOString() };
}

async function expireTenant(tenantId) {
  const ref = db.collection("tenants").doc(tenantId);
  await ref.set(
    {
      subscriptionStatus: "expired",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { ok: true, tenantId };
}

/**
 * POST /verifyPlayPurchase — retired (QRIS admin approve only).
 */
async function verifyPlayPurchaseHandler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  res.status(410).json({
    error: "gone",
    message: "Play Billing disabled — QRIS admin approve only.",
  });
}

/**
 * POST /playBillingRtdn — retired (QRIS admin approve only).
 */
async function playBillingRtdnHandler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  res.status(410).json({
    error: "gone",
    message: "Play Billing disabled — QRIS admin approve only.",
  });
}

module.exports = {
  verifyPlayPurchaseHandler,
  playBillingRtdnHandler,
  activateTenant,
  enterGrace,
  expireTenant,
  PKG_LAUNDRY,
  PKG_KASIR,
};
