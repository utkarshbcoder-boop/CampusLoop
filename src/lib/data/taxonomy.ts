/**
 * Canonical skill / interest taxonomy.
 *
 * The matching engine only ever compares values from these lists, which keeps
 * scoring deterministic and lets the UI render filter chips for free.
 */

export type SkillDomain = "tech" | "design" | "data" | "core" | "soft" | "hardware" | "business";

export interface TaxonomyTerm {
  slug: string;
  label: string;
  domain: SkillDomain;
}

export const SKILLS: TaxonomyTerm[] = [
  { slug: "react", label: "React", domain: "tech" },
  { slug: "nextjs", label: "Next.js", domain: "tech" },
  { slug: "nodejs", label: "Node.js", domain: "tech" },
  { slug: "python", label: "Python", domain: "tech" },
  { slug: "cplusplus", label: "C++", domain: "tech" },
  { slug: "java", label: "Java", domain: "tech" },
  { slug: "typescript", label: "TypeScript", domain: "tech" },
  { slug: "flutter", label: "Flutter", domain: "tech" },
  { slug: "sql", label: "SQL", domain: "tech" },
  { slug: "mongodb", label: "MongoDB", domain: "tech" },
  { slug: "postgresql", label: "PostgreSQL", domain: "tech" },
  { slug: "firebase", label: "Firebase", domain: "tech" },
  { slug: "docker", label: "Docker", domain: "tech" },
  { slug: "git", label: "Git", domain: "tech" },
  { slug: "rest_api", label: "REST APIs", domain: "tech" },
  { slug: "javascript", label: "JavaScript", domain: "tech" },
  { slug: "verilog", label: "Verilog / RTL", domain: "hardware" },
  { slug: "figma", label: "Figma", domain: "design" },
  { slug: "ui_ux", label: "UI/UX Design", domain: "design" },
  { slug: "graphic_design", label: "Graphic Design", domain: "design" },
  { slug: "motion_graphics", label: "Motion Graphics", domain: "design" },
  { slug: "blender", label: "Blender 3D", domain: "design" },
  { slug: "machinelearning", label: "Machine Learning", domain: "data" },
  { slug: "deeplearning", label: "Deep Learning", domain: "data" },
  { slug: "datascience", label: "Data Science", domain: "data" },
  { slug: "pandas", label: "Pandas", domain: "data" },
  { slug: "powerbi", label: "Power BI", domain: "data" },
  { slug: "excel", label: "Excel / Sheets", domain: "data" },
  { slug: "tableau", label: "Tableau", domain: "data" },
  { slug: "dsalgo", label: "DSA & Algorithms", domain: "core" },
  { slug: "oops", label: "OOP", domain: "core" },
  { slug: "dbms", label: "DBMS", domain: "core" },
  { slug: "os", label: "Operating Systems", domain: "core" },
  { slug: "computerNetworks", label: "Computer Networks", domain: "core" },
  { slug: "statics", label: "Engineering Mechanics", domain: "core" },
  { slug: "soilMechanics", label: "Soil Mechanics", domain: "core" },
  { slug: "thermodynamics", label: "Thermodynamics", domain: "core" },
  { slug: "embedded_c", label: "Embedded C", domain: "hardware" },
  { slug: "arduino", label: "Arduino", domain: "hardware" },
  { slug: "robotics", label: "Robotics", domain: "hardware" },
  { slug: "vlsi", label: "VLSI", domain: "hardware" },
  { slug: "cad", label: "AutoCAD", domain: "hardware" },
  { slug: "matlab", label: "MATLAB / Simulink", domain: "hardware" },
  { slug: "ui_ux_research", label: "User Research", domain: "design" },
  { slug: "public_speaking", label: "Public Speaking", domain: "soft" },
  { slug: "technical_writing", label: "Technical Writing", domain: "soft" },
  { slug: "team_leadership", label: "Team Leadership", domain: "soft" },
  { slug: "time_management", label: "Time Management", domain: "soft" },
  { slug: "video_editing", label: "Video Editing", domain: "soft" },
  { slug: "finance", label: "Finance & Accounts", domain: "business" },
  { slug: "marketing", label: "Marketing", domain: "business" },
  { slug: "startup_pitch", label: "Startup Pitching", domain: "business" },
  { slug: "supply_chain", label: "Supply Chain", domain: "business" },
  { slug: "guitar", label: "Guitar", domain: "soft" },
  { slug: "photography", label: "Photography", domain: "soft" },
];

export const SKILL_SLUGS = SKILLS.map((s) => s.slug);

const SKILL_INDEX: Map<string, TaxonomyTerm> = new Map(SKILLS.map((s) => [s.slug, s]));

export function skillLabel(slug: string): string {
  return SKILL_INDEX.get(slug)?.label ?? slug;
}

export function skillDomain(slug: string): SkillDomain {
  return SKILL_INDEX.get(slug)?.domain ?? "tech";
}

export function skillsByDomain(domain: SkillDomain): TaxonomyTerm[] {
  return SKILLS.filter((s) => s.domain === domain);
}

export const INTERESTS = [
  "startups",
  "competitive_programming",
  "web3",
  "blockchain",
  "ai_for_good",
  "open_source",
  "robotics",
  "drone_tech",
  "climate_tech",
  "fintech",
  "edtech",
  "gamedev",
  "film_making",
  "photography",
  "music_production",
  "theatre",
  "dance",
  "football",
  "basketball",
  "cricket",
  "badminton",
  "swimming",
  "gym",
  "yoga",
  "manga",
  "debate",
  "quiz",
  "journalism",
  "social_impact",
  "memes_and_culture",
  "placement_prep",
  "higher_studies",
  "gaming",
] as const;

export type InterestSlug = (typeof INTERESTS)[number];

const INTEREST_LABELS: Record<string, string> = {
  startups: "Startups",
  competitive_programming: "Competitive Programming",
  web3: "Web3",
  blockchain: "Blockchain",
  ai_for_good: "AI for Good",
  open_source: "Open Source",
  robotics: "Robotics",
  drone_tech: "Drone Tech",
  climate_tech: "Climate Tech",
  fintech: "Fintech",
  edtech: "EdTech",
  gamedev: "Game Dev",
  film_making: "Film Making",
  photography: "Photography",
  music_production: "Music Production",
  theatre: "Theatre",
  dance: "Dance",
  football: "Football",
  basketball: "Basketball",
  cricket: "Cricket",
  badminton: "Badminton",
  swimming: "Swimming",
  gym: "Gym",
  yoga: "Yoga",
  manga: "Manga & Anime",
  debate: "Debate",
  quiz: "Quizzing",
  journalism: "Journalism",
  social_impact: "Social Impact",
  memes_and_culture: "Campus Culture",
  placement_prep: "Placement Prep",
  higher_studies: "Higher Studies",
  gaming: "Gaming",
};

export function interestLabel(slug: string): string {
  return INTEREST_LABELS[slug] ?? slug;
}

export const SUBJECTS = [
  "Computer Science",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Business Administration",
  "Economics",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Design",
] as const;

export const BOOK_SUBJECTS = [
  "Computer Science",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Business Administration",
  "Economics",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Literature",
  "Personal Development",
  "Competitive Exams",
  "General Knowledge",
] as const;

export const AVAILABILITY_SLOTS = [
  "weekday_morning",
  "weekday_afternoon",
  "weekday_evening",
  "weekday_night",
  "weekend_morning",
  "weekend_afternoon",
  "weekend_evening",
] as const;

export type AvailabilitySlot = (typeof AVAILABILITY_SLOTS)[number];

const SLOT_LABELS: Record<string, string> = {
  weekday_morning: "Weekday mornings",
  weekday_afternoon: "Weekday afternoons",
  weekday_evening: "Weekday evenings",
  weekday_night: "Weekday late nights",
  weekend_morning: "Weekend mornings",
  weekend_afternoon: "Weekend afternoons",
  weekend_evening: "Weekend evenings",
};

export function slotLabel(slug: string): string {
  return SLOT_LABELS[slug] ?? slug;
}

export function slotShort(slug: string): string {
  const map: Record<string, string> = {
    weekday_morning: "WD AM",
    weekday_afternoon: "WD PM",
    weekday_evening: "WD EVE",
    weekday_night: "WD NIGHT",
    weekend_morning: "WE AM",
    weekend_afternoon: "WE PM",
    weekend_ening: "WE EVE",
  };
  return map[slug] ?? slug;
}
