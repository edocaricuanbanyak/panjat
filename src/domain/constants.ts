/**
 * Single-board advisory-lock key. Every writer that must be serialized against
 * the board's ordering — the hourly rosot job and (later) the Midtrans webhook
 * processor — takes pg_advisory_xact_lock(BOARD_LOCK_KEY) so decay and payments
 * never interleave (§17.2 "webhook diproses serial per papan").
 */
export const BOARD_LOCK_KEY = 1;
