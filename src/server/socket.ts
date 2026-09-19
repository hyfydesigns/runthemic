import type { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function initIO(httpServer: HTTPServer): IOServer {
  io = new IOServer(httpServer, {
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("join:event", (eventId: unknown) => {
      if (typeof eventId === "string" && eventId.length > 0) {
        socket.join(roomName(eventId));
      }
    });

    socket.on("leave:event", (eventId: unknown) => {
      if (typeof eventId === "string" && eventId.length > 0) {
        socket.leave(roomName(eventId));
      }
    });
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) {
    throw new Error("Socket.IO server not initialized — initIO() must run before getIO()");
  }
  return io;
}

function roomName(eventId: string): string {
  return `event:${eventId}`;
}

/** Broadcasts a realtime event to every client currently viewing this event. */
export function emitToEvent(eventId: string, event: string, payload: unknown): void {
  if (!io) return; // no-op if sockets aren't running (e.g. during build/seed scripts)
  io.to(roomName(eventId)).emit(event, payload);
}
