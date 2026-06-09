#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { rmSync } from "node:fs";
import { apply } from "./apply.js";
import { pack, unpack, toDownloads, revealInFinder } from "./bundle.js";
import { push } from "./client.js";
import { scan } from "./discovery.js";
import { listen } from "./server.js";
import { c } from "./theme.js";
import { header, spinner, waitPanel, peerList, results, fail, help, pickRole } from "./ui.js";

async function ask(q: string) {
  const rl = createInterface({ input, output });
  const a = await rl.question(q);
  rl.close();
  return a.trim();
}

function flag(args: string[], name: string) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

async function receive() {
  header();
  const out = await listen({ onReady: waitPanel });
  results(out.applied, out.skipped);
  out.stop();
}

async function send(args: string[]) {
  header();

  let host = flag(args, "--host");
  let port = Number(flag(args, "--port") ?? 0);
  let code = flag(args, "--code") ?? "";

  if (!host) {
    const s = spinner("looking on lan…");
    s.start();
    const peers = await scan(6000);
    s.stop();

    if (!peers.length) {
      console.log(c.warn("nobody advertising, enter ip manually\n"));
      host = await ask(`${c.mute("ip")} `);
      port = Number(await ask(`${c.mute("port")} `));
    } else if (peers.length === 1) {
      host = peers[0]!.host;
      port = peers[0]!.port;
      console.log(c.ok(`using ${peers[0]!.name}\n`));
    } else {
      peerList(peers);
      const n = Number(await ask(`${c.mute("pick #")} `)) - 1;
      if (!peers[n]) {
        fail("bad pick");
        process.exit(1);
      }
      host = peers[n]!.host;
      port = peers[n]!.port;
    }
  }

  if (!code) code = (await ask(`${c.mute("code on receiver")} `)).toUpperCase();

  const s = spinner("grabbing configs");
  s.start();
  const { path: bundle, manifest } = pack();
  s.stop();

  if (!manifest.entries.length) {
    rmSync(bundle, { force: true });
    fail("nothing to send from this mac");
    process.exit(1);
  }

  console.log(c.dim(`${manifest.entries.length} items from ${manifest.hostname}\n`));

  const xfer = spinner(`pushing → ${host}:${port}`);
  xfer.start();
  try {
    const r = await push(host, port, code, bundle);
    xfer.succeed("sent");
    results(r.applied, r.skipped);
  } catch (e) {
    xfer.fail((e as Error).message);
    process.exit(1);
  } finally {
    rmSync(bundle, { force: true });
  }
}

async function exportCmd(args: string[]) {
  header();
  const s = spinner("packing");
  s.start();
  const { path: bundle, manifest } = pack();
  s.stop();

  if (!manifest.entries.length) {
    rmSync(bundle, { force: true });
    fail("nothing to export");
    process.exit(1);
  }

  const dest = toDownloads(bundle);
  rmSync(bundle, { force: true });
  console.log(c.ok(dest));
  console.log(c.dim(`${manifest.entries.length} items\n`));

  if (args.includes("--airdrop")) {
    revealInFinder(dest);
    console.log(c.dim("finder open — airdrop it, then on other mac:"));
    console.log(c.dim(`  termsync import "${dest}"\n`));
  }
}

async function importCmd(file?: string) {
  header();
  if (!file) {
    fail("termsync import <file>");
    process.exit(1);
  }

  const s = spinner("unpacking");
  s.start();
  const dir = unpack(file);
  s.stop();

  try {
    const r = apply(dir);
    results(r.applied, r.skipped);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function wizard() {
  header();
  pickRole();
  const choice = await ask(`${c.mute("1/2")} `);
  if (choice === "1" || choice.toLowerCase().startsWith("r")) return receive();
  if (choice === "2" || choice.toLowerCase().startsWith("s")) return send([]);
  fail("1 or 2");
  process.exit(1);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === "-h" || cmd === "--help") {
    header();
    help();
    return;
  }

  try {
    switch (cmd) {
      case "sync":
        await wizard();
        break;
      case "listen":
      case "receive":
        await receive();
        break;
      case "send":
        await send(rest);
        break;
      case "export":
        await exportCmd(rest);
        break;
      case "import":
        await importCmd(rest[0]);
        break;
      default:
        fail(`unknown: ${cmd}`);
        help();
        process.exit(1);
    }
  } catch (e) {
    fail((e as Error).message);
    process.exit(1);
  }
}

main();
