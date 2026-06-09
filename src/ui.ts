import boxen from "boxen";
import ora from "ora";
import qrcode from "qrcode-terminal";
import { c } from "./theme.js";
import type { ListenInfo } from "./server.js";

export function header(): void {
  console.log(
    boxen(
      [c.accent.bold("termsync"), c.mute("terminal look, other mac")].join("\n"),
      { padding: { top: 0, bottom: 0, left: 1, right: 1 }, margin: 1, borderStyle: "round", borderColor: "cyan" },
    ),
  );
}

export function spinner(msg: string) {
  return ora({ text: c.mute(msg), color: "cyan", spinner: "dots" });
}

export function waitPanel(info: ListenInfo): void {
  const lines = [
    c.bold("waiting for send"),
    "",
    `${c.mute("code")}  ${c.hot.bold(info.pairingCode)}`,
    `${c.mute("port")}  ${info.port}`,
  ];

  if (info.ips.length) {
    lines.push("", c.mute("on this network:"));
    for (const ip of info.ips) {
      lines.push(c.dim(`  ${ip}:${info.port}`));
    }
  }

  console.log(
    boxen(lines.join("\n"), {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: "round",
      borderColor: "green",
    }),
  );

  if (info.ips[0]) {
    const link = `termsync://${info.ips[0]}:${info.port}?c=${info.pairingCode}`;
    console.log(c.mute("qr (optional)"));
    qrcode.generate(link, { small: true });
    console.log(c.dim(link), "\n");
  }
}

export function pickRole(): string {
  console.log(c.bold("which mac is this?"));
  console.log(`  ${c.accent("1")} receive (copy style here)`);
  console.log(`  ${c.accent("2")} send (this mac has the look)`);
  console.log();
  return "role";
}

export function peerList(peers: { name: string; host: string; port: number }[]): void {
  console.log(c.bold("found:"));
  peers.forEach((p, i) => {
    console.log(`  ${c.accent(String(i + 1))}  ${p.name}  ${c.dim(`${p.host}:${p.port}`)}`);
  });
  console.log();
}

export function results(ok: string[], skip: string[]): void {
  if (ok.length) {
    console.log(c.ok.bold("done"));
    for (const x of ok) console.log(c.ok(`  + ${x}`));
  }
  if (skip.length) {
    console.log(c.warn.bold("skipped"));
    for (const x of skip) console.log(c.warn(`  - ${x}`));
  }
  console.log(c.dim("\nrestart terminal / iterm / cursor"));
}

export function fail(msg: string): void {
  console.error(
    boxen(c.err(msg), { padding: 1, borderColor: "red", borderStyle: "bold" }),
  );
}

export function help(): void {
  console.log(`
${c.bold("usage")}
  termsync              wizard
  termsync listen       wait for incoming
  termsync send         push to a listening mac
  termsync export       save bundle to ~/Downloads
  termsync import FILE  apply bundle

${c.bold("flags")}
  --host IP   --port N   --code CODE   --airdrop
`);
}
