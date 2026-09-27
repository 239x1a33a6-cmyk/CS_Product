// Questions for: Race Conditions, Critical Section, Mutex/Semaphore, Deadlock

export const OS_CONCURRENCY_QUESTIONS = [
  // ── RACE CONDITION: RECALL ────────────────────────────────────────────────
  {
    competencyKey: "os_race_condition",
    questionText:
      "What is the defining characteristic of a race condition?",
    questionType: "MCQ" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "EASY" as const,
    options: [
      { id: "a", text: "A program runs faster than expected", isCorrect: false },
      { id: "b", text: "The output depends on the non-deterministic ordering of concurrent operations on shared data", isCorrect: true },
      { id: "c", text: "Two processes are scheduled simultaneously on the same CPU", isCorrect: false },
      { id: "d", text: "A process waits indefinitely for a resource", isCorrect: false },
    ],
    correctAnswer: "b",
    explanation:
      "A race condition exists when the correctness of a result depends on the timing/interleaving of concurrent operations. The output is non-deterministic because different schedulings produce different results.",
    estimatedMinutes: 1,
    validationStatus: "APPROVED" as const,
  },

  // ── RACE CONDITION: UNDERSTANDING ────────────────────────────────────────
  {
    competencyKey: "os_race_condition",
    questionText:
      "Thread A and Thread B both execute: `counter = counter + 1` on a shared variable initialized to 0. If both run concurrently without synchronization, explain exactly how the final value could be 1 instead of 2. Show the interleaving.",
    questionType: "EXPLAIN" as const,
    cognitiveLevel: "UNDERSTANDING" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "The statement `counter = counter + 1` compiles to three operations: (1) READ counter into a register, (2) ADD 1, (3) WRITE register back to counter. A problematic interleaving: Thread A reads counter (value 0) → Thread B reads counter (value 0) → Thread A adds 1, writes 1 → Thread B adds 1, writes 1 (overwriting Thread A's result). Final value: 1 instead of 2. This happens because the read-modify-write sequence is not atomic — the scheduler can interrupt between any two operations.",
    explanation:
      "Students must show the actual interleaving, not just describe the concept abstractly.",
    rubric: {
      criteria: [
        { name: "Identifies the three-step non-atomic nature of the operation", weight: 0.3 },
        { name: "Shows a concrete interleaving with correct state at each step", weight: 0.4 },
        { name: "Arrives at the correct wrong value (1) and explains why", weight: 0.3 },
      ],
    },
    estimatedMinutes: 6,
    validationStatus: "APPROVED" as const,
  },

  // ── CRITICAL SECTION: UNDERSTANDING ─────────────────────────────────────
  {
    competencyKey: "os_critical_section",
    questionText:
      "State the three requirements for a correct critical section solution and explain what failure occurs if each requirement is violated.",
    questionType: "EXPLAIN" as const,
    cognitiveLevel: "UNDERSTANDING" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "1. Mutual Exclusion: At most one process is in the critical section at any time. Violation → race condition (multiple processes access shared resource simultaneously, corrupting data). 2. Progress: If no process is in the CS and processes wish to enter, the selection cannot be postponed indefinitely. Violation → deadlock or livelock (no one ever gets in even though no one is using it). 3. Bounded Waiting: There is a bound on the number of times other processes can enter the CS after a process requests entry and before that request is granted. Violation → starvation (a process waits forever while others repeatedly get priority).",
    explanation:
      "Each requirement prevents a distinct failure mode. Students often list the three conditions without connecting them to the failures they prevent.",
    rubric: {
      criteria: [
        { name: "States all three requirements accurately", weight: 0.3 },
        { name: "Correctly links mutual exclusion violation to race condition", weight: 0.2 },
        { name: "Correctly links progress violation to deadlock/livelock", weight: 0.25 },
        { name: "Correctly links bounded waiting violation to starvation", weight: 0.25 },
      ],
    },
    estimatedMinutes: 7,
    validationStatus: "APPROVED" as const,
  },

  // ── MUTEX/SEMAPHORE: RECALL ───────────────────────────────────────────────
  {
    competencyKey: "os_mutex_semaphore",
    questionText:
      "A counting semaphore is initialized to 3. Three threads each call wait(). A fourth thread then calls wait(). What happens to the fourth thread?",
    questionType: "MCQ" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "MEDIUM" as const,
    options: [
      { id: "a", text: "It proceeds immediately because the semaphore has spare capacity", isCorrect: false },
      { id: "b", text: "It blocks until one of the first three threads calls signal()", isCorrect: true },
      { id: "c", text: "It increments the semaphore to 4", isCorrect: false },
      { id: "d", text: "It throws an error because the semaphore cannot go below zero", isCorrect: false },
    ],
    correctAnswer: "b",
    explanation:
      "A counting semaphore initialized to 3 allows up to 3 concurrent holders. After 3 wait() calls, the semaphore value is 0. The 4th wait() finds the value at 0, so the calling thread blocks until a signal() increments it above 0.",
    estimatedMinutes: 2,
    validationStatus: "APPROVED" as const,
  },

  // ── MUTEX/SEMAPHORE: APPLICATION ─────────────────────────────────────────
  {
    competencyKey: "os_mutex_semaphore",
    questionText:
      "You have a database connection pool with at most 5 simultaneous connections. Multiple threads request connections. Show how you would use a semaphore to manage this correctly. What value do you initialize it to and why?",
    questionType: "SCENARIO" as const,
    cognitiveLevel: "APPLICATION" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "Initialize a counting semaphore to 5 (the maximum number of simultaneous connections). Before a thread acquires a connection: call wait() — this decrements the semaphore. If 5 threads already hold connections, the semaphore value is 0 and new threads block on wait(). When a thread finishes with a connection and returns it to the pool: call signal() — this increments the semaphore, allowing one waiting thread to proceed. This ensures at most 5 connections are active at any moment, without any thread having to poll or busy-wait.",
    explanation:
      "Classic counting semaphore use case. Tests whether students can map the abstract concept to a concrete resource management scenario.",
    rubric: {
      criteria: [
        { name: "Initializes semaphore to 5 (not 1, not 0)", weight: 0.25 },
        { name: "Calls wait() before acquiring connection", weight: 0.25 },
        { name: "Calls signal() after releasing connection", weight: 0.25 },
        { name: "Explains blocking behavior when all 5 are in use", weight: 0.25 },
      ],
    },
    estimatedMinutes: 6,
    validationStatus: "APPROVED" as const,
  },

  // ── DEADLOCK: RECALL ──────────────────────────────────────────────────────
  {
    competencyKey: "os_deadlock",
    questionText:
      "Which of the following are Coffman's four necessary conditions for deadlock?",
    questionType: "MULTI_SELECT" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "MEDIUM" as const,
    options: [
      { id: "a", text: "Mutual Exclusion", isCorrect: true },
      { id: "b", text: "Hold and Wait", isCorrect: true },
      { id: "c", text: "No Preemption", isCorrect: true },
      { id: "d", text: "Circular Wait", isCorrect: true },
      { id: "e", text: "Starvation", isCorrect: false },
      { id: "f", text: "Priority Inversion", isCorrect: false },
    ],
    correctAnswer: "a,b,c,d",
    explanation:
      "All four Coffman conditions must hold simultaneously for deadlock: Mutual Exclusion (resources not shareable), Hold and Wait (process holds one, waits for another), No Preemption (resources can't be forcibly taken), Circular Wait (circular chain of processes each waiting for the next).",
    estimatedMinutes: 2,
    validationStatus: "APPROVED" as const,
  },

  // ── DEADLOCK: REASONING ──────────────────────────────────────────────────
  {
    competencyKey: "os_deadlock",
    questionText:
      "Process P1 holds Lock A and requests Lock B. Process P2 holds Lock B and requests Lock A. Explain why this is a deadlock. Then propose two different strategies to prevent this specific situation, explaining the trade-off of each.",
    questionType: "REASONING" as const,
    cognitiveLevel: "REASONING" as const,
    difficulty: "HARD" as const,
    referenceAnswer:
      "This is a deadlock because all four Coffman conditions hold: Mutual Exclusion (only one process can hold each lock), Hold and Wait (P1 holds A while waiting for B; P2 holds B while waiting for A), No Preemption (neither lock can be forcibly taken), Circular Wait (P1→B→P2→A→P1 forms a cycle). Neither process can proceed. Prevention strategies: (1) Lock Ordering: Impose a global order on all locks (e.g., always acquire Lock A before Lock B). Require all code to acquire locks in this order. P2 would try to acquire A first, block behind P1, then P1 acquires B and completes, releasing both — no deadlock. Trade-off: requires global coordination, may reduce parallelism if many threads need Lock A first. (2) Try-and-Release (no Hold-and-Wait): If P1 cannot acquire Lock B, release Lock A and retry later. Trade-off: simpler to implement but may cause livelock if both processes keep releasing and retrying simultaneously. A correct implementation adds randomized backoff.",
    explanation:
      "This question requires identifying the deadlock, tracing the cycle, and then reasoning about prevention strategies with their real trade-offs.",
    rubric: {
      criteria: [
        { name: "Identifies deadlock and traces all four Coffman conditions", weight: 0.25 },
        { name: "Draws or describes the circular wait correctly", weight: 0.15 },
        { name: "Proposes lock ordering as a valid strategy", weight: 0.2 },
        { name: "Proposes try-and-release (or another valid strategy) with trade-offs", weight: 0.2 },
        { name: "Mentions livelock risk with naive try-and-release", weight: 0.2 },
      ],
    },
    estimatedMinutes: 10,
    validationStatus: "APPROVED" as const,
  },

  // ── SCHEDULING: REASONING ─────────────────────────────────────────────────
  {
    competencyKey: "os_scheduling_algorithms",
    questionText:
      "Four processes arrive: P1 (burst 8ms, arrives t=0), P2 (burst 4ms, arrives t=1), P3 (burst 9ms, arrives t=2), P4 (burst 5ms, arrives t=3). Calculate average waiting time under FCFS and SJF (non-preemptive). Which is better and why?",
    questionType: "REASONING" as const,
    cognitiveLevel: "REASONING" as const,
    difficulty: "HARD" as const,
    referenceAnswer:
      "FCFS (arrival order: P1,P2,P3,P4): P1 waits 0, P2 waits 7 (P1 runs 0-8), P3 waits 11 (P1+P2 run 0-12), P4 waits 20 (P1+P2+P3 run 0-21). Average = (0+7+11+20)/4 = 9.5ms. SJF (non-preemptive, pick shortest available): At t=0 only P1 is available → runs first (0-8). At t=8, available: P2(4), P3(9), P4(5). Pick P2(4), runs 8-12. At t=12, available: P3(9), P4(5). Pick P4(5), runs 12-17. P3 runs 17-26. Waiting: P1=0, P2=7, P4=9, P3=15. Average=(0+7+9+15)/4=7.75ms. SJF is better (lower average waiting time). SJF is provably optimal for minimizing average waiting time for a given set of jobs. However, it requires knowing burst times in advance (impractical for interactive systems) and can cause starvation of long jobs.",
    explanation:
      "Tests both calculation skill and the ability to reason about why SJF is theoretically optimal yet practically limited.",
    rubric: {
      criteria: [
        { name: "Correct FCFS calculation and average", weight: 0.25 },
        { name: "Correct SJF order and calculation", weight: 0.3 },
        { name: "Correctly identifies SJF as better", weight: 0.1 },
        { name: "Explains SJF's optimality claim correctly", weight: 0.2 },
        { name: "Notes SJF's practical limitations (future knowledge, starvation)", weight: 0.15 },
      ],
    },
    estimatedMinutes: 10,
    validationStatus: "APPROVED" as const,
  },
];
