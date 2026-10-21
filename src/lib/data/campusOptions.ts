import { colleges } from "@/lib/data/colleges";

export const OTHER_CAMPUS_VALUE = "__other__";
const CUSTOM_CAMPUS_PREFIX = "custom:";

export const additionalCampusOptions = [
  { id: "col_iitm", name: "Indian Institute of Technology Madras", short_name: "IIT Madras" },
  { id: "col_iitkgp", name: "Indian Institute of Technology Kharagpur", short_name: "IIT Kharagpur" },
  { id: "col_iitk", name: "Indian Institute of Technology Kanpur", short_name: "IIT Kanpur" },
  { id: "col_iitr", name: "Indian Institute of Technology Roorkee", short_name: "IIT Roorkee" },
  { id: "col_iitg", name: "Indian Institute of Technology Guwahati", short_name: "IIT Guwahati" },
  { id: "col_iisc", name: "Indian Institute of Science, Bengaluru", short_name: "IISc Bengaluru" },
  { id: "col_nitk", name: "National Institute of Technology Karnataka, Surathkal", short_name: "NIT Karnataka" },
  { id: "col_nitw", name: "National Institute of Technology Warangal", short_name: "NIT Warangal" },
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
