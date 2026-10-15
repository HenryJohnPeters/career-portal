import { isIP } from "node:net";

/*
 * Decides whether an IP address may be fetched by the server. Anything that
 * is not plain public unicast is refused: private, loopback, link-local
 * (incl. cloud metadata 169.254.169.254 / fd00:ec2::254), CGNAT, multicast,
 * documentation/benchmark ranges, and IPv6 forms that embed an IPv4 address
 * (mapped, NAT64, 6to4) are checked by their embedded address.
 */

type Cidr4 = readonly [base: number, bits: number];

const BLOCKED_V4: readonly Cidr4[] = [
  [ipv4("0.0.0.0"), 8], // "this network"
  [ipv4("10.0.0.0"), 8], // private
  [ipv4("100.64.0.0"), 10], // CGNAT
  [ipv4("127.0.0.0"), 8], // loopback
  [ipv4("169.254.0.0"), 16], // link-local, cloud metadata
  [ipv4("172.16.0.0"), 12], // private
  [ipv4("192.0.0.0"), 24], // IETF protocol assignments
  [ipv4("192.0.2.0"), 24], // TEST-NET-1
  [ipv4("192.88.99.0"), 24], // 6to4 relay anycast
  [ipv4("192.168.0.0"), 16], // private
  [ipv4("198.18.0.0"), 15], // benchmarking
  [ipv4("198.51.100.0"), 24], // TEST-NET-2
  [ipv4("203.0.113.0"), 24], // TEST-NET-3
  [ipv4("224.0.0.0"), 4], // multicast
  [ipv4("240.0.0.0"), 4], // reserved + broadcast
];

function ipv4(text: string): number {
  const parts = text.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inCidr4(address: number, [base, bits]: Cidr4): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return ((address & mask) >>> 0) === ((base & mask) >>> 0);
}

function isBlockedV4(address: number): boolean {
  return BLOCKED_V4.some((cidr) => inCidr4(address, cidr));
}

/** Parse an IPv6 address (no zone id) into eight 16-bit groups, or null. */
function parseIpv6(text: string): number[] | null {
  let head = text;
  let tailV4: number[] = [];
  const lastColon = text.lastIndexOf(":");
  if (text.includes(".", lastColon)) {
    const v4 = text.slice(lastColon + 1);
    if (isIP(v4) !== 4) return null;
    const n = ipv4(v4);
    tailV4 = [n >>> 16, n & 0xffff];
    head = text.slice(0, lastColon + 1) + "0:0";
  }
  const halves = head.split("::");
  if (halves.length > 2) return null;
  const toGroups = (part: string) =>
    part === "" ? [] : part.split(":").map((g) => parseInt(g, 16));
  const left = toGroups(halves[0]);
  const right = halves.length === 2 ? toGroups(halves[1]) : [];
  const missing = 8 - left.length - right.length;
  if (halves.length === 1 ? missing !== 0 : missing < 0) return null;
  const groups = [...left, ...new Array(Math.max(0, missing)).fill(0), ...right];
  if (groups.length !== 8 || groups.some((g) => !Number.isInteger(g) || g < 0 || g > 0xffff)) {
    return null;
  }
  if (tailV4.length) groups.splice(6, 2, ...tailV4);
  return groups;
}

function embeddedV4(hi: number, lo: number): number {
  return ((hi << 16) | lo) >>> 0;
}

function isBlockedV6(g: number[]): boolean {
  const [g0, g1, g2, , , g5, g6, g7] = g;
  const allZero = (from: number, to: number) => g.slice(from, to).every((x) => x === 0);

  if (allZero(0, 8)) return true; // ::
  if (allZero(0, 7) && g7 === 1) return true; // ::1
  // IPv4-mapped ::ffff:a.b.c.d and IPv4-compatible ::a.b.c.d
  if (allZero(0, 5) && (g5 === 0xffff || g5 === 0)) return isBlockedV4(embeddedV4(g6, g7));
  // NAT64 64:ff9b::/96
  if (g0 === 0x64 && g1 === 0xff9b && allZero(2, 6)) return isBlockedV4(embeddedV4(g6, g7));
  // 6to4 2002::/16 embeds the IPv4 address in groups 1-2
  if (g0 === 0x2002) return isBlockedV4(embeddedV4(g1, g2));
  if (g0 === 0x2001 && g1 === 0) return true; // Teredo 2001::/32
  if (g0 === 0x2001 && g1 === 0xdb8) return true; // documentation
  if (g0 === 0x100 && allZero(1, 4)) return true; // discard 100::/64
  if ((g0 & 0xfe00) === 0xfc00) return true; // unique local fc00::/7 (incl. fd00:ec2::254)
  if ((g0 & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((g0 & 0xffc0) === 0xfec0) return true; // site-local fec0::/10
  if ((g0 & 0xff00) === 0xff00) return true; // multicast ff00::/8
  return false;
}

/**
 * True when `address` is a public unicast IP the server may connect to.
 * Anything unparsable is treated as not public.
 */
export function isPublicIp(address: string): boolean {
  const ip = address.trim().replace(/^\[|\]$/g, "").split("%")[0];
  const family = isIP(ip);
  if (family === 4) return !isBlockedV4(ipv4(ip));
  if (family === 6) {
    const groups = parseIpv6(ip.toLowerCase());
    return groups !== null && !isBlockedV6(groups);
  }
  return false;
}
