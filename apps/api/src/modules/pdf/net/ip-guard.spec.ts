import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isPublicIp } from "./ip-guard";

describe("isPublicIp", () => {
  test("allows public IPv4 and IPv6", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "151.101.1.69", "2606:4700:4700::1111", "2a00:1450:4009:81f::200e"]) {
      assert.equal(isPublicIp(ip), true, ip);
    }
  });

  test("blocks private, loopback, link-local, CGNAT and reserved IPv4", () => {
    for (const ip of [
      "0.0.0.0", "10.0.0.5", "100.64.0.1", "100.127.255.255", "127.0.0.1", "127.255.255.254",
      "169.254.169.254", "172.16.0.1", "172.31.255.255", "192.0.0.170", "192.0.2.1",
      "192.168.1.1", "198.18.0.1", "198.51.100.7", "203.0.113.9", "224.0.0.1", "255.255.255.255",
    ]) {
      assert.equal(isPublicIp(ip), false, ip);
    }
  });

  test("keeps the edges of blocked ranges public", () => {
    for (const ip of ["100.63.255.255", "100.128.0.0", "172.15.255.255", "172.32.0.0", "169.253.255.255"]) {
      assert.equal(isPublicIp(ip), true, ip);
    }
  });

  test("blocks special IPv6 ranges", () => {
    for (const ip of [
      "::", "::1", "fe80::1", "fe80::1%eth0", "fc00::1", "fd00:ec2::254", "fec0::1", "ff02::1",
      "2001:db8::1", "2001::1", "100::1", "[::1]",
    ]) {
      assert.equal(isPublicIp(ip), false, ip);
    }
  });

  test("checks IPv4 addresses embedded in IPv6", () => {
    assert.equal(isPublicIp("::ffff:127.0.0.1"), false);
    assert.equal(isPublicIp("::ffff:7f00:1"), false);
    assert.equal(isPublicIp("::ffff:169.254.169.254"), false);
    assert.equal(isPublicIp("::127.0.0.1"), false);
    assert.equal(isPublicIp("64:ff9b::10.0.0.1"), false);
    assert.equal(isPublicIp("2002:c0a8:0101::1"), false); // 6to4 of 192.168.1.1
    assert.equal(isPublicIp("::ffff:8.8.8.8"), true);
    assert.equal(isPublicIp("2002:0808:0808::1"), true);
  });

  test("treats non-IPs as not public", () => {
    for (const value of ["", "localhost", "example.com", "1.2.3", "999.1.1.1", "::g"]) {
      assert.equal(isPublicIp(value), false, value);
    }
  });
});
