import type { ProfileRecord } from "@/lib/ports/profile-repository";
import type { ProgramWithDays } from "@/lib/ports/program-repository";
import type { VolumeTrackingEntry } from "@/lib/ports/volume-tracking-repository";
import type { WorkoutSessionWithExercises } from "@/lib/ports/workout-repository";
import {
  getLandmarksForMuscle,
  checkVolumeStatus,
} from "@/lib/domain/volume";
import { shouldDeload } from "@/lib/domain/deload";
import type { MuscleGroup, ExperienceLevel } from "@/lib/domain/types";
import { ALL_MUSCLE_GROUPS } from "@/lib/domain/constants";
import { PrismaProfileAdapter } from "@/lib/infrastructure/prisma/adapters/user-profile";
import { PrismaProgramAdapter } from "@/lib/infrastructure/prisma/adapters/program";
import { PrismaVolumeTrackingAdapter } from "@/lib/infrastructure/prisma/adapters/volume-tracking";
import { PrismaWorkoutAdapter } from "@/lib/infrastructure/prisma/adapters/workout";

const profileRepo = new PrismaProfileAdapter();
const programRepo = new PrismaProgramAdapter();
const volumeRepo = new PrismaVolumeTrackingAdapter();
const workoutRepo = new PrismaWorkoutAdapter();

/**
 * Gathers all data needed by the coach prompt through existing repository ports.
 */
export async function gatherCoachContextData(
  userId: string,
): Promise<CoachContextData> {
  const [profile, program, currentWeekVolume, lastDeloadWeek, recentSessions] =
    await Promise.all([
      profileRepo.findByUserId(userId),
      programRepo.findActiveByUserId(userId),
      volumeRepo.getCurrentWeekVolume(userId),
      volumeRepo.getLastDeloadWeek(userId),
      workoutRepo.findRecentCompletedSessions(userId, 5),
    ]);

  return {
    profile,
    program,
    currentWeekVolume,
    lastDeloadWeek,
    recentSessions,
  };
}

/**
 * Context bundle consumed by buildCoachSystemPrompt.
 * All fields are POJOs fetched through existing repository ports.
 */
export interface CoachContextData {
  profile: ProfileRecord | null;
  program: ProgramWithDays | null;
  currentWeekVolume: VolumeTrackingEntry[];
  lastDeloadWeek: string | null;
  recentSessions: WorkoutSessionWithExercises[];
}

/**
 * Rough token estimator: ceil(characters / 4).
 * Good enough for enforcing the 2000-token budget in a pure, testable way.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Pure function that assembles the Spanish system prompt.
 *
 * Priority order (highest first):
 * 1. Spanish rules header
 * 2. Profile
 * 3. Deload recommendation
 * 4. Current-week volume
 * 5. Active program
 * 6. Last completed sessions
 *
 * Deterministic degrade order when >2000 tokens:
 * sessions → program → volume. Header, profile, and deload are never trimmed.
 */
export function buildCoachSystemPrompt(data: CoachContextData): string {
  const header = buildHeader();
  const profileSection = buildProfileSection(data.profile);
  const deloadSection = buildDeloadSection(data);

  let volumeSection = buildVolumeSection(data);
  let programSection = buildProgramSection(data.program);
  let sessionsSection = buildSessionsSection(data.recentSessions);

  // ── Deterministic degrade loop ────────────────────────────────────────
  // Degrade sessions first: 5 → 3 → names only → marker
  if (overBudget(header, profileSection, deloadSection, volumeSection, programSection, sessionsSection)) {
    sessionsSection = buildSessionsSection(data.recentSessions.slice(0, 3));
  }
  if (overBudget(header, profileSection, deloadSection, volumeSection, programSection, sessionsSection)) {
    sessionsSection = buildSessionsSectionNamesOnly(data.recentSessions.slice(0, 3));
  }
  if (overBudget(header, profileSection, deloadSection, volumeSection, programSection, sessionsSection)) {
    sessionsSection = OMITTED_MARKER;
  }

  // Degrade program next: drop set detail → marker
  if (overBudget(header, profileSection, deloadSection, volumeSection, programSection, sessionsSection)) {
    programSection = buildProgramSectionNamesOnly(data.program);
  }
  if (overBudget(header, profileSection, deloadSection, volumeSection, programSection, sessionsSection)) {
    programSection = OMITTED_MARKER;
  }

  // Degrade volume last: non-optimal groups only → marker
  if (overBudget(header, profileSection, deloadSection, volumeSection, programSection, sessionsSection)) {
    volumeSection = buildVolumeSection(data, true);
  }
  if (overBudget(header, profileSection, deloadSection, volumeSection, programSection, sessionsSection)) {
    volumeSection = OMITTED_MARKER;
  }

  return [header, profileSection, deloadSection, volumeSection, programSection, sessionsSection]
    .filter((section) => section && section !== "")
    .join("\n\n");
}

const OMITTED_MARKER = "[omitido por límite]";

function overBudget(...sections: string[]): boolean {
  const combined = sections.join("\n\n");
  return estimateTokens(combined) > 2000;
}

function buildHeader(): string {
  return [
    "Eres un entrenador personal virtual de LibreS. Tu único trabajo es responder consultas sobre entrenamiento, nutrición general y recuperación.",
    "REGLAS:",
    "- Respondé SIEMPRE en español.",
    "- Solo consultas: NUNCA modifiques el programa, ejercicios, series, repeticiones, peso o cualquier dato del usuario.",
    "- Si te piden modificar algo, rechazá la solicitud amablemente y sugerí que lo haga desde la app.",
    "- Basá tus respuestas ÚNICAMENTE en los datos del usuario que aparecen abajo. No inventes programas, pesos, ni sesiones.",
    "- No ofrezcas diagnósticos médicos ni reemplaces la consulta con un profesional de la salud.",
    "- Sé conciso (máximo 2-3 párrafos) y orientado a la acción.",
  ].join("\n");
}

function buildProfileSection(profile: ProfileRecord | null): string {
  if (!profile) {
    return "Perfil del usuario: no completado.";
  }

  const parts: string[] = ["Perfil del usuario:"];
  if (profile.age !== null) parts.push(`- Edad: ${profile.age} años`);
  if (profile.experienceLevel) parts.push(`- Nivel: ${profile.experienceLevel}`);
  if (profile.goals) parts.push(`- Objetivos: ${profile.goals}`);
  if (profile.equipment) parts.push(`- Equipamiento: ${profile.equipment}`);
  if (profile.injuries) parts.push(`- Lesiones/restricciones: ${profile.injuries}`);
  if (profile.weight !== null) parts.push(`- Peso: ${profile.weight} kg`);
  if (profile.height !== null) parts.push(`- Altura: ${profile.height} cm`);

  return parts.join("\n");
}

function buildDeloadSection(data: CoachContextData): string {
  const currentWeek = dateToWeekString(new Date());
  let weeksSinceDeload: number | null = null;

  if (data.lastDeloadWeek) {
    weeksSinceDeload = weeksBetween(currentWeek, data.lastDeloadWeek);
  } else if (data.program?.startDate) {
    weeksSinceDeload = weeksBetween(currentWeek, dateToWeekString(data.program.startDate));
  }

  if (weeksSinceDeload === null) {
    return "Descarga: no hay información suficiente para recomendar.";
  }

  const recommend = shouldDeload(weeksSinceDeload);
  return [
    "Recomendación de descarga:",
    `- Semanas desde la última descarga (o inicio del programa): ${weeksSinceDeload}`,
    `- Recomendación: ${recommend ? "sí, considerá una semana de descarga." : "no es necesaria por ahora."}`,
  ].join("\n");
}

function buildVolumeSection(
  data: CoachContextData,
  nonOptimalOnly = false,
): string {
  if (data.currentWeekVolume.length === 0) {
    return "Volumen semanal actual: sin registros.";
  }

  const level = normalizeExperienceLevel(data.profile?.experienceLevel ?? null);
  const lines: string[] = ["Volumen semanal actual:"];

  for (const entry of data.currentWeekVolume) {
    let status: string | null = null;
    if (level && isMuscleGroup(entry.muscleGroup)) {
      const landmark = getLandmarksForMuscle(level, entry.muscleGroup);
      if (landmark) {
        status = checkVolumeStatus(entry.sets, landmark);
      }
    }

    if (nonOptimalOnly && status === "optimal") {
      continue;
    }

    const statusLabel = status ? ` (${status})` : "";
    lines.push(`- ${entry.muscleGroup}: ${entry.sets} series${statusLabel}`);
  }

  if (nonOptimalOnly && lines.length === 1) {
    return "Volumen semanal actual: todos los grupos están en rango óptimo.";
  }

  return lines.join("\n");
}

function buildProgramSection(program: ProgramWithDays | null): string {
  if (!program) {
    return "Programa activo: no tiene un programa activo. Ofrecé ayuda para generar uno.";
  }

  const lines: string[] = [`Programa activo: ${program.name}`];

  for (const day of program.days) {
    const dayHeader = day.name
      ? `Día ${day.dayNumber} - ${day.name}`
      : `Día ${day.dayNumber}`;
    lines.push(dayHeader);

    for (const ex of day.exercises) {
      const name = ex.exercise.nameEs || ex.exercise.name;
      const prescription = formatPrescription(ex.sets, ex.reps, ex.weight, ex.rpe);
      const muscle = ex.exercise.muscleGroup?.nameEs || ex.exercise.muscleGroup?.name || "";
      const muscleLabel = muscle ? ` (${muscle})` : "";
      lines.push(`  - ${name}${muscleLabel}: ${prescription}`);
    }
  }

  return lines.join("\n");
}

function buildProgramSectionNamesOnly(program: ProgramWithDays | null): string {
  if (!program) {
    return "Programa activo: no tiene un programa activo. Ofrecé ayuda para generar uno.";
  }

  const lines: string[] = [`Programa activo: ${program.name}`];

  for (const day of program.days) {
    const dayHeader = day.name
      ? `Día ${day.dayNumber} - ${day.name}`
      : `Día ${day.dayNumber}`;
    lines.push(dayHeader);
    const names = day.exercises
      .map((ex) => ex.exercise.nameEs || ex.exercise.name)
      .join(", ");
    lines.push(`  - Ejercicios: ${names || "ninguno"}`);
  }

  return lines.join("\n");
}

function buildSessionsSection(sessions: WorkoutSessionWithExercises[]): string {
  if (sessions.length === 0) {
    return "Últimas sesiones completadas: ninguna.";
  }

  const lines: string[] = ["Últimas sesiones completadas:"];

  for (const session of sessions) {
    const date = session.completedAt
      ? new Date(session.completedAt).toLocaleDateString("es-AR")
      : "sin fecha";
    const dayName = session.day?.name || `Día ${session.day?.dayNumber ?? "?"}`;
    lines.push(`- ${date} · ${dayName}`);

    const exercises = session.day?.exercises ?? [];
    for (const ex of exercises) {
      const name = ex.exercise.nameEs || ex.exercise.name;
      const completedSets = ex.workoutSets.filter((s) => s.completed).length;
      const setDetails = ex.workoutSets
        .filter((s) => s.completed)
        .map((s) => `${s.reps ?? "?"}@${s.weight ?? "?"}kg`)
        .join(", ");
      lines.push(`  · ${name}: ${completedSets} series completadas${setDetails ? ` (${setDetails})` : ""}`);
    }
  }

  return lines.join("\n");
}

function buildSessionsSectionNamesOnly(
  sessions: WorkoutSessionWithExercises[],
): string {
  if (sessions.length === 0) {
    return "Últimas sesiones completadas: ninguna.";
  }

  const lines: string[] = ["Últimas sesiones completadas:"];

  for (const session of sessions) {
    const date = session.completedAt
      ? new Date(session.completedAt).toLocaleDateString("es-AR")
      : "sin fecha";
    const dayName = session.day?.name || `Día ${session.day?.dayNumber ?? "?"}`;
    const names = (session.day?.exercises ?? [])
      .map((ex) => ex.exercise.nameEs || ex.exercise.name)
      .join(", ");
    lines.push(`- ${date} · ${dayName}: ${names || "ningún ejercicio"}`);
  }

  return lines.join("\n");
}

function formatPrescription(
  sets: number | null,
  reps: number | null,
  weight: number | null,
  rpe: number | null,
): string {
  const parts: string[] = [];
  if (sets !== null && reps !== null) {
    parts.push(`${sets}x${reps}`);
  } else if (sets !== null) {
    parts.push(`${sets} series`);
  }
  if (weight !== null) parts.push(`@${weight}kg`);
  if (rpe !== null) parts.push(`RPE ${rpe}`);
  return parts.join(" ") || "sin prescripción";
}

function normalizeExperienceLevel(
  value: string | null,
): ExperienceLevel | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "beginner" || lower === "principiante") return "beginner";
  if (lower === "intermediate" || lower === "intermedio") return "intermediate";
  if (lower === "advanced" || lower === "avanzado") return "advanced";
  return null;
}

function isMuscleGroup(value: string): value is MuscleGroup {
  return (ALL_MUSCLE_GROUPS as string[]).includes(value);
}

function dateToWeekString(date: Date): string {
  const d = new Date(date);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function weeksBetween(a: string, b: string): number {
  const parse = (w: string) => {
    const [yearStr, weekStr] = w.split("-W");
    return {
      year: parseInt(yearStr, 10),
      week: parseInt(weekStr, 10),
    };
  };
  const pa = parse(a);
  const pb = parse(b);
  return Math.abs((pa.year * 52 + pa.week) - (pb.year * 52 + pb.week));
}
