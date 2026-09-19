import { createServer } from "http";
import next from "next";
// Relative import (not the "@/" alias) because this file runs directly
// under tsx outside of Next's bundler/webpack alias resolution.
import { initIO } from "./src/server/socket.js";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  initIO(httpServer);

  httpServer.listen(port, () => {
    console.log(`> RunTheMic ready on http://localhost:${port} (${dev ? "dev" : "production"})`);
  });
});
