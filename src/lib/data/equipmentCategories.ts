import type { EquipmentCategory } from "@/lib/types";

export const EQUIPMENT_CATEGORIES: {
  value: EquipmentCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "laptops", label: "Laptops", emoji: "💻" },
  { value: "calculators", label: "Calculators", emoji: "🧮" },
  { value: "lab_equipment", label: "Lab equipment", emoji: "🔬" },
  { value: "project_hardware", label: "Project hardware", emoji: "🤖" },
  { value: "tools", label: "Tools", emoji: "🛠️" },
  { value: "audio_visual", label: "Audio & video", emoji: "📷" },
  { value: "sports", label: "Sports gear", emoji: "🏸" },
];

export function equipmentCategoryLabel(category: string): string {
  return EQUIPMENT_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}
