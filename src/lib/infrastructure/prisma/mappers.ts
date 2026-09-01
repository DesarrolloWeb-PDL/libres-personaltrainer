import type { Exercise as DomainExercise, Equipment } from "@/lib/domain/types";

/**
 * Maps DB equipment name to domain Equipment type.
 */
export function mapEquipment(name: string): Equipment {
  const map: Record<string, Equipment> = {
    Barbell: "full_gym",
    Dumbbell: "full_gym",
    Cable: "full_gym",
    Machine: "full_gym",
    "Pull-up Bar": "full_gym",
    Bodyweight: "bodyweight_only",
    Resistance: "home_gym",
  };
  return map[name] ?? "full_gym";
}

/**
 * Maps DB exercise to domain Exercise type for the training engine.
 */
export function toDomainExercise(
  ex: { id: string; name: string; muscleGroup: { category: string | null } | null; equipment: { name: string } | null },
  isCompound: boolean = true,
): DomainExercise {
  const mgCategory = ex.muscleGroup?.category ?? "chest";
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: mgCategory as DomainExercise["muscleGroup"],
    equipment: ex.equipment ? [mapEquipment(ex.equipment.name)] : ["full_gym"],
    isCompound,
  };
}
