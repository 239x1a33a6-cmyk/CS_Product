// Questions for: Threads, Process vs Thread, User vs Kernel Threads

export const OS_THREADS_QUESTIONS = [
  // ── RECALL ──────────────────────────────────────────────────────────────
  {
    competencyKey: "os_thread_definition",
    questionText:
      "Which of the following does a thread have exclusively (not shared with sibling threads in the same process)?",
    questionType: "MULTI_SELECT" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "EASY" as const,
    options: [
      { id: "a", text: "Program counter", isCorrect: true },
      { id: "b", text: "Heap memory", isCorrect: false },
      { id: "c", text: "Register set", isCorrect: true },
      { id: "d", text: "Stack", isCorrect: true },
      { id: "e", text: "Global variables", isCorrect: false },
      { id: "f", text: "Open file descriptors", isCorrect: false },
    ],
    correctAnswer: "a,c,d",
    explanation:
      "Each thread has its own PC, register set, and stack (because each thread has its own execution context and call chain). Heap, global variables, and file descriptors are shared among all threads in the process.",
    estimatedMinutes: 2,
    validationStatus: "APPROVED" as const,
  },
  {
    competencyKey: "os_process_vs_thread",
    questionText:
      "Which of the following is a key advantage of threads over processes for parallelizing a single task?",
    questionType: "MCQ" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "EASY" as const,
    options: [
      { id: "a", text: "Threads provide stronger memory isolation", isCorrect: false },
      { id: "b", text: "Thread creation and context switching are cheaper than process equivalents", isCorrect: true },
      { id: "c", text: "A thread crash cannot affect other threads", isCorrect: false },
      { id: "d", text: "Threads can run on separate machines", isCorrect: false },
    ],
    correctAnswer: "b",
    explanation:
      "Creating a thread is cheaper than a process (no separate address space needed). Thread context switches are faster (shared address space — no TLB flush needed). Threads do share failure risk, and a crash in one thread typically crashes the whole process.",
    estimatedMinutes: 1,
    validationStatus: "APPROVED" as const,
  },

  // ── UNDERSTANDING ────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_vs_thread",
    questionText:
      "A student claims: 'Since threads share memory, communication between threads is always a better choice than processes.' Evaluate this claim — when is it true and when is it wrong?",
    questionType: "EXPLAIN" as const,
    cognitiveLevel: "UNDERSTANDING" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "The claim is partially true but oversimplified. Threads can communicate via shared memory directly and cheaply, without explicit IPC calls — this is fast. However, shared memory between threads requires careful synchronization (mutexes, semaphores) to prevent race conditions, which adds complexity and potential bugs. Processes with IPC (message passing, pipes) are slower to communicate but provide stronger isolation — a bug in one process cannot corrupt another's memory. For tasks that are naturally parallel within one application (e.g., a web server handling multiple requests), threads are appropriate. For tasks that must be isolated for security or reliability (e.g., separate microservices, browser tabs), processes are safer. 'Always better' is never correct in systems — it depends on the trade-off between performance and isolation.",
    explanation:
      "This tests nuanced comparison thinking rather than just recalling facts.",
    rubric: {
      criteria: [
        { name: "Acknowledges the speed advantage of thread communication", weight: 0.2 },
        { name: "Identifies the synchronization requirement and risk", weight: 0.25 },
        { name: "Correctly argues processes are better for isolation", weight: 0.25 },
        { name: "Provides appropriate use cases for each", weight: 0.2 },
        { name: "Rejects the absolute claim appropriately", weight: 0.1 },
      ],
    },
    estimatedMinutes: 6,
    validationStatus: "APPROVED" as const,
  },
  {
    competencyKey: "os_user_kernel_threads",
    questionText:
      "Explain the 'blocking problem' in user-level threads. Why does it occur and what is its consequence?",
    questionType: "EXPLAIN" as const,
    cognitiveLevel: "UNDERSTANDING" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "In user-level threading, the kernel sees only one entity (the process). When a user-level thread makes a blocking system call (e.g., read(), network I/O), the kernel blocks the entire process — not just the calling thread — because the kernel is unaware that other threads exist. This means all other threads in the process are also blocked, even though they are ready to run. This defeats the purpose of threading for I/O-bound workloads. Kernel-level threads solve this because the kernel schedules each thread independently — only the thread making the blocking call is blocked, while others continue.",
    explanation:
      "The blocking problem is the primary practical limitation of user-level thread libraries and the reason most modern systems use kernel threads.",
    rubric: {
      criteria: [
        { name: "Explains that kernel sees only the process, not its user threads", weight: 0.25 },
        { name: "Correctly describes what happens on a blocking syscall", weight: 0.3 },
        { name: "Identifies the consequence (all threads blocked)", weight: 0.25 },
        { name: "Contrasts with kernel thread behavior", weight: 0.2 },
      ],
    },
    estimatedMinutes: 6,
    validationStatus: "APPROVED" as const,
  },

  // ── APPLICATION ──────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_vs_thread",
    questionText:
      "You are designing a web server that handles 10,000 concurrent connections. Each connection reads a request, queries a database, and returns a response. Should you use a multi-process or multi-threaded architecture? Justify your choice with specific reasons.",
    questionType: "SCENARIO" as const,
    cognitiveLevel: "APPLICATION" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "A multi-threaded architecture (or event-loop with a thread pool) is more appropriate for this workload. Reasons: (1) 10,000 processes would be extremely expensive in memory and creation overhead — each process needs its own address space. (2) Threads share the same address space, making them much lighter to create and less memory-intensive. (3) Threads can easily share connection pools, caches, and configuration via shared memory without expensive IPC. (4) The workload is I/O-bound (database queries), which benefits from the thread scheduler keeping the CPU busy while threads wait for I/O. Modern web servers like Nginx use event-driven models (I/O multiplexing) combined with a small thread pool, avoiding the overhead of one-thread-per-connection while still handling many connections.",
    explanation:
      "This is a classic interview scenario. The student should demonstrate ability to apply thread vs. process trade-offs to a realistic system design situation.",
    rubric: {
      criteria: [
        { name: "Chooses threads (or event-loop) and doesn't choose 10,000 processes", weight: 0.2 },
        { name: "Explains memory/creation overhead of processes", weight: 0.25 },
        { name: "Explains shared memory benefit for threads", weight: 0.2 },
        { name: "Addresses I/O-bound nature", weight: 0.2 },
        { name: "Mentions event-driven or thread pool as an advanced point", weight: 0.15 },
      ],
    },
    estimatedMinutes: 8,
    validationStatus: "APPROVED" as const,
  },

  // ── REASONING ────────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_vs_thread",
    questionText:
      "A crash in one thread typically kills the entire process, but a crash in one process does not kill other processes. What fundamental design difference causes this asymmetry, and what does it imply about when you should use processes vs. threads?",
    questionType: "REASONING" as const,
    cognitiveLevel: "REASONING" as const,
    difficulty: "HARD" as const,
    referenceAnswer:
      "The asymmetry comes from address space isolation. Threads share a single address space — if one thread corrupts memory, the corrupt state is immediately visible to all other threads, causing undefined behavior across the process. The OS then terminates the whole process. Processes each have their own isolated virtual address space enforced by the MMU, so corruption in one cannot reach another. This implies: use threads for parallel work within a task that shares state and trusts all its concurrent components. Use processes when components must not trust each other or when a fault in one must not propagate to others (e.g., browser isolating each tab, OS isolating user applications, microservices isolating business domains). The performance cost of process isolation (more expensive creation, IPC overhead) is the price paid for fault isolation — it's a fundamental systems trade-off.",
    explanation:
      "The strongest answers connect the design difference (address space isolation) to architectural decisions, not just memory mechanics.",
    rubric: {
      criteria: [
        { name: "Correctly identifies shared address space as the root cause", weight: 0.25 },
        { name: "Explains memory corruption propagation in threads", weight: 0.2 },
        { name: "Explains MMU-enforced isolation in processes", weight: 0.2 },
        { name: "Derives correct use-case implications", weight: 0.2 },
        { name: "Acknowledges the trade-off (performance vs. isolation)", weight: 0.15 },
      ],
    },
    estimatedMinutes: 8,
    validationStatus: "APPROVED" as const,
  },
];
