import { readFileSync } from "node:fs";
import { request } from "node:http";

export function push(
  host: string,
  port: number,
  code: string,
  bundle: string,
): Promise<{ applied: string[]; skipped: string[] }> {
  const body = readFileSync(bundle);

  return new Promise((resolve, reject) => {
    const req = request(
      {
        host,
        port,
        method: "POST",
        path: "/transfer",
        headers: {
          "Content-Type": "application/gzip",
          "Content-Length": body.length,
          "X-Pairing-Code": code,
        },
        timeout: 120_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (x) => chunks.push(x));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString();
          let j: { ok?: boolean; error?: string; applied?: string[]; skipped?: string[] };
          try {
            j = JSON.parse(raw);
          } catch {
            reject(new Error(`weird response ${res.statusCode}`));
            return;
          }
          if (res.statusCode !== 200 || !j.ok) {
            reject(new Error(j.error ?? `http ${res.statusCode}`));
            return;
          }
          resolve({ applied: j.applied ?? [], skipped: j.skipped ?? [] });
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timed out"));
    });
    req.end(body);
  });
}
