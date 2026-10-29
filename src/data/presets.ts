import { RolePreset, SavedSession } from '../types/miaa';

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'fullstack-fintech',
    label: 'Senior Full-Stack Engineer · Stripe / FinTech',
    candidateName: 'Alex Rivera',
    targetRole: 'Senior Full-Stack Engineer, Payment Infrastructure',
    companyName: 'Vanguard Pay',
    difficulty: 'senior',
    selectedTracks: ['coding', 'system_design', 'behavioral'],
    resumeText: `ALEX RIVERA
Senior Software Engineer | TypeScript, React, Node.js, Go, PostgreSQL, Redis, Kafka

EXPERIENCE
Senior Software Engineer — LedgerFlow (2023–Present)
• Architected idempotent checkout and webhook delivery pipeline handling 4,200 req/sec in TypeScript/Node.js and PostgreSQL.
• Reduced API p99 latency by 41% by introducing Redis sliding-window rate limiting and read-replica routing.
• Led migration of merchant reconciliation dashboard to React 19 + Server-Sent Events for real-time settlement telemetry.

Software Engineer II — CloudCart (2020–2023)
• Built multi-currency cart pricing service and automated retry queues for failed subscription renewals.
• Mentored 4 junior engineers and established on-call incident runbooks.

EDUCATION
B.S. in Computer Science, University of Washington`,
    jobDescriptionText: `ROLE: Senior Full-Stack Engineer, Payment Infrastructure — Vanguard Pay
ABOUT THE ROLE:
We are looking for a Senior Full-Stack Engineer to build high-reliability payment routing, real-time merchant observability dashboards, and distributed idempotency systems.

REQUIREMENTS:
• 5+ years building production backends (TypeScript, Go, or Java) and data-intensive React applications.
• Deep understanding of concurrency control, idempotency keys, distributed rate limiting, and database isolation levels.
• Ability to design fault-tolerant webhook delivery and ledger reconciliation architectures at 10,000+ TPS.
• Track record of technical leadership, cross-team alignment, and high-severity incident resolution.`,
    defaultAlignment: {
      matchedSkills: [
        'TypeScript & Node.js Distributed Backends',
        'Idempotent Payment & Webhook Pipelines',
        'PostgreSQL & Redis Latency Optimization',
        'Real-Time React Telemetry Dashboards',
        'On-Call Incident Leadership & Mentoring',
      ],
      skillGaps: [
        'Multi-region active-active ledger consistency under network partitions',
        'Lock-free or atomic Lua sliding-window rate limiting under burst traffic',
        'Cross-functional trade-offs during high-severity payment processor outages',
      ],
      roleSummary:
        'Strong direct alignment with payment infrastructure and real-time merchant telemetry; LedgerFlow experience maps closely to Vanguard Pay’s core checkout and webhook stack.',
      interviewStrategy:
        'Probe algorithmic precision on sliding-window rate limiting, evaluate distributed webhook & ledger guarantees in System Design, and test incident leadership under ambiguity.',
      questions: [
        {
          id: 'q-coding-1',
          track: 'coding',
          title: 'Distributed Idempotent Rate Limiter with Sliding Window',
          difficulty: 'Senior (L5)',
          estimatedMinutes: 20,
          prompt:
            'Design and implement a `SlidingWindowRateLimiter` class that enforces per-merchant API quotas across high-throughput payment requests. Given `maxRequests` allowed within `windowMs` milliseconds, implement `allowRequest(merchantId: string, timestampMs: number, idempotencyKey?: string): boolean`. Duplicate requests with an already-accepted `idempotencyKey` within the active window must return `true` without consuming additional quota.',
          contextNote:
            'Directly tests your Redis/rate-limiting background from LedgerFlow and Vanguard Pay’s idempotency requirement.',
          targetComplexity: 'Time: Amortized O(1) per request · Space: O(U + K) active timestamps/keys',
          starterCode: `export class SlidingWindowRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  // Store per-merchant request timestamps and accepted idempotency keys
  private merchantLogs: Map<string, number[]> = new Map();
  private acceptedKeys: Map<string, number> = new Map();

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public allowRequest(
    merchantId: string,
    timestampMs: number,
    idempotencyKey?: string
  ): boolean {
    const windowStart = timestampMs - this.windowMs;

    // 1. Check if idempotencyKey was already accepted in the current window
    if (idempotencyKey) {
      const compositeKey = \`\${merchantId}:\${idempotencyKey}\`;
      const acceptedAt = this.acceptedKeys.get(compositeKey);
      if (acceptedAt !== undefined && acceptedAt > windowStart) {
        return true;
      }
    }

    // 2. Evict expired timestamps outside the sliding window
    const timestamps = this.merchantLogs.get(merchantId) ?? [];
    while (timestamps.length > 0 && timestamps[0] <= windowStart) {
      timestamps.shift();
    }

    // 3. Enforce quota and record accepted request
    if (timestamps.length >= this.maxRequests) {
      this.merchantLogs.set(merchantId, timestamps);
      return false;
    }

    timestamps.push(timestampMs);
    this.merchantLogs.set(merchantId, timestamps);

    if (idempotencyKey) {
      this.acceptedKeys.set(\`\${merchantId}:\${idempotencyKey}\`, timestampMs);
    }

    return true;
  }
}`,
          evaluationCriteria: [
            'Correctly handles sliding-window eviction boundary (timestampMs - windowMs)',
            'Ensures idempotent retries do not double-count against merchant quota',
            'Discusses memory cleanup for stale merchants and pointer head index optimization over Array.shift()',
          ],
          completenessScore: 35,
        },
        {
          id: 'q-sysdesign-1',
          track: 'system_design',
          title: 'High-Throughput Webhook Delivery & Merchant Reconciliation Engine',
          difficulty: 'Senior (L5)',
          estimatedMinutes: 25,
          prompt:
            'Design Vanguard Pay’s outbound Webhook Delivery & Delivery Status Telemetry System capable of processing 15,000 payment events/sec and delivering signed webhooks to 80,000 merchant endpoints with wildly varying latencies and failure rates. How do you guarantee at-least-once delivery, prevent noisy-neighbor head-of-line blocking, and expose real-time delivery status to the merchant dashboard?',
          contextNote:
            'Evaluates distributed queue partitioning, exponential backoff with jitter, circuit breaking, and SSE/WebSocket status streaming.',
          targetComplexity: '15,000 events/sec · p99 enqueue < 25ms · 99.99% durability',
          starterCode: `# System Design: Webhook Delivery Engine

## 1. Traffic & Capacity Estimation
- Peak Ingress: 15,000 payment events/sec (~1.3B events/day)
- Average Payload Size: 4 KB signed JSON -> ~60 MB/sec ingress bandwidth
- Fan-out & Retries: Up to 5x amplification during merchant endpoint brownouts

## 2. API & Webhook Security Contract
- Outbound Header: \`X-Vanguard-Signature: t=1730000000,v1=hmac_sha256(timestamp.payload)\`
- Merchant Replay API: \`POST /v1/webhooks/deliveries/{delivery_id}/retry\`

## 3. Data Model & Storage Schema
- Outbox Table (PostgreSQL): \`event_id (PK), merchant_id, payload, created_at, status\`
- Delivery Attempts Log (ClickHouse / Cassandra): \`delivery_id, merchant_id, attempt_num, http_status, latency_ms\`

## 4. High-Level Architecture & Queue Isolation
- Transactional Outbox + CDC (Debezium) -> Kafka Topic \`payment-events\`
- Two-Tier Worker Queues: Fast Lane (<250ms healthy endpoints) vs. Slow/Retry Lane (Delayed Redis ZSET / SQS scheduler)

## 5. Circuit Breaking & Noisy-Neighbor Mitigation
- Per-merchant token bucket & concurrency cap (max 20 in-flight connections per merchant)
- Automatic circuit trip after 50 consecutive 5xx/timeouts with exponential backoff + full jitter`,
          evaluationCriteria: [
            'Separates fast-path healthy merchant deliveries from slow/failing retry queues to prevent head-of-line blocking',
            'Uses Transactional Outbox pattern so payment state commits and webhook events never drift',
            'Details HMAC timestamped signature verification and circuit-breaker state transitions',
          ],
          completenessScore: 0,
        },
        {
          id: 'q-coding-2',
          track: 'coding',
          title: 'Multi-Currency Settlement Graph & Minimum Wire Transfers',
          difficulty: 'Senior (L5)',
          estimatedMinutes: 20,
          prompt:
            'Given a list of inter-subsidiary settlement obligations `transactions[i] = [fromAccount, toAccount, amountInCents]`, compute the minimum number of wire transfers required to settle all net balances across accounts, or return the simplified settlement plan.',
          contextNote:
            'Tests graph net-balance modeling, backtracking/bitmask DP, and integer precision in financial calculations.',
          targetComplexity: 'Time: O(N * 2^N) where N is non-zero net accounts · Space: O(N)',
          starterCode: `export function minWireTransfers(transactions: [number, number, number][]): number {
  const netBalance = new Map<number, number>();

  for (const [from, to, amount] of transactions) {
    netBalance.set(from, (netBalance.get(from) ?? 0) - amount);
    netBalance.set(to, (netBalance.get(to) ?? 0) + amount);
  }

  const debts = Array.from(netBalance.values()).filter((bal) => bal !== 0);

  function dfs(index: number): number {
    while (index < debts.length && debts[index] === 0) {
      index++;
    }
    if (index === debts.length) return 0;

    let minTransfers = Infinity;
    const seen = new Set<number>();

    for (let i = index + 1; i < debts.length; i++) {
      // Only settle opposite signs and skip duplicate debt values at this depth
      if (debts[i] * debts[index] < 0 && !seen.has(debts[i])) {
        seen.add(debts[i]);
        debts[i] += debts[index];
        minTransfers = Math.min(minTransfers, 1 + dfs(index + 1));
        debts[i] -= debts[index];

        // Greedy pruning: exact pair cancellation is optimal for this branch
        if (debts[i] + debts[index] === 0) break;
      }
    }
    return minTransfers;
  }

  return dfs(0);
}`,
          evaluationCriteria: [
            'Reduces raw transactions into non-zero net balances per entity first',
            'Applies exact-match zero-sum pair pruning and duplicate value skipping during DFS',
            'Uses integer cents rather than floating-point numbers to prevent precision drift',
          ],
          completenessScore: 0,
        },
        {
          id: 'q-behavioral-1',
          track: 'behavioral',
          title: 'High-Severity Production Incident & Architectural Trade-Off',
          difficulty: 'Senior (L5)',
          estimatedMinutes: 15,
          prompt:
            'Tell me about a time when a critical production service or data pipeline you owned degraded under unexpected load or an external dependency failure. How did you balance immediate customer mitigation against root-cause engineering, and what systemic guardrails did you put in place afterward?',
          contextNote:
            'Probes ownership, calm decision-making under pressure, and measurable post-mortem follow-through.',
          targetComplexity: 'STAR Framework · Quantified SLA & Latency Impact',
          starterCode: `Situation: During Peak Black Friday checkout at LedgerFlow, a downstream banking partner increased webhook ACK latency from 80ms to 4.5s, saturating our worker pool.
Task: Restore real-time payment confirmation SLAs (<500ms) for 1,200 merchants without dropping any in-flight settlement events.
Action: Shed non-critical analytics traffic, deployed a per-partner circuit breaker with Redis ZSET delayed retry lanes in 35 minutes, and isolated slow endpoints from the primary worker pool.
Result: Restored p99 checkout latency to 190ms within 12 minutes of rollout, achieved 0 lost transactions, and reduced future partner-induced alerts by 88%.`,
          evaluationCriteria: [
            'Clearly distinguishes personal technical ownership ("I diagnosed/implemented") from team actions',
            'Explains trade-off between short-term bleeding stop vs. durable architectural fix',
            'Quantifies concrete business and latency outcomes with real metrics',
          ],
          completenessScore: 0,
        },
      ],
    },
  },
  {
    id: 'backend-distributed',
    label: 'Distributed Systems Engineer · Cloud Scale',
    candidateName: 'Jordan Chen',
    targetRole: 'Staff Distributed Systems Engineer',
    companyName: 'AetherCloud DB',
    difficulty: 'staff',
    selectedTracks: ['system_design', 'coding', 'behavioral'],
    resumeText: `JORDAN CHEN
Staff Backend Engineer | Go, Rust, gRPC, Raft, RocksDB, Kubernetes

EXPERIENCE
Senior Distributed Systems Engineer — ScaleKV (2022–Present)
• Designed multi-tenant storage engine compaction scheduler in Go & RocksDB serving 1.2M IOPS across 400 nodes.
• Implemented lease-based read optimization reducing cross-AZ consensus round-trips by 58%.
• Authored RFCs for automated shard splitting and zero-downtime cluster rebalancing.`,
    jobDescriptionText: `ROLE: Staff Distributed Systems Engineer — AetherCloud DB
Build control-plane shard routers, distributed lock managers, and multi-region replication pipelines.
Requirements: Deep expertise in Go/Rust/C++, consensus protocols (Raft/Paxos), consistent hashing, and tail-latency debugging.`,
    defaultAlignment: {
      matchedSkills: [
        'Go & RocksDB Storage Engines',
        'Raft Consensus & Lease-Based Reads',
        'Automated Shard Splitting & Rebalancing',
        'Tail-Latency (p99.9) Optimization',
      ],
      skillGaps: [
        'Bounded-load consistent hashing during rapid node churn',
        'Cross-organization RFC alignment when deprecating legacy storage APIs',
      ],
      roleSummary:
        'Exceptional systems background in storage engines and consensus optimization that directly matches AetherCloud DB’s Staff bar.',
      interviewStrategy:
        'Focus on bounded-load consistent hashing in coding, multi-region shard routing in System Design, and Staff-level technical influence.',
      questions: [
        {
          id: 'q-dist-1',
          track: 'coding',
          title: 'Consistent Hash Ring with Virtual Nodes & Bounded Load',
          difficulty: 'Staff (L6)',
          estimatedMinutes: 25,
          prompt:
            'Implement a `ConsistentHashRouter` supporting virtual replicas and bounded load factor `c = 1.25` so no single storage node receives more than `ceil(c * totalKeys / numNodes)` active shard assignments during a hot-key spike.',
          contextNote: 'Tests deterministic hashing, binary search on the ring, and load-aware spillover.',
          targetComplexity: 'Time: O(log V) lookup · Space: O(N * V) virtual nodes',
          starterCode: `export class ConsistentHashRouter {
  private ring: { hash: number; nodeId: string }[] = [];
  private readonly virtualNodes: number;

  constructor(virtualNodes = 64) {
    this.virtualNodes = virtualNodes;
  }

  private hashFn(key: string): number {
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  public addNode(nodeId: string): void {
    for (let v = 0; v < this.virtualNodes; v++) {
      this.ring.push({ hash: this.hashFn(\`\${nodeId}#\${v}\`), nodeId });
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  public getNode(key: string): string | null {
    if (this.ring.length === 0) return null;
    const target = this.hashFn(key);
    let lo = 0;
    let hi = this.ring.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (this.ring[mid].hash >= target) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return this.ring[lo % this.ring.length].nodeId;
  }
}`,
          evaluationCriteria: [
            'Uses binary search on sorted virtual node hashes with wrap-around',
            'Incorporates per-node capacity ceiling to skip overloaded nodes along the ring',
            'Handles node removal and rebalancing cleanly',
          ],
          completenessScore: 0,
        },
        {
          id: 'q-dist-2',
          track: 'system_design',
          title: 'Multi-Region Distributed Lock & Lease Coordinator',
          difficulty: 'Staff (L6)',
          estimatedMinutes: 25,
          prompt:
            'Architect a high-availability Distributed Lock Service with fencing tokens used by 5,000 microservices to coordinate leader election and exclusive resource mutation. How do you guarantee safety under GC pauses and network partitions?',
          contextNote: 'Probes fencing tokens, monotonic epochs, and lease expiration semantics.',
          targetComplexity: 'Linearizable reads/writes · Fencing token verification',
          starterCode: `# System Design: Distributed Lock Coordinator with Fencing Tokens

## 1. Safety Guarantees & Fencing Tokens
- Monotonically increasing 64-bit \`fencing_token\` returned on every lock acquisition
- Downstream storage rejects any write carrying \`token < max_seen_token\`

## 2. Consensus & Quorum Topology
- 5-node Raft group across 3 Availability Zones
- Leader lease duration strictly bounded by clock drift uncertainty`,
          evaluationCriteria: [
            'Explains why TTL leases alone fail under GC pause without monotonic fencing tokens',
            'Details Raft quorum placement across 3 AZs and read-index optimization',
            'Covers watch/notification fan-out to avoid thundering herd on lock release',
          ],
          completenessScore: 0,
        },
        {
          id: 'q-dist-3',
          track: 'behavioral',
          title: 'Driving Cross-Org Consensus on a Controversial Architecture RFC',
          difficulty: 'Staff (L6)',
          estimatedMinutes: 15,
          prompt:
            'Tell me about a time you proposed an architectural change that faced strong pushback from another senior engineer or partner team. How did you resolve the disagreement and validate the right technical path?',
          contextNote: 'Assesses Staff-level technical influence without authority.',
          targetComplexity: 'STAR Framework · Benchmark-Driven Alignment',
          starterCode: `Situation: Two core storage teams disagreed on whether to adopt lease-based reads or stick with strict quorum reads.
Task: Align 35 engineers on a unified protocol without compromising linearizability guarantees.
Action: Built a deterministic Jepsen fault-injection benchmark comparing both approaches under clock skew and co-authored the safety proof.
Result: Reached unanimous RFC sign-off in 2 weeks and cut cross-AZ read latency by 58%.`,
          evaluationCriteria: [
            'Uses empirical benchmarks/prototypes rather than opinion battles',
            'Steel-mans the opposing team’s concerns fairly',
            'Demonstrates lasting organizational impact',
          ],
          completenessScore: 0,
        },
      ],
    },
  },
];

export const INITIAL_SAVED_SESSIONS: SavedSession[] = [
  {
    id: 'session-demo-1',
    createdAt: '2026-10-28T16:40:00Z',
    candidateName: 'Alex Rivera',
    targetRole: 'Senior Full-Stack Engineer, Payment Infrastructure',
    companyName: 'Vanguard Pay',
    difficulty: 'senior',
    selectedTracks: ['coding', 'system_design', 'behavioral'],
    durationSeconds: 2480,
    hintsUsedCount: 1,
    questions: ROLE_PRESETS[0].defaultAlignment.questions,
    messages: [
      {
        id: 'm-1',
        questionId: 'q-coding-1',
        sender: 'interviewer',
        content:
          'Welcome to your mock interview for Senior Full-Stack Engineer at Vanguard Pay. Let’s start with our first coding round: implementing a Distributed Idempotent Rate Limiter with a sliding window. Walk me through how you handle duplicate idempotency keys without double-charging a merchant’s quota.',
        timestamp: '16:41:10',
      },
      {
        id: 'm-2',
        questionId: 'q-coding-1',
        sender: 'candidate',
        content:
          'I maintain a composite map `<merchantId>:<idempotencyKey> -> acceptedTimestampMs` alongside the per-merchant sliding window log. Before checking the quota array, I check if the idempotency key exists and is still within `(timestampMs - windowMs, timestampMs]`. If so, I short-circuit and return `true` immediately without pushing a new timestamp.',
        timestamp: '16:44:25',
        signalDetected: 'Clear idempotency short-circuit & sliding boundary check',
        followUpType: 'probe',
      },
      {
        id: 'm-3',
        questionId: 'q-coding-1',
        sender: 'interviewer',
        content:
          'Spot on for the idempotency short-circuit. Looking at line 29 of your code, you use `timestamps.shift()` inside a `while` loop to evict expired timestamps. What happens to time complexity if a merchant has a burst window of 50,000 requests, and how would you make this O(1) amortized in production Redis?',
        timestamp: '16:44:32',
      },
    ],
    workspaces: {
      'q-coding-1': ROLE_PRESETS[0].defaultAlignment.questions[0].starterCode,
      'q-sysdesign-1': ROLE_PRESETS[0].defaultAlignment.questions[1].starterCode,
      'q-coding-2': ROLE_PRESETS[0].defaultAlignment.questions[2].starterCode,
      'q-behavioral-1': ROLE_PRESETS[0].defaultAlignment.questions[3].starterCode,
    },
    report: {
      overallScore: 88,
      hiringRecommendation: 'Strong Hire',
      executiveSummary:
        'Alex demonstrated strong command of payment idempotency semantics, sliding-window rate limiting, and transactional outbox webhook design. Code structure was clean and production-minded, with minor room to optimize array head eviction and garbage collection of expired idempotency keys.',
      competencyScores: {
        problemSolving: 89,
        technicalDepth: 87,
        communication: 91,
        roleAlignment: 86,
      },
      strengths: [
        'Immediately accounted for idempotent retry semantics before deducting merchant rate-limit quota',
        'Separated fast-path and retry webhook queues using a Transactional Outbox pattern',
        'Communicated trade-offs clearly with concrete production metrics during the incident response round',
      ],
      growthAreas: [
        'Replace `Array.shift()` O(W) eviction with a circular buffer or head-pointer index in memory-bound rate limiters',
        'Add periodic TTL sweeping for `acceptedKeys` map so long-running processes do not leak memory across inactive merchants',
        'Specify Redis Lua script atomicity when transitioning the single-node class to a multi-instance cluster',
      ],
      questionBreakdowns: [
        {
          questionId: 'q-coding-1',
          questionTitle: 'Distributed Idempotent Rate Limiter with Sliding Window',
          track: 'coding',
          score: 90,
          candidateSummary:
            'Implemented working sliding window eviction and composite `<merchantId>:<idempotencyKey>` deduplication. Handled window boundary inclusivity accurately.',
          actionableFeedback:
            'Maintain a `headIndex` pointer instead of calling `.shift()` on large arrays, and compact the slice when `headIndex > timestamps.length / 2` to guarantee strict O(1) amortized time.',
          idealAnswer: `// O(1) Amortized Pointer Queue + Atomic Redis Lua Equivalent
// In Redis: ZREMRANGEBYSCORE key -inf (now - window)
// followed by HEXISTS idemKey, ZCARD, and ZADD inside a single EVALSHA script.`,
        },
        {
          questionId: 'q-sysdesign-1',
          questionTitle: 'High-Throughput Webhook Delivery & Merchant Reconciliation Engine',
          track: 'system_design',
          score: 88,
          candidateSummary:
            'Laid out a solid two-lane Kafka + Redis delayed ZSET retry architecture with HMAC-SHA256 replay protection.',
          actionableFeedback:
            'Expand on how merchant circuit-breaker state is synchronized across stateless webhook worker pods without creating a Redis hot key.',
          idealAnswer: `// Partition webhook workers by hash(merchant_id) so local in-memory circuit state
// is warm on the assigned consumer pod, backed by async state snapshots to Redis.`,
        },
      ],
    },
  },
];
