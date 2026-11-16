export const RESUME_PROFILE = {
  name: "Daveram A",
  title: "Full Stack / Node.js Backend Developer",
  experienceYears: 2,
  preferredLocations: ["bengaluru", "bangalore", "chennai"],
  remotePreferred: true,
  expectedSalary: { min: 500000, max: 1200000, currency: "INR" },
  skills: {
    core: ["node.js", "typescript", "express", "react", "next.js", "javascript"],
    secondary: ["prisma", "mysql", "mongodb", "redis", "docker", "tailwind", "rest api", "restful api"],
    additional: ["git", "pm2", "nginx", "bullmq", "html", "css"]
  },
  excludedJobTypes: ["internship", "intern", "freelance", "part-time", "unpaid", "contract"],
  excludedKeywords: ["senior developer", "lead developer", "technical lead", "architect", "principal engineer", "engineering manager"],
  maxAgeDays: 7
} as const;

type MatchOptions = {
  jobExperience?: string;
  jobSalary?: string;
  companySize?: number;
};

const normalize = (value: unknown): string =>
  String(value ?? "").toLowerCase().replace(/[\u2010-\u2015]/g, "-").trim();

const hasSkill = (text: string, skill: string): boolean => {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(text);
};

export function calculateJobMatchScore(
  jobTitle: string,
  jobDescription = "",
  jobLocation = "",
  options: MatchOptions | null = null
): number {
  const title = normalize(jobTitle);
  const description = normalize(jobDescription);
  const allText = `${title} ${description}`;
  let score = 0;

  const core = RESUME_PROFILE.skills.core;
  const secondary = RESUME_PROFILE.skills.secondary;
  const additional = RESUME_PROFILE.skills.additional;
  score += core.filter(skill => hasSkill(allText, skill)).length / core.length * 45;
  score += secondary.filter(skill => hasSkill(allText, skill)).length / secondary.length * 20;
  score += additional.filter(skill => hasSkill(allText, skill)).length / additional.length * 5;

  const roleTerms = ["node.js", "backend", "back-end", "full stack", "software engineer", "react developer", "api developer"];
  if (roleTerms.some(term => title.includes(term))) score += 10;

  const location = normalize(jobLocation);
  if (RESUME_PROFILE.preferredLocations.some(place => location.includes(place))) score += 10;
  else if (/remote|anywhere|worldwide/i.test(location)) score += 7;

  const experience = normalize(options?.jobExperience ?? "");
  const range = experience.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/);
  const minimum = experience.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?/);
  if (range) {
    const low = Number(range[1]);
    const high = Number(range[2]);
    if (low <= 2 && high >= 2) score += 5;
    else if (low <= 3 && high >= 1) score += 3;
    else if (low > 3) score -= 10;
  } else if (minimum) {
    const required = Number(minimum[1]);
    if (required <= 2) score += 5;
    else if (required <= 3) score += 2;
    else score -= Math.min(15, (required - 2) * 5);
  }

  const salary = normalize(options?.jobSalary);
  if (/5\s*(?:-|to)\s*12|6\s*(?:-|to)\s*9|7\s*(?:-|to)\s*12/.test(salary) || /5\s*[-–]\s*12\s*lpa/.test(salary)) {
    score += 5;
  } else if (salary && /below|less than|under/.test(salary)) {
    score -= 5;
  }

  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

export function isPreferredLocation(location: string): boolean {
  const value = normalize(location);
  return RESUME_PROFILE.preferredLocations.some(place => value.includes(place)) ||
    (RESUME_PROFILE.remotePreferred && /remote|anywhere|worldwide/i.test(value));
}

export function isEligibleJob(job: Record<string, any>, now = Date.now()): boolean {
  const title = normalize(job.title ?? job.jobTitle ?? job.role);
  const description = normalize(job.description ?? job.jobDescription);
  const location = normalize(job.location ?? job.jobLocation ?? job.candidate_required_location);
  const combined = `${title} ${description}`;

  if (!title || !job.url) return false;
  if (RESUME_PROFILE.excludedJobTypes.some(term => combined.includes(term))) return false;
  if (RESUME_PROFILE.excludedKeywords.some(term => title.includes(term)) || /\b(senior|sr\.?|lead|principal|staff|architect|manager)\b/i.test(title)) return false;
  if (!isPreferredLocation(location)) return false;

  if (job.isActive === false || job.isExpired === true || job.isClosed === true ||
      ["closed", "expired", "inactive"].includes(normalize(job.status))) return false;

  const dateValue = job.publication_date ?? job.postedAt ?? job.postingDate ?? job.createdAt;
  if (!dateValue) return false;
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const ageDays = (now - timestamp) / 86_400_000;
  if (ageDays < -1 || ageDays > RESUME_PROFILE.maxAgeDays) return false;

  const employees = Number(job.companySize ?? job.employeeCount ?? 0);
  if (employees > 0 && employees < 50) return false;
  return true;
}

export function getJobMatchLevel(score: number): "High" | "Medium" | "Low" {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  return "Low";
}
