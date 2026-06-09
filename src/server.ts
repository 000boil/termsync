import { createServer } from "node:http";
import { hostname, networkInterfaces } from "node:os";
import { rmSync, unlinkSync, writeFileSync } from "node:fs";
import { apply } from "./apply.js";
import { unpack } from "./bundle.js";
import { advertise } from "./discovery.js";

export type ListenInfo = {
  port: number;
  pairingCode: string;
  ips: string[];
  hostname: string;
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pairingCode(n = 6) {
  let s = "";
  for (let i = 0; i < n; i++) s += CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0];
  return s;
}

function ips() {
  const out: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === "IPv4" && !a.internal) out.push(a.address);
    }
  }
  return [...new Set(out)];
}

export function listen(
  opts: {
    port?: number;
    code?: string;
    timeoutMs?: number;
    onReady?: (info: ListenInfo) => void;
  } = {},
): Promise<{ applied: string[]; skipped: string[]; stop: () => void }> {
  const code = opts.code ?? pairingCode();
  const wantPort = opts.port ?? 0;
  const timeout = opts.timeoutMs ?? 600_000;

  return new Promise((resolve, reject) => {
    let done = false;
    let killBj: (() => void) | undefined;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      killBj?.();
      srv.close();
      reject(new Error("gave up after 10m"));
    }, timeout);

    const srv = createServer(async (req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (req.method !== "POST" || req.url !== "/transfer") {
        res.writeHead(404);
        res.end();
        return;
      }

      if (req.headers["x-pairing-code"] !== code) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "wrong code" }));
        return;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);

      const tmp = `/tmp/ts-${Date.now()}.tar.gz`;
      writeFileSync(tmp, Buffer.concat(chunks));

      let dir: string | undefined;
      try {
        dir = unpack(tmp);
        const result = apply(dir);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, ...result }));

        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve({
            ...result,
            stop: () => {
              killBj?.();
              srv.close();
            },
          });
        }
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (e as Error).message }));
      } finally {
        unlinkSync(tmp);
        if (dir) rmSync(dir, { recursive: true, force: true });
      }
    });

    srv.on("error", (e) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(e);
      }
    });

    srv.listen(wantPort, "0.0.0.0", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : wantPort;
      const info: ListenInfo = { port, pairingCode: code, ips: ips(), hostname: hostname() };
      const bj = advertise(port, `${info.hostname}-termsync`);
      killBj = () => bj.destroy();
      opts.onReady?.(info);
    });
  });
}
