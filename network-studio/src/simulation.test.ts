/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
  DNS_RECORDS,
  NETWORK_EDGES,
  PACKET_EVENTS,
  playbackTime,
  dnsLookup,
  edgeKey,
  reassemble,
  securityOutcome,
  shortestPath,
  splitMessage,
  transferAt,
  transferModel,
} from "./simulation";

describe("routing changes only through available graph edges", () => {
  test("chooses a minimum-hop route and reroutes after a cut", () => {
    expect(shortestPath(NETWORK_EDGES)).toEqual(["A", "B", "D", "F"]);
    const disabled = new Set([edgeKey("B", "D")]);
    expect(shortestPath(NETWORK_EDGES, disabled)).toEqual(["A", "C", "E", "F"]);
    for (const [a, b] of NETWORK_EDGES)
      expect(edgeKey(a, b)).toBe(edgeKey(b, a));
  });
  test("never invents a path for an isolated source", () => {
    expect(shortestPath(NETWORK_EDGES, new Set(["A-B", "A-C"]))).toEqual([]);
    expect(shortestPath([], new Set(), "A", "A")).toEqual(["A"]);
  });
});
describe("DNS uses an exact name cache", () => {
  test("cold lookup has separate resolver requests and replies", () => {
    const lookup = dnsLookup("school.example", {});
    expect(lookup.hit).toBe(false);
    expect(lookup.steps.map(({ from, to }) => `${from}>${to}`)).toEqual([
      "client>resolver",
      "resolver>root",
      "root>resolver",
      "resolver>tld",
      "tld>resolver",
      "resolver>authority",
      "authority>resolver",
      "resolver>client",
    ]);
    expect(lookup.address).toBe("192.0.2.10");
  });
  test("warm exact answer skips external servers, another name does not", () => {
    const cache = { "school.example": DNS_RECORDS["school.example"] };
    expect(dnsLookup("school.example", cache).steps).toHaveLength(2);
    expect(dnsLookup("library.example", cache).hit).toBe(false);
    expect(dnsLookup("library.example", cache).address).toBe("192.0.2.20");
  });
});
describe("ordered delivery is separate from arrival", () => {
  test("Unicode chunks are nonempty and reconstruct the input", () => {
    for (const input of ["Сүлжээ биднийг холбоно.", "A", "🛰️📦"]) {
      const chunks = splitMessage(input);
      expect(chunks.length).toBeLessThanOrEqual(4);
      expect(chunks.every(Boolean)).toBe(true);
      expect(chunks.join("")).toBe(input);
    }
    expect(splitMessage("")).toEqual([]);
  });
  test("buffering a later chunk cannot fill an earlier gap", () => {
    const chunks = ["Сүл", "жээ ", "биднийг ", "холбоно."];
    expect(reassemble(chunks, [2])).toEqual({
      text: "",
      buffered: [2],
      nextExpected: 1,
      complete: false,
    });
    expect(reassemble(chunks, [2, 1, 4])).toEqual({
      text: "Сүлжээ ",
      buffered: [4],
      nextExpected: 3,
      complete: false,
    });
    expect(reassemble(chunks, [2, 1, 4, 3, 3])).toEqual({
      text: chunks.join(""),
      buffered: [],
      nextExpected: 5,
      complete: true,
    });
  });
  test("scripted automatic retry eventually delivers the whole message", () => {
    const chunks = splitMessage("Сүлжээ биднийг холбоно.");
    expect(reassemble(chunks, PACKET_EVENTS[4].received).complete).toBe(false);
    expect(reassemble(chunks, PACKET_EVENTS.at(-1)!.received).text).toBe(
      chunks.join(""),
    );
  });
});
describe("bandwidth and propagation have distinct effects", () => {
  test("1 MB over 10 Mbps plus 100 ms arrives fully at 0.9 s", () => {
    expect(transferModel(1, 10, 100)).toEqual({
      megabits: 8,
      serialization: 0.8,
      propagation: 0.1,
      firstArrival: 0.1,
      lastArrival: 0.9,
    });
  });
  test("doubling bandwidth halves serialization without changing first arrival", () => {
    const slow = transferModel(1, 10, 100);
    const fast = transferModel(1, 20, 100);
    expect(fast.serialization).toBe(slow.serialization / 2);
    expect(fast.firstArrival).toBe(slow.firstArrival);
  });
  test("adding latency delays arrival without changing emission rate", () => {
    const close = transferAt(0.2, 1, 10, 100);
    const far = transferAt(0.2, 1, 10, 300);
    expect(close.emitted).toBe(far.emitted);
    expect(far.lastArrival - close.lastArrival).toBeCloseTo(0.2);
    expect(close.received).toBeGreaterThan(0);
    expect(far.received).toBe(0);
  });
  test("receiving starts after propagation and finishes only after serialization", () => {
    expect(transferAt(0, 1, 10, 100).received).toBe(0);
    expect(transferAt(0.5, 1, 10, 100).received).toBe(0.5);
    expect(transferAt(5, 1, 10, 100).received).toBe(1);
    expect(() => transferModel(1, 0, 100)).toThrow();
  });
});
test("firewall access and encryption are independent", () => {
  expect(securityOutcome(true, false)).toMatchObject({
    port: 443,
    allowed: false,
    encrypted: true,
  });
  expect(securityOutcome(false, false)).toMatchObject({
    port: 80,
    allowed: true,
    encrypted: false,
  });
  expect(securityOutcome(true, true).siteIsTrustworthy).toBeUndefined();
});

describe("playback clock timestamp boundaries", () => {
  test("a frame timestamp before the timer origin cannot select a negative packet event", () => {
    const time = playbackTime(0, -8.25, 7, 0.72);
    expect(time).toBe(0);
    expect(PACKET_EVENTS[Math.floor(time)]).toBeDefined();
  });
  test("resuming never moves backward and elapsed time stops at the final event", () => {
    expect(playbackTime(3.25, -5, 7, 0.72)).toBe(3.25);
    expect(playbackTime(3.25, 1000, 7, 0.72)).toBeCloseTo(3.97);
    expect(playbackTime(3.25, 10000, 7, 0.72)).toBe(7);
  });
});
