/** Deterministic teaching models. These are deliberately not network emulators. */
export type NetworkNode = "A" | "B" | "C" | "D" | "E" | "F";
export type NetworkEdge = readonly [NetworkNode, NetworkNode];
export const NETWORK_EDGES: readonly NetworkEdge[] = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "C"],
  ["C", "E"],
  ["D", "F"],
  ["E", "F"],
  ["D", "E"],
];
export function edgeKey(a: NetworkNode, b: NetworkNode): string {
  return [a, b].sort().join("-");
}
export function shortestPath(
  edges: readonly NetworkEdge[],
  disabled: ReadonlySet<string> = new Set(),
  start: NetworkNode = "A",
  end: NetworkNode = "F",
): NetworkNode[] {
  const queue: NetworkNode[][] = [[start]];
  const visited = new Set<NetworkNode>([start]);
  for (let index = 0; index < queue.length; index++) {
    const path = queue[index];
    const current = path[path.length - 1];
    if (current === end) return path;
    for (const [a, b] of edges) {
      if (disabled.has(edgeKey(a, b))) continue;
      const next = a === current ? b : b === current ? a : undefined;
      if (!next || visited.has(next)) continue;
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return [];
}

export const DNS_RECORDS = {
  "school.example": "192.0.2.10",
  "library.example": "192.0.2.20",
} as const;
export type DemoDomain = keyof typeof DNS_RECORDS;
export type DnsStation = "client" | "resolver" | "root" | "tld" | "authority";
export type DnsStep = {
  from: DnsStation;
  to: DnsStation;
  kind: "query" | "referral" | "answer";
  text: string;
};
export function dnsLookup(
  domain: DemoDomain,
  cache: Partial<Record<DemoDomain, string>>,
): { hit: boolean; address: string; steps: DnsStep[] } {
  const address = DNS_RECORDS[domain];
  const hit = cache[domain] === address;
  const first: DnsStep = {
    from: "client",
    to: "resolver",
    kind: "query",
    text: `${domain} ямар IP хаягтай вэ?`,
  };
  const last: DnsStep = {
    from: "resolver",
    to: "client",
    kind: "answer",
    text: `${address} хаягийг хэрэглэгчид буцаалаа.`,
  };
  if (hit)
    return {
      hit,
      address,
      steps: [
        first,
        { ...last, text: `Кэш дэх ${address} хаягийг шууд буцаалаа.` },
      ],
    };
  return {
    hit,
    address,
    steps: [
      first,
      {
        from: "resolver",
        to: "root",
        kind: "query",
        text: "Хаяг хайгч үндэс серверээс .example-ийн серверийг асууна.",
      },
      {
        from: "root",
        to: "resolver",
        kind: "referral",
        text: "Үндэс сервер .example-ийн серверийг заана.",
      },
      {
        from: "resolver",
        to: "tld",
        kind: "query",
        text: "Хаяг хайгч .example-ийн серверээс домэйны серверийг асууна.",
      },
      {
        from: "tld",
        to: "resolver",
        kind: "referral",
        text: "Домэйны эрх бүхий серверийг зааж өглөө.",
      },
      {
        from: "resolver",
        to: "authority",
        kind: "query",
        text: `${domain}-ийн IP хаягийг эрх бүхий серверээс асууна.`,
      },
      {
        from: "authority",
        to: "resolver",
        kind: "answer",
        text: `Эрх бүхий сервер ${address} хаягийг буцаалаа.`,
      },
      last,
    ],
  };
}

/** Balanced Unicode-safe chunks; display IDs are not TCP byte sequence numbers. */
export function splitMessage(message: string, maximum = 4): string[] {
  const characters = Array.from(message);
  if (!characters.length) return [];
  const count = Math.min(Math.max(1, Math.floor(maximum)), characters.length);
  const chunks: string[] = [];
  for (let index = 0; index < count; index++) {
    chunks.push(
      characters
        .slice(
          Math.floor((index * characters.length) / count),
          Math.floor(((index + 1) * characters.length) / count),
        )
        .join(""),
    );
  }
  return chunks;
}
export function reassemble(
  chunks: readonly string[],
  received: readonly number[],
) {
  const present = new Set(
    received.filter((id) => id >= 1 && id <= chunks.length),
  );
  let contiguous = 0;
  while (present.has(contiguous + 1)) contiguous++;
  return {
    text: chunks.slice(0, contiguous).join(""),
    buffered: [...present]
      .filter((id) => id > contiguous)
      .sort((a, b) => a - b),
    nextExpected: contiguous + 1,
    complete: contiguous === chunks.length,
  };
}
export const PACKET_EVENTS = [
  {
    received: [],
    caption: "Дөрвөн хэсгийг илгээхэд бэлэн.",
    detail: "Замд саатах, дараалал солигдох, хэсэг алдагдах боломжтой.",
  },
  {
    received: [2],
    caption: "② түрүүлж ирлээ.",
    detail:
      "① хараахан ирээгүй учраас ②-ыг буферт хадгална. Програмд юу ч өгөхгүй.",
  },
  {
    received: [2, 1],
    caption: "① ирэхэд эхний хоёр хэсэг дарааллаа оллоо.",
    detail: "Програмд ①②-ыг өгнө. ACK нь дараагийн хүлээж буй байтыг заана.",
  },
  {
    received: [2, 1],
    caption: "③ замдаа алдагдлаа.",
    detail:
      "Алдагдсан хэсгийг энэ загварт зориудаар сонгосон. Бусад хэсэг үргэлжлэн явна.",
  },
  {
    received: [2, 1, 4],
    caption: "④ ирсэн ч ③-ын зайг нөхөхгүй.",
    detail:
      "④ буферт үлдэнэ. Хүлээн авагч ③-ын эхний байтыг хүлээж буйгаа ACK-аар илэрхийлнэ.",
  },
  {
    received: [2, 1, 4],
    caption: "Илгээгчийн дахин илгээх хугацаа дууслаа.",
    detail:
      "Шаардлагатай баталгаа ирээгүй тул TCP алдагдсан өгөгдлийг автоматаар дахин илгээнэ.",
  },
  {
    received: [2, 1, 4],
    caption: "③-ыг дахин илгээж байна.",
    detail:
      "Хэрэглэгч дахин илгээх товч дарахгүй. Үүнийг протокол өөрөө гүйцэтгэнэ.",
  },
  {
    received: [2, 1, 4, 3],
    caption: "③ ирлээ. Мэдээлэл бүтэн боллоо.",
    detail:
      "③④ дарааллаараа програмд очно. Хүлээн авагч бүх өгөгдлийг хүлээн авснаа батална.",
  },
] as const;

/** Decimal MB and Mbps. No setup, headers, queueing, loss, or competing traffic. */
export function transferModel(
  megabytes: number,
  bandwidthMbps: number,
  propagationMs: number,
) {
  if (
    !Number.isFinite(megabytes) ||
    megabytes < 0 ||
    !Number.isFinite(bandwidthMbps) ||
    bandwidthMbps <= 0 ||
    !Number.isFinite(propagationMs) ||
    propagationMs < 0
  ) {
    throw new RangeError(
      "Transfer values must be finite and bandwidth must be positive.",
    );
  }
  const megabits = megabytes * 8;
  const serialization = megabits / bandwidthMbps;
  const propagation = propagationMs / 1000;
  return {
    megabits,
    serialization,
    propagation,
    firstArrival: propagation,
    lastArrival: serialization + propagation,
  };
}
export function transferAt(
  time: number,
  megabytes: number,
  bandwidthMbps: number,
  propagationMs: number,
) {
  const model = transferModel(megabytes, bandwidthMbps, propagationMs);
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return {
    ...model,
    emitted: model.serialization === 0 ? 1 : clamp(time / model.serialization),
    received:
      model.serialization === 0
        ? Number(time >= model.propagation)
        : clamp((time - model.propagation) / model.serialization),
  };
}
export function securityOutcome(https: boolean, allow443: boolean) {
  return {
    port: https ? 443 : 80,
    allowed: !https || allow443,
    encrypted: https,
    siteIsTrustworthy: undefined,
  };
}

/** Maps browser elapsed milliseconds to bounded simulation seconds. */
export function playbackTime(
  initial: number,
  elapsedMs: number,
  duration: number,
  rate = 1,
): number {
  return Math.min(
    duration,
    Math.max(0, initial) + (Math.max(0, elapsedMs) / 1000) * rate,
  );
}
