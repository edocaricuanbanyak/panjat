"use client";

/**
 * Client-side Paddle.js loader + overlay checkout. Used only on the global
 * (Paddle) deployment: after the server creates a transaction, the browser opens
 * Paddle's overlay for that transaction id. Grip still activates only via the
 * verified webhook — the overlay's success just returns the user to /manjat/selesai.
 *
 * Paddle.js is loaded lazily (dynamic import from the wizard), so it never ships
 * in the Indonesian/Midtrans bundle.
 */

interface PaddleGlobal {
  Environment: { set: (env: "sandbox" | "production") => void };
  Initialize: (opts: { token: string }) => void;
  Checkout: {
    open: (opts: {
      transactionId: string;
      settings?: { successUrl?: string; displayMode?: string };
    }) => void;
  };
}

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";
let scriptPromise: Promise<void> | null = null;
let initialized = false;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if ((window as unknown as { Paddle?: PaddleGlobal }).Paddle) return resolve();
    const s = document.createElement("script");
    s.src = PADDLE_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Paddle.js"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Open the Paddle overlay for a server-created transaction. */
export async function openPaddleCheckout(
  transactionId: string,
  opts: { successUrl: string },
): Promise<void> {
  await loadScript();
  const Paddle = (window as unknown as { Paddle?: PaddleGlobal }).Paddle;
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!Paddle || !token) throw new Error("Paddle belum dikonfigurasi (client token)");
  if (!initialized) {
    Paddle.Environment.set(
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
    );
    Paddle.Initialize({ token });
    initialized = true;
  }
  Paddle.Checkout.open({ transactionId, settings: { successUrl: opts.successUrl } });
}
