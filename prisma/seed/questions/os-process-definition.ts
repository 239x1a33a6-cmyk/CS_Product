// Questions for: What is a Process + Process vs Program
// Covers all cognitive levels

export const OS_PROCESS_DEFINITION_QUESTIONS = [
  // ── RECALL ──────────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_definition",
    questionText:
      "Which of the following best describes a process in an operating system?",
    questionType: "MCQ" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "EASY" as const,
    options: [
      { id: "a", text: "A compiled binary file stored on disk", isCorrect: false },
      { id: "b", text: "A program in execution, including its code, data, and current activity", isCorrect: true },
      { id: "c", text: "A thread that runs inside the operating system kernel", isCorrect: false },
      { id: "d", text: "A file system entry that references an executable", isCorrect: false },
    ],
    correctAnswer: "b",
    explanation:
      "A process is a program in execution — an active entity with code, data, stack, heap, and current state (registers, program counter). The binary on disk is just a program until it is loaded and executing.",
    estimatedMinutes: 1,
    validationStatus: "APPROVED" as const,
  },
  {
    competencyKey: "os_process_vs_program",
    questionText:
      "A developer opens a text editor twice on the same machine. How many programs and how many processes exist?",
    questionType: "MCQ" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "EASY" as const,
    options: [
      { id: "a", text: "Two programs, two processes", isCorrect: false },
      { id: "b", text: "One program, two processes", isCorrect: true },
      { id: "c", text: "Two programs, one process", isCorrect: false },
      { id: "d", text: "One program, one process", isCorrect: false },
    ],
    correctAnswer: "b",
    explanation:
      "There is one program (the text editor executable) but two independent processes — each is a separate running instance with its own address space, state, and resources.",
    estimatedMinutes: 1,
    validationStatus: "APPROVED" as const,
  },

  // ── UNDERSTANDING ────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_vs_program",
    questionText:
      "Explain the difference between a program and a process. Why can the same program result in multiple processes?",
    questionType: "EXPLAIN" as const,
    cognitiveLevel: "UNDERSTANDING" as const,
    difficulty: "EASY" as const,
    referenceAnswer:
      "A program is a static set of instructions stored as a file on disk. A process is the dynamic execution of that program, including its own memory space, CPU state (registers, program counter), open file handles, and other resources. The same program can produce multiple processes because each launch creates an independent instance with its own isolated address space and state — they share the code but are otherwise completely separate.",
    explanation:
      "The key distinction is passive (program) vs. active (process). Multiple instances are possible because the OS creates a new process for each launch, giving each its own isolated execution environment.",
    rubric: {
      criteria: [
        { name: "Defines program correctly", weight: 0.25 },
        { name: "Defines process correctly (includes execution state)", weight: 0.35 },
        { name: "Explains why multiple processes can come from one program", weight: 0.25 },
        { name: "Uses accurate terminology", weight: 0.15 },
      ],
    },
    estimatedMinutes: 4,
    validationStatus: "APPROVED" as const,
  },

  // ── APPLICATION ──────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_definition",
    questionText:
      "You run a Python script `python3 server.py` from two different terminal windows simultaneously. Describe what the operating system creates and what each instance owns independently.",
    questionType: "SCENARIO" as const,
    cognitiveLevel: "APPLICATION" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "The OS creates two separate processes, each with its own: virtual address space (separate stack, heap, BSS, data segments), program counter and CPU registers, process ID (PID), open file descriptors, and process control block (PCB). They both execute the same code (from the shared program file), but their data and state are completely independent. A variable modified in one process does not affect the other.",
    explanation:
      "This tests whether students understand process isolation in a concrete execution scenario.",
    rubric: {
      criteria: [
        { name: "Identifies that two separate processes are created", weight: 0.2 },
        { name: "Correctly describes what each process owns exclusively (address space, state)", weight: 0.4 },
        { name: "Notes they share code but not data/state", weight: 0.25 },
        { name: "Mentions PID or PCB", weight: 0.15 },
      ],
    },
    estimatedMinutes: 5,
    validationStatus: "APPROVED" as const,
  },

  // ── REASONING ────────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_definition",
    questionText:
      "If processes are fully isolated from each other, why does a crash in one process not crash the entire operating system? What does this tell you about how the OS manages process memory?",
    questionType: "REASONING" as const,
    cognitiveLevel: "REASONING" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "Each process runs in its own virtual address space, isolated from the OS kernel and from other processes through hardware-enforced memory protection (MMU). When a process crashes, it may corrupt its own memory space, but the OS kernel — which runs in privileged mode — is protected. The OS simply terminates the faulty process, reclaims its resources, and continues running other processes. This architecture shows that the OS uses virtual memory and privilege levels to enforce isolation — a fundamental design principle for stability and security.",
    explanation:
      "This question probes whether students understand virtual memory, memory protection, and why isolation is a deliberate design choice — not just an accident.",
    rubric: {
      criteria: [
        { name: "Correctly attributes isolation to virtual address spaces", weight: 0.3 },
        { name: "Mentions MMU/hardware enforcement (or memory protection)", weight: 0.25 },
        { name: "Explains kernel privilege separation", weight: 0.25 },
        { name: "Draws a principled conclusion about OS design intent", weight: 0.2 },
      ],
    },
    estimatedMinutes: 6,
    validationStatus: "APPROVED" as const,
  },
];
