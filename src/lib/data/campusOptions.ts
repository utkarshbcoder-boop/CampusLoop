import { colleges } from "@/lib/data/colleges";

export const OTHER_CAMPUS_VALUE = "__other__";
const CUSTOM_CAMPUS_PREFIX = "custom:";

export const additionalCampusOptions = [
  { id: "col_iitm", name: "Indian Institute of Technology Madras", short_name: "IIT Madras" },
  { id: "col_nitk", name: "National Institute of Technology Karnataka, Surathkal", short_name: "NIT Karnataka" },
  { id: "col_amity_noida", name: "Amity University, Noida", short_name: "Amity Noida" },
  { id: "col_chandigarh", name: "Chandigarh University", short_name: "Chandigarh University" },
  { id: "col_lpu", name: "Lovely Professional University", short_name: "LPU" },
  { id: "col_kiit", name: "Kalinga Institute of Industrial Technology", short_name: "KIIT" },
  { id: "col_symbiosis", name: "Symbiosis International University, Pune", short_name: "Symbiosis Pune" },
  { id: "col_thapar", name: "Thapar Institute of Engineering and Technology", short_name: "Thapar University" },
  { id: "col_pes", name: "PES University, Bengaluru", short_name: "PES University" },
  { id: "col_christ", name: "Christ University, Bengaluru", short_name: "Christ University" },
  { id: "col_jain", name: "JAIN (Deemed-to-be University), Bengaluru", short_name: "JAIN University" },
  { id: "col_upes", name: "University of Petroleum and Energy Studies, Dehradun", short_name: "UPES" },
  { id: "col_ashoka", name: "Ashoka University, Sonipat", short_name: "Ashoka University" },
  { id: "col_shiv_nadar", name: "Shiv Nadar University, Greater Noida", short_name: "Shiv Nadar University" },
  { id: "col_vit", name: "Vellore Institute of Technology", short_name: "VIT Vellore" },
  { id: "col_manipal", name: "Manipal Institute of Technology", short_name: "MIT Manipal" },
] as const;

export const campusOptions = [
  ...colleges.map(({ id, name, short_name }) => ({ id, name, short_name })),
  ...additionalCampusOptions,
];

export function customCampusId(name: string): string {
  return `${CUSTOM_CAMPUS_PREFIX}${encodeURIComponent(name.trim())}`;
}

export function isCustomCampusId(id: string): boolean {
  return id.startsWith(CUSTOM_CAMPUS_PREFIX);
}

export function customCampusName(id: string): string {
  if (!isCustomCampusId(id)) return "";
  try {
    return decodeURIComponent(id.slice(CUSTOM_CAMPUS_PREFIX.length));
  } catch {
    return "";
  }
}

export function campusNameById(id: string): string | undefined {
  const campus = campusOptions.find((option) => option.id === id);
  return campus?.short_name ?? (customCampusName(id) || undefined);
}
