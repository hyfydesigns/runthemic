"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const RealtimeContext = createContext<Socket | null>(null);

/**
 * Mount this only on pages that actually need live updates (event pages,
 * queue, host controller, TV) — not marketing/auth — to avoid opening
 * sockets nobody uses.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  if (!socketRef.current) {
    socketRef.current = io({ path: "/socket.io", autoConnect: true });
  }

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      socket?.disconnect();
    };
  }, []);

  return <RealtimeContext.Provider value={socketRef.current}>{children}</RealtimeContext.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(RealtimeContext);
}

/** Joins an event's realtime room for the lifetime of the component. */
export function useEventRoom(eventId: string | undefined, onReconnect?: () => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !eventId) return;

    const join = () => socket.emit("join:event", eventId);
    join();

    function handleConnect() {
      join();
      onReconnect?.();
    }

    socket.on("connect", handleConnect);
    return () => {
      socket.emit("leave:event", eventId);
      socket.off("connect", handleConnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventId]);
}

/** Subscribes to a socket event for the lifetime of the component. */
export function useSocketEvent<T = unknown>(eventName: string, handler: (payload: T) => void) {
  const socket = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(eventName, listener);
    return () => {
      socket.off(eventName, listener);
    };
  }, [socket, eventName]);
}

export function useRealtimeStatus(): { connected: boolean } {
  const socket = useSocket();
  const [connected, setConnected] = useState(socket?.connected ?? false);

  useEffect(() => {
    if (!socket) return;
    setConnected(socket.connected);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  return { connected };
}

/**
 * Safety-net polling alongside the socket push updates: long-polling
 * fallback connections behind a proxy (or a tab that missed a reconnect)
 * can silently stop delivering events without erroring, which otherwise
 * leaves a page like the live queue looking frozen until a manual reload.
 * Cheap enough at this interval to just always run it as a backstop.
 */
export function usePollingRefetch(callback: () => void, intervalMs = 8000) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
