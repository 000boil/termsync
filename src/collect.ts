import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { SOURCES } from "./paths.js";
import { readSettings, terminalKeys } from "./settings.js";

export type Entry = {
  id: string;
  label: string;
  dest: string;
  kind: "file" | "dir" | "settings-merge";
  bundlePath: string;
};

export type Manifest = {
  version: 1;
  hostname: string;
  createdAt: string;
  entries: Entry[];
};

export function collect(staging: string): Manifest {
  const filesRoot = join(staging, "files");
  mkdirSync(filesRoot, { recursive: true });

  const entries: Entry[] = [];

  for (const src of SOURCES) {
    if (!existsSync(src.src)) continue;

    if (src.kind === "settings-merge") {
      const keys = terminalKeys(readSettings(src.src));
      if (!Object.keys(keys).length) continue;
      const rel = join("files", src.id + ".json");
      writeFileSync(join(staging, rel), JSON.stringify(keys, null, 2));
      entries.push({ id: src.id, label: src.label, dest: src.dest, kind: src.kind, bundlePath: rel });
      continue;
    }

    const rel = join("files", src.id);
    const out = join(staging, rel);
    if (src.kind === "dir") cpSync(src.src, out, { recursive: true });
    else copyFileSync(src.src, out);
    entries.push({ id: src.id, label: src.label, dest: src.dest, kind: src.kind, bundlePath: rel });
  }

  const manifest: Manifest = {
    version: 1,
    hostname: existsSync("/etc/hostname") ? readFileSync("/etc/hostname", "utf8").trim() : hostname(),
    createdAt: new Date().toISOString(),
    entries,
  };

  writeFileSync(join(staging, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}
