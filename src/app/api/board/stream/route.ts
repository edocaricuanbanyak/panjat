import { db } from "@/db";
import { getBoard } from "@/domain/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS = 3000;

/**
 * GET /api/board/stream — Server-Sent Events. Emits the board on connect and
 * whenever it changes (grip decay, new settlement). Polling is fine at this
 * scale; a Postgres LISTEN/NOTIFY or Redis pub/sub upgrade is a later concern
 * (§17.3: don't build for problems you don't have).
 */
export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastHash = "";
      let closed = false;

      const send = (board: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(board)}\n\n`));

      const tick = async () => {
        if (closed) return;
        try {
          const board = await getBoard(db);
          const hash = JSON.stringify(board);
          if (hash !== lastHash) {
            lastHash = hash;
            send(board);
          }
        } catch {
          // transient DB hiccup — keep the stream alive, try again next tick
        }
      };

      await tick(); // initial snapshot
      const interval = setInterval(tick, POLL_MS);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
