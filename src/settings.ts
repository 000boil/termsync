import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { SETTING_PREFIXES } from "./paths.js";

type Obj = Record<string, unknown>;

function parseJsonc(raw: string): Obj {
  const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  try {
    return JSON.parse(stripped) as Obj;
  } catch {
    return {};
  }
}

export function readSettings(path: string): Obj {
  return parseJsonc(readFileSync(path, "utf8"));
}

export function terminalKeys(all: Obj): Obj {
  const out: Obj = {};
  for (const [k, v] of Object.entries(all)) {
    if (SETTING_PREFIXES.some((p) => k === p || k.startsWith(p))) out[k] = v;
  }
  return out;
}

export function mergeSettings(path: string, patch: Obj): void {
  const base = existsSync(path) ? readSettings(path) : {};
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ ...base, ...patch }, null, 4) + "\n");
}
