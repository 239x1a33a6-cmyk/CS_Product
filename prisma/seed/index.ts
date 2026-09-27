import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { OS_PROCESSES_THREADS_COMPETENCIES } from "./competencies/os-processes-threads";
import { OS_PROCESS_DEFINITION_QUESTIONS } from "./questions/os-process-definition";
import { OS_PROCESS_STATES_QUESTIONS } from "./questions/os-process-states";
import { OS_THREADS_QUESTIONS } from "./questions/os-threads";
import { OS_CONCURRENCY_QUESTIONS } from "./questions/os-concurrency";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CS Placement Platform...");

  // ─── Users ─────────────────────────────────────────────────────────────
  console.log("  Creating users...");
  const adminPassword = await bcrypt.hash("admin1234", 12);
  const mentorPassword = await bcrypt.hash("mentor1234", 12);
  const studentPassword = await bcrypt.hash("student1234", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@csplatform.dev" },
    update: {},
    create: {
      email: "admin@csplatform.dev",
      name: "Platform Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const mentor1 = await db.user.upsert({
    where: { email: "mentor1@csplatform.dev" },
    update: {},
    create: {
      email: "mentor1@csplatform.dev",
      name: "Priya Venkataraman",
      passwordHash: mentorPassword,
      role: "MENTOR",
      mentorProfile: { create: {} },
    },
  });

  const student1 = await db.user.upsert({
    where: { email: "student1@csplatform.dev" },
    update: {},
    create: {
      email: "student1@csplatform.dev",
      name: "Arjun Sharma",
      passwordHash: studentPassword,
      role: "STUDENT",
    },
  });

  const student2 = await db.user.upsert({
    where: { email: "student2@csplatform.dev" },
    update: {},
    create: {
      email: "student2@csplatform.dev",
      name: "Meera Krishnan",
      passwordHash: studentPassword,
      role: "STUDENT",
    },
  });

  // ─── Mentor Profiles ───────────────────────────────────────────────────
  const mentorProfile = await db.mentorProfile.upsert({
    where: { userId: mentor1.id },
    update: {},
    create: { userId: mentor1.id },
  });

  // ─── Cohort ────────────────────────────────────────────────────────────
  console.log("  Creating cohort...");
  const cohort = await db.cohort.upsert({
    where: { id: "cohort-btech-2025" },
    update: {},
    create: {
      id: "cohort-btech-2025",
      name: "B.Tech CS 2025 Placement Batch",
      description: "Final year CS students preparing for placements",
      mentorId: mentorProfile.id,
    },
  });

  // ─── Student Profiles ─────────────────────────────────────────────────
  await db.studentProfile.upsert({
    where: { userId: student1.id },
    update: {},
    create: { userId: student1.id, cohortId: cohort.id },
  });
  await db.studentProfile.upsert({
    where: { userId: student2.id },
    update: {},
    create: { userId: student2.id, cohortId: cohort.id },
  });

  // ─── Competency Nodes ─────────────────────────────────────────────────
  console.log("  Creating OS → Processes & Threads competency tree...");
  const competencyMap: Record<string, string> = {};

  for (const comp of OS_PROCESSES_THREADS_COMPETENCIES) {
    const { key, prerequisiteKeys, ...data } = comp as typeof comp & {
      key: string;
      prerequisiteKeys?: string[];
    };

    const node = await db.competencyNode.upsert({
      where: { id: `comp-${key}` },
      update: {},
      create: {
        id: `comp-${key}`,
        subject: data.subject,
        domain: data.domain,
        skill: data.skill,
        subSkill: data.subSkill,
        title: data.title,
        description: data.description,
        learningObjective: data.learningObjective,
        difficulty: data.difficulty,
        misconceptions: data.misconceptions,
        tags: data.tags,
        sortOrder: data.sortOrder,
      },
    });
    competencyMap[key] = node.id;
  }

  // Wire prerequisites (second pass after all nodes exist)
  for (const comp of OS_PROCESSES_THREADS_COMPETENCIES) {
    const { key, prerequisiteKeys } = comp as typeof comp & {
      key: string;
      prerequisiteKeys?: string[];
    };
    if (!prerequisiteKeys?.length) continue;

    await db.competencyNode.update({
      where: { id: competencyMap[key] },
      data: {
        prerequisites: {
          connect: prerequisiteKeys.map((pk) => ({ id: competencyMap[pk] })),
        },
      },
    });
  }

  // ─── Questions ────────────────────────────────────────────────────────
  console.log("  Creating questions...");

  const allQuestions = [
    ...OS_PROCESS_DEFINITION_QUESTIONS,
    ...OS_PROCESS_STATES_QUESTIONS,
    ...OS_THREADS_QUESTIONS,
    ...OS_CONCURRENCY_QUESTIONS,
  ];

  for (const q of allQuestions) {
    const { competencyKey, options, ...data } = q as typeof q & {
      competencyKey: string;
      options?: unknown[];
    };

    const competencyNodeId = competencyMap[competencyKey];
    if (!competencyNodeId) {
      console.warn(`  ⚠ No competency found for key: ${competencyKey}`);
      continue;
    }

    await db.question.create({
      data: {
        competencyNodeId,
        questionText: data.questionText,
        questionType: data.questionType,
        cognitiveLevel: data.cognitiveLevel,
        difficulty: data.difficulty,
        options: options ?? undefined,
        correctAnswer:
          "correctAnswer" in data ? (data.correctAnswer as string) : undefined,
        referenceAnswer:
          "referenceAnswer" in data
            ? (data.referenceAnswer as string)
            : undefined,
        explanation: data.explanation,
        misconceptionTargeted:
          "misconceptionTargeted" in data
            ? (data.misconceptionTargeted as string)
            : undefined,
        rubric: "rubric" in data ? (data.rubric as object) : undefined,
        validationStatus: data.validationStatus,
        authorType: "HUMAN",
        estimatedMinutes: data.estimatedMinutes,
      },
    });
  }

  console.log(`✅ Seeded:`);
  console.log(`   ${Object.keys(competencyMap).length} competency nodes`);
  console.log(`   ${allQuestions.length} questions`);
  console.log(`   2 students, 1 mentor, 1 cohort`);
  console.log(`\n🔑 Dev credentials:`);
  console.log(`   Admin:   admin@csplatform.dev / admin1234`);
  console.log(`   Mentor:  mentor1@csplatform.dev / mentor1234`);
  console.log(`   Student: student1@csplatform.dev / student1234`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
