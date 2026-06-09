import Bonjour from "bonjour-service";

const TYPE = "termsync";
const PROTO = "tcp";

export type Peer = { name: string; host: string; port: number };

export function advertise(port: number, name: string) {
  const bj = new Bonjour();
  bj.publish({ name, type: TYPE, protocol: PROTO, port, txt: { v: "1" } });
  return bj;
}

export function scan(ms = 5000): Promise<Peer[]> {
  return new Promise((resolve) => {
    const bj = new Bonjour();
    const found = new Map<string, Peer>();

    const browser = bj.find({ type: TYPE, protocol: PROTO });
    browser.on("up", (svc) => {
      const host = svc.referer?.address || svc.host || svc.fqdn;
      if (!host || !svc.port) return;
      found.set(`${host}:${svc.port}`, { name: svc.name, host, port: svc.port });
    });

    setTimeout(() => {
      browser.stop();
      bj.destroy();
      resolve([...found.values()]);
    }, ms);
  });
}
