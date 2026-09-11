/**
 * Locale selection for the copy deck. Each deployment serves ONE language,
 * chosen by MARKET.defaultLocale: the Indonesian board uses `copyId`, the global
 * board uses `copyEn`. Both decks satisfy the same `CopyDeck` shape (enforced by
 * TypeScript), so every `copy.x.y` callsite works regardless of language.
 *
 * This is the single import point — `import { copy } from "@/copy"` everywhere.
 */
import { MARKET } from "@/lib/market";
import { copyId, type CopyDeck } from "./id";
import { copyEn } from "./en";

export type { CopyDeck };

export const copy: CopyDeck = MARKET.defaultLocale === "en" ? copyEn : copyId;
