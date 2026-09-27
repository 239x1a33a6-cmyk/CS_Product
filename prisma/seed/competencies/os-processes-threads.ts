// OS → Processes & Threads competency tree
// Each node represents a discrete, assessable competency

export const OS_PROCESSES_THREADS_COMPETENCIES = [
  // ─── PROCESS FUNDAMENTALS ───────────────────────────────────────────────
  {
    key: "os_process_definition",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Process Fundamentals",
    subSkill: "Process Definition",
    title: "What is a Process",
    description:
      "A process is a program in execution — an active entity comprising the program code, its current activity (program counter, registers), stack, heap, and data segment. It is distinct from a program, which is a passive file on disk.",
    learningObjective:
      "Student can accurately define a process, distinguish it from a program, and describe what constitutes a process in memory.",
    difficulty: "FOUNDATIONAL" as const,
    misconceptions: [
      "A process and a program are the same thing",
      "A process is just the executable binary on disk",
      "Multiple processes cannot run the same program simultaneously",
    ],
    tags: ["os", "process", "definition", "memory"],
    sortOrder: 10,
  },
  {
    key: "os_process_vs_program",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Process Fundamentals",
    subSkill: "Process vs Program",
    title: "Process vs Program",
    description:
      "A program is a static set of instructions stored in a file. A process is the dynamic instance of that program in execution, with its own memory space, state, and resources. Multiple processes can run the same program independently.",
    learningObjective:
      "Student can clearly articulate the difference between a program and a process, with concrete examples.",
    difficulty: "FOUNDATIONAL" as const,
    misconceptions: [
      "Opening a program twice creates two programs",
      "Two processes running the same program share memory",
      "A program becomes a process only when it finishes compiling",
    ],
    tags: ["os", "process", "program", "distinction"],
    sortOrder: 20,
    prerequisiteKeys: ["os_process_definition"],
  },
  {
    key: "os_process_memory_layout",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Process Fundamentals",
    subSkill: "Process Memory Layout",
    title: "Process Memory Layout",
    description:
      "A process's virtual address space is divided into segments: text (code), data (global/static variables), BSS (uninitialized data), heap (dynamic allocation, grows upward), and stack (function calls and local variables, grows downward). The OS manages these regions through virtual memory.",
    learningObjective:
      "Student can describe the segments of a process's memory layout, explain what each holds, and explain the direction of heap and stack growth.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "The stack and heap are the same region",
      "The heap grows downward",
      "Global variables are stored on the stack",
      "The code segment is writable",
    ],
    tags: ["os", "process", "memory", "stack", "heap", "virtual memory"],
    sortOrder: 30,
    prerequisiteKeys: ["os_process_definition"],
  },
  {
    key: "os_process_states",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Process Fundamentals",
    subSkill: "Process States & Lifecycle",
    title: "Process States and Lifecycle",
    description:
      "A process moves through states: New (being created), Ready (waiting for CPU), Running (executing on CPU), Waiting/Blocked (waiting for I/O or event), and Terminated (finished). The OS scheduler transitions processes between these states based on events like I/O completion, timer interrupts, and resource availability.",
    learningObjective:
      "Student can enumerate process states, explain the transitions between them with triggers, and trace a process's lifecycle from creation to termination.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "A process goes directly from New to Running",
      "A Blocked process is the same as a Ready process",
      "A process in Running state cannot go to Ready",
      "Waiting and Blocked mean the process is doing nothing forever",
    ],
    tags: ["os", "process", "states", "lifecycle", "scheduler"],
    sortOrder: 40,
    prerequisiteKeys: ["os_process_definition"],
  },
  {
    key: "os_pcb",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Process Fundamentals",
    subSkill: "Process Control Block",
    title: "Process Control Block (PCB)",
    description:
      "The PCB is the OS's data structure representing a process. It stores the process state, program counter, CPU registers, memory management info (page tables, segment tables), I/O status, accounting information, and scheduling priority. The OS uses the PCB to save and restore process context during context switches.",
    learningObjective:
      "Student can describe what information the PCB contains and explain why the PCB is necessary for context switching and process management.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "The PCB is stored inside the process's own memory",
      "Every context switch requires copying the entire process memory",
      "The PCB is only needed for blocked processes",
    ],
    tags: ["os", "pcb", "context switch", "process management"],
    sortOrder: 50,
    prerequisiteKeys: ["os_process_states"],
  },
  {
    key: "os_context_switch",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Process Fundamentals",
    subSkill: "Context Switching",
    title: "Context Switching",
    description:
      "A context switch is the OS mechanism to switch the CPU from one process to another. The OS saves the current process's state (registers, PC, memory maps) into its PCB, selects the next process, loads its PCB, and resumes execution. Context switches have overhead — time spent switching is not spent doing useful work.",
    learningObjective:
      "Student can describe the steps of a context switch, identify what is saved/restored, and explain the performance cost of frequent context switches.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "Context switching is free / has no overhead",
      "The process resumes from the beginning after a context switch",
      "Context switch and process termination are the same",
      "Only one context switch can happen per second",
    ],
    tags: ["os", "context switch", "pcb", "performance", "scheduler"],
    sortOrder: 60,
    prerequisiteKeys: ["os_pcb"],
  },

  // ─── THREADS ─────────────────────────────────────────────────────────────
  {
    key: "os_thread_definition",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Threads",
    subSkill: "Thread Definition",
    title: "What is a Thread",
    description:
      "A thread is the smallest unit of execution within a process. Also called a lightweight process, a thread has its own program counter, register set, and stack, but shares the process's code, data, heap, and OS resources with other threads in the same process.",
    learningObjective:
      "Student can define a thread, identify what it owns exclusively versus what it shares with sibling threads, and explain why threads are called lightweight processes.",
    difficulty: "FOUNDATIONAL" as const,
    misconceptions: [
      "Threads have their own separate heap",
      "Threads are completely independent of their process",
      "A single-threaded process has no threads",
      "Threads cannot share global variables",
    ],
    tags: ["os", "thread", "definition", "lightweight process"],
    sortOrder: 70,
    prerequisiteKeys: ["os_process_definition"],
  },
  {
    key: "os_process_vs_thread",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Threads",
    subSkill: "Process vs Thread",
    title: "Process vs Thread — Key Differences",
    description:
      "Processes are independent, with separate address spaces and OS resources. Threads within a process share address space, file descriptors, and resources. Creating a thread is faster than creating a process. Communication between threads (via shared memory) is easier but more dangerous than IPC between processes. Threads are suitable for parallelism within a task; processes for isolation between tasks.",
    learningObjective:
      "Student can compare processes and threads across dimensions: memory isolation, creation cost, communication overhead, failure isolation, and appropriate use cases.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "Threads are always faster than processes for everything",
      "Processes can share memory as easily as threads",
      "Thread crashes are isolated like process crashes",
      "Creating a thread has the same overhead as creating a process",
    ],
    tags: ["os", "process", "thread", "comparison", "concurrency"],
    sortOrder: 80,
    prerequisiteKeys: ["os_process_definition", "os_thread_definition"],
  },
  {
    key: "os_user_kernel_threads",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Threads",
    subSkill: "User vs Kernel Threads",
    title: "User-Level vs Kernel-Level Threads",
    description:
      "User-level threads are managed by a user-space library; the kernel sees only one process. They are fast to create/switch but if one blocks on a syscall, all threads in the process block. Kernel-level threads are managed by the OS; each is scheduled independently, supports true parallelism on multi-core, but has higher creation/switch overhead. Hybrid models (M:N) map M user threads onto N kernel threads.",
    learningObjective:
      "Student can distinguish user-level and kernel-level threads, explain the blocking problem in user-level threads, and describe when each model is appropriate.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "User-level threads run in kernel mode",
      "Kernel threads are always slower due to kernel involvement",
      "User-level threads support true parallelism on multi-core",
      "Modern OSes use only one threading model",
    ],
    tags: ["os", "threads", "user-level", "kernel-level", "concurrency"],
    sortOrder: 90,
    prerequisiteKeys: ["os_thread_definition", "os_process_vs_thread"],
  },

  // ─── SCHEDULING ──────────────────────────────────────────────────────────
  {
    key: "os_scheduling_concepts",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "CPU Scheduling",
    subSkill: "Scheduling Concepts",
    title: "CPU Scheduling Concepts",
    description:
      "CPU scheduling decides which process in the Ready queue runs next. Criteria include CPU utilization, throughput, turnaround time, waiting time, and response time. Scheduling can be preemptive (OS can forcibly remove a running process) or non-preemptive (process runs until it voluntarily yields). The scheduler uses metrics and policy to optimize system performance.",
    learningObjective:
      "Student can define CPU scheduling, list the key performance metrics, distinguish preemptive from non-preemptive scheduling, and identify the trade-offs involved.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "CPU scheduling only matters for single-core systems",
      "The goal is always to minimize CPU utilization",
      "Preemptive scheduling always produces better results",
      "Turnaround time and response time mean the same thing",
    ],
    tags: ["os", "scheduling", "cpu", "preemptive", "metrics"],
    sortOrder: 100,
    prerequisiteKeys: ["os_process_states"],
  },
  {
    key: "os_scheduling_algorithms",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "CPU Scheduling",
    subSkill: "Scheduling Algorithms",
    title: "Scheduling Algorithms",
    description:
      "Key algorithms: FCFS (First Come First Served) — simple but causes convoy effect. SJF (Shortest Job First) — optimal average waiting time but requires future burst-time knowledge. Round Robin — preemptive, time-quantum based, good for interactive systems. Priority Scheduling — can cause starvation (fixed by aging). Multilevel Queue — separate queues by process type.",
    learningObjective:
      "Student can explain each algorithm, calculate turnaround/waiting times for given scenarios, identify failure modes (convoy effect, starvation), and argue which algorithm suits which workload.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "SJF is always the best algorithm in practice",
      "Round Robin eliminates all fairness problems",
      "FCFS is preemptive",
      "Priority scheduling cannot lead to starvation with proper implementation",
    ],
    tags: ["os", "scheduling", "fcfs", "sjf", "round-robin", "priority"],
    sortOrder: 110,
    prerequisiteKeys: ["os_scheduling_concepts"],
  },

  // ─── CONCURRENCY PROBLEMS ─────────────────────────────────────────────────
  {
    key: "os_race_condition",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Concurrency & Synchronization",
    subSkill: "Race Conditions",
    title: "Race Conditions",
    description:
      "A race condition occurs when the correctness of a computation depends on the relative timing or interleaving of concurrent operations. When two threads read-modify-write a shared variable without synchronization, the final result is non-deterministic. Example: two threads both read a counter (value 5), both increment, both write 6 — instead of the correct 7.",
    learningObjective:
      "Student can define a race condition, produce a concrete example with thread interleaving, explain why the result is non-deterministic, and identify what condition must be prevented.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "Race conditions only happen with bugs, not with correct code",
      "A race condition will always produce the same wrong result",
      "Race conditions are always visible as crashes",
      "Single-threaded programs can have race conditions",
    ],
    tags: ["os", "concurrency", "race condition", "threads", "synchronization"],
    sortOrder: 120,
    prerequisiteKeys: ["os_thread_definition"],
  },
  {
    key: "os_critical_section",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Concurrency & Synchronization",
    subSkill: "Critical Section Problem",
    title: "Critical Section Problem",
    description:
      "The critical section is a segment of code accessing shared resources. A correct solution must satisfy: Mutual Exclusion (at most one process in CS at a time), Progress (if no process is in CS and some want entry, selection cannot be postponed indefinitely), Bounded Waiting (a process waiting must eventually enter). Solutions include software (Peterson's algorithm), hardware (atomic instructions), and OS-level (mutex, semaphore) mechanisms.",
    learningObjective:
      "Student can define the critical section problem, state the three requirements (mutual exclusion, progress, bounded waiting), and explain how each requirement prevents a specific failure.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "Mutual exclusion alone is sufficient for a correct solution",
      "Bounded waiting and progress mean the same thing",
      "Critical sections must be as large as possible for safety",
      "Hardware solutions are always slower than software solutions",
    ],
    tags: ["os", "critical section", "mutual exclusion", "synchronization"],
    sortOrder: 130,
    prerequisiteKeys: ["os_race_condition"],
  },
  {
    key: "os_mutex_semaphore",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Concurrency & Synchronization",
    subSkill: "Mutex and Semaphores",
    title: "Mutex and Semaphores",
    description:
      "A mutex (mutual exclusion lock) allows only one thread to hold it at a time; others block. It has ownership — only the acquiring thread can release it. A semaphore is a generalized counter (binary semaphore ≈ mutex; counting semaphore manages N resources). Semaphores support signaling between threads. Key operations: wait() (P) decrements, signal() (V) increments. Incorrect use causes deadlock or starvation.",
    learningObjective:
      "Student can distinguish mutex from semaphore, explain wait/signal operations, show how each solves mutual exclusion, and identify when to use each.",
    difficulty: "INTERMEDIATE" as const,
    misconceptions: [
      "A binary semaphore and a mutex are identical in all ways",
      "Any thread can release a mutex",
      "Semaphores eliminate all race conditions automatically",
      "Using semaphores is always better than using mutexes",
    ],
    tags: ["os", "mutex", "semaphore", "synchronization", "concurrency"],
    sortOrder: 140,
    prerequisiteKeys: ["os_critical_section"],
  },
  {
    key: "os_deadlock",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Concurrency & Synchronization",
    subSkill: "Deadlock",
    title: "Deadlock",
    description:
      "Deadlock occurs when a set of processes are each waiting for a resource held by another process in the set — forming a circular wait. Four necessary conditions (Coffman): Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. All four must hold simultaneously for deadlock. Prevention eliminates one condition; Avoidance uses the Banker's algorithm; Detection allows deadlock then recovers.",
    learningObjective:
      "Student can define deadlock, state the four Coffman conditions, construct a resource allocation graph showing deadlock, and compare prevention, avoidance, and detection strategies.",
    difficulty: "ADVANCED" as const,
    misconceptions: [
      "Deadlock requires all four Coffman conditions independently",
      "Livelock is the same as deadlock",
      "Deadlock only happens with two processes",
      "Prevention is always better than detection",
    ],
    tags: ["os", "deadlock", "coffman", "circular wait", "synchronization"],
    sortOrder: 150,
    prerequisiteKeys: ["os_mutex_semaphore"],
  },

  // ─── IPC ─────────────────────────────────────────────────────────────────
  {
    key: "os_ipc",
    subject: "OPERATING_SYSTEMS" as const,
    domain: "Processes & Threads",
    skill: "Inter-Process Communication",
    subSkill: "IPC Mechanisms",
    title: "Inter-Process Communication (IPC)",
    description:
      "IPC allows processes to exchange data and synchronize. Mechanisms: Shared Memory (fast, requires synchronization), Message Passing (explicit send/receive, safer, works across machines), Pipes (unidirectional byte stream between related processes), Named Pipes/FIFOs (between unrelated processes), Sockets (network-capable IPC), Signals (asynchronous notifications). Trade-offs involve speed, complexity, and isolation.",
    learningObjective:
      "Student can name and describe the major IPC mechanisms, compare shared memory vs. message passing, and select the appropriate mechanism for a given scenario.",
    difficulty: "ADVANCED" as const,
    misconceptions: [
      "Shared memory IPC needs no synchronization",
      "Message passing is always slower than shared memory",
      "Threads need IPC to communicate",
      "Sockets can only be used over a network",
    ],
    tags: ["os", "ipc", "shared memory", "message passing", "pipes", "sockets"],
    sortOrder: 160,
    prerequisiteKeys: ["os_process_vs_thread", "os_mutex_semaphore"],
  },
];
