import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Manifest } from "./collect.js";
import { mergeSettings } from "./settings.js";

export function apply(dir: string): { applied: string[]; skipped: string[] } {
  const mf = join(dir, "manifest.json");
  if (!existsSync(mf)) throw new Error("bad bundle");
  const manifest = JSON.parse(readFileSync(mf, "utf8")) as Manifest;
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const e of manifest.entries) {
    const from = join(dir, e.bundlePath);
    if (!existsSync(from)) {
      skipped.push(e.label);
      continue;
    }

    if (e.kind === "settings-merge") {
      mergeSettings(e.dest, JSON.parse(readFileSync(from, "utf8")));
      applied.push(e.label);
      continue;
    }

    mkdirSync(dirname(e.dest), { recursive: true });
    if (e.kind === "dir") cpSync(from, e.dest, { recursive: true, force: true });
    else copyFileSync(from, e.dest);
    applied.push(e.label);
  }

  return { applied, skipped };
}
