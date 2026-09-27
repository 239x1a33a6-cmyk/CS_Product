// Questions for: Process States & PCB & Context Switching

export const OS_PROCESS_STATES_QUESTIONS = [
  // ── RECALL ──────────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_states",
    questionText:
      "Which of the following is NOT a standard process state in a typical OS?",
    questionType: "MCQ" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "EASY" as const,
    options: [
      { id: "a", text: "Ready", isCorrect: false },
      { id: "b", text: "Running", isCorrect: false },
      { id: "c", text: "Compiling", isCorrect: true },
      { id: "d", text: "Blocked (Waiting)", isCorrect: false },
    ],
    correctAnswer: "c",
    explanation:
      "The standard process states are: New, Ready, Running, Waiting/Blocked, and Terminated. 'Compiling' is not a process state — compilation happens before execution.",
    estimatedMinutes: 1,
    validationStatus: "APPROVED" as const,
  },
  {
    competencyKey: "os_process_states",
    questionText:
      "What event typically triggers the transition from Running to Blocked (Waiting) state?",
    questionType: "MCQ" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "EASY" as const,
    options: [
      { id: "a", text: "A higher-priority process becomes Ready", isCorrect: false },
      { id: "b", text: "The process requests an I/O operation", isCorrect: true },
      { id: "c", text: "The process is newly created", isCorrect: false },
      { id: "d", text: "A timer interrupt fires", isCorrect: false },
    ],
    correctAnswer: "b",
    explanation:
      "A process transitions to Blocked/Waiting when it requests an I/O operation (or another event) that cannot complete immediately. It remains blocked until the event completes, then moves to Ready.",
    estimatedMinutes: 1,
    validationStatus: "APPROVED" as const,
  },
  {
    competencyKey: "os_pcb",
    questionText:
      "Which of the following information is stored in the Process Control Block (PCB)?",
    questionType: "MULTI_SELECT" as const,
    cognitiveLevel: "RECALL" as const,
    difficulty: "MEDIUM" as const,
    options: [
      { id: "a", text: "Program counter", isCorrect: true },
      { id: "b", text: "The actual file contents of the program", isCorrect: false },
      { id: "c", text: "CPU register values", isCorrect: true },
      { id: "d", text: "Memory management information (page tables)", isCorrect: true },
      { id: "e", text: "Process state", isCorrect: true },
    ],
    correctAnswer: "a,c,d,e",
    explanation:
      "The PCB stores process state, program counter, CPU registers, memory management info, I/O status, and scheduling info. It does NOT store the actual program file contents — those live in the process's address space or on disk.",
    estimatedMinutes: 2,
    validationStatus: "APPROVED" as const,
  },

  // ── UNDERSTANDING ────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_states",
    questionText:
      "A student says: 'If a process is in the Ready state, it means the process is idle and not doing anything.' Is this correct? Explain why or why not.",
    questionType: "EXPLAIN" as const,
    cognitiveLevel: "UNDERSTANDING" as const,
    difficulty: "EASY" as const,
    referenceAnswer:
      "This is incorrect. A Ready process is fully prepared to execute — it has all the resources it needs except the CPU. It is waiting only for the scheduler to assign it CPU time. 'Idle' implies it has nothing to do; Ready implies it has work to do but is waiting its turn. This is distinct from the Blocked state, where the process is genuinely waiting for an external event (like I/O) before it can proceed.",
    explanation:
      "Confusing Ready with Blocked is a common misconception. Ready = wants CPU. Blocked = waiting for something other than CPU.",
    rubric: {
      criteria: [
        { name: "Correctly identifies the statement as false", weight: 0.15 },
        { name: "Accurately defines Ready state", weight: 0.35 },
        { name: "Contrasts Ready with Blocked correctly", weight: 0.35 },
        { name: "Clear and precise language", weight: 0.15 },
      ],
    },
    estimatedMinutes: 4,
    validationStatus: "APPROVED" as const,
  },
  {
    competencyKey: "os_context_switch",
    questionText:
      "Explain what happens step-by-step during a context switch between Process A and Process B.",
    questionType: "EXPLAIN" as const,
    cognitiveLevel: "UNDERSTANDING" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "1. An interrupt or syscall triggers the switch. 2. The OS saves Process A's current state (program counter, registers, memory management info) into A's PCB. 3. The scheduler selects Process B as the next process to run. 4. The OS loads B's saved state from B's PCB into the CPU registers. 5. The program counter is set to where B was last executing. 6. Execution resumes in Process B from where it left off. During the switch, neither process makes progress — this is the overhead cost of context switching.",
    explanation:
      "Students often skip the save/restore steps or don't mention the PCB. The overhead aspect is critical for understanding why excessive context switches are a performance problem.",
    rubric: {
      criteria: [
        { name: "Describes saving A's state to its PCB", weight: 0.25 },
        { name: "Describes scheduler selection", weight: 0.15 },
        { name: "Describes loading B's state from its PCB", weight: 0.25 },
        { name: "Mentions that B resumes where it left off", weight: 0.2 },
        { name: "Acknowledges overhead / no useful work during switch", weight: 0.15 },
      ],
    },
    estimatedMinutes: 6,
    validationStatus: "APPROVED" as const,
  },

  // ── APPLICATION ──────────────────────────────────────────────────────────
  {
    competencyKey: "os_process_states",
    questionText:
      "Trace the state transitions for this scenario: A process is created, waits for CPU time, starts running, requests disk I/O, waits for the I/O to finish, runs briefly, then exits. List each state and the event that caused the transition.",
    questionType: "SCENARIO" as const,
    cognitiveLevel: "APPLICATION" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "New → (admitted to OS) → Ready → (scheduler dispatches) → Running → (requests disk I/O) → Blocked → (I/O completes) → Ready → (scheduler dispatches) → Running → (process exits) → Terminated. Six distinct states visited, five transitions.",
    explanation:
      "This tests whether students can apply the state model to a concrete process lifecycle, including the Ready→Blocked→Ready cycle.",
    rubric: {
      criteria: [
        { name: "Correct sequence of states (New, Ready, Running, Blocked, Ready, Running, Terminated)", weight: 0.5 },
        { name: "Correct transition triggers identified for each step", weight: 0.35 },
        { name: "Notes the process returns to Ready (not Running) after I/O", weight: 0.15 },
      ],
    },
    estimatedMinutes: 6,
    validationStatus: "APPROVED" as const,
  },

  // ── REASONING ────────────────────────────────────────────────────────────
  {
    competencyKey: "os_context_switch",
    questionText:
      "System A performs a context switch every 1ms (time quantum). System B performs a context switch every 100ms. What are the trade-offs? When would you prefer each?",
    questionType: "REASONING" as const,
    cognitiveLevel: "REASONING" as const,
    difficulty: "MEDIUM" as const,
    referenceAnswer:
      "System A (1ms): Better responsiveness and fairness — interactive processes get CPU quickly. However, the frequent context switches (every 1ms) impose high overhead — if a switch takes, say, 0.1ms, that's 10% of CPU time wasted on switching. Suitable for interactive, latency-sensitive workloads. System B (100ms): Much lower overhead from context switching. But processes may feel sluggish or unresponsive if a CPU-bound process holds the CPU for 100ms before others get a turn. Suitable for batch/compute-heavy workloads where throughput matters more than responsiveness. The optimal quantum is a function of the switch overhead and the target workload — small enough for responsiveness, large enough so overhead is negligible.",
    explanation:
      "This tests whether students can reason about the time quantum trade-off — a fundamental systems design consideration.",
    rubric: {
      criteria: [
        { name: "Identifies responsiveness advantage of small quantum", weight: 0.2 },
        { name: "Identifies overhead cost of frequent switches", weight: 0.25 },
        { name: "Identifies throughput advantage of large quantum", weight: 0.2 },
        { name: "Correctly identifies appropriate workloads for each", weight: 0.2 },
        { name: "Notes the trade-off is tunable / workload-dependent", weight: 0.15 },
      ],
    },
    estimatedMinutes: 7,
    validationStatus: "APPROVED" as const,
  },
];
