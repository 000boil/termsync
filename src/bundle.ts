import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { collect, type Manifest } from "./collect.js";

export function pack(): { path: string; manifest: Manifest } {
  const staging = mkdtempSync(join(tmpdir(), "ts-staging-"));
  const manifest = collect(staging);
  const out = join(tmpdir(), `ts-${Date.now()}.tar.gz`);
  execFileSync("tar", ["-czf", out, "-C", staging, "."]);
  rmSync(staging, { recursive: true, force: true });
  return { path: out, manifest };
}

export function unpack(archive: string): string {
  const dir = mkdtempSync(join(tmpdir(), "ts-recv-"));
  execFileSync("tar", ["-xzf", archive, "-C", dir]);
  return dir;
}

export function toDownloads(archive: string): string {
  const dest = join(homedir(), "Downloads", `terminal-style-${new Date().toISOString().slice(0, 10)}.termsync.tar.gz`);
  writeFileSync(dest, readFileSync(archive));
  return dest;
}

export function revealInFinder(path: string): void {
  execFileSync("open", ["-R", path], { stdio: "inherit" });
}
