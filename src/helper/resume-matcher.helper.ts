// export const RESUME_PROFILE = {
//   name: "Daveram A",
//   title: "Full Stack Developer",
//   skills: [
//     "node.js", "typescript", "express.js", "react.js", "next.js",
//     "prisma", "mysql", "mongodb", "redis", "rest apis", "docker", 
//     "tailwind css", "git", "pm2", "nginx", "cpanel"
//   ],
//   experienceYears: 2,
//   preferredLocations: ["Bengaluru", "Chennai", "Remote"],
//   expectedSalary: { min: 600000, max: 900000 } // In INR
// };

// export function calculateJobMatchScore(jobTitle: string, jobDescription: string = "", jobLocation: string = ""): number {
//   const text = `${jobTitle} ${jobDescription} ${jobLocation}`.toLowerCase();
  
//   const coreSkills = ["node.js", "typescript", "react", "next.js", "express"];
//   const secondarySkills = ["prisma", "mysql", "mongodb", "redis", "docker", "tailwind", "rest api"];
  
//   let coreMatchCount = 0;
//   let secondaryMatchCount = 0;

//   coreSkills.forEach(skill => {
//     if (text.includes(skill.toLowerCase())) coreMatchCount++;
//   });

//   secondarySkills.forEach(skill => {
//     if (text.includes(skill.toLowerCase())) secondaryMatchCount++;
//   });

//   // Weighted score: Core skills are 60%, Secondary skills are 40%
//   const coreScore = (coreMatchCount / coreSkills.length) * 60;
//   const secondaryScore = (secondaryMatchCount / secondarySkills.length) * 40;
  
//   let finalScore = coreScore + secondaryScore;

//   // Exact location match bonus
//   const locationMatch = RESUME_PROFILE.preferredLocations.some(loc => 
//     text.includes(loc.toLowerCase())
//   );
//   if (locationMatch) {
//     finalScore = Math.min(100, finalScore + 10);
//   }

//   // Penalty for high experience requirements (heuristic)
//   const expMatch = text.match(/(\d+)\s*\+?\s*years?/);
//   if (expMatch && expMatch[1]) {
//     const requiredExp = parseInt(expMatch[1]);
//     if (requiredExp > 3) {
//       finalScore *= 0.5; // Significant penalty for 3+ years if candidate has 1-2
//     }
//   }

//   return Math.round(finalScore * 10) / 10;
// }




export const RESUME_PROFILE = {
  name: "Daveram A",

  title: "Full Stack Developer",

  experience: {
    min: 1,
    max: 2,
    target: "1-2 years",
  },

  employmentType: ["Full-time", "Permanent"],

  skills: {
    core: [
      "node.js",
      "typescript",
      "express.js",
      "react.js",
      "next.js",
    ],

    secondary: [
      "prisma",
      "mysql",
      "mongodb",
      "redis",
      "docker",
      "tailwind css",
      "rest api",
    ],

    additional: [
      "git",
      "pm2",
      "nginx",
      "cpanel",
      "bullmq",
      "vite",
      "javascript",
    ],
  },

  preferredLocations: [
    "bengaluru",
    "bangalore",
    "chennai",
  ],

  workMode: [
    "hybrid",
    "onsite",
    ],

  expectedSalary: {
    min: 600000,
    max: 900000,
    absoluteMinimum: 500000,
    currency: "INR",
  },

  companyPreferences: {
    preferredTypes: [
      "MNC",
      "Tier-2",
      "Mid-size",
      "Service-based",
      "Product-based",
    ],
    minimumEmployees: 50,
    idealEmployees: 200,
    avoidSmallStartups: true,
  },

  jobFreshness: {
    maxAgeDays: 7,
    requireVerifiedDate: true,
    includeRefreshedJobs: true,
  },

  excludedJobTypes: [
    "internship",
    "intern",
    "freelance",
    "part-time",
    "unpaid",
  ],

  excludedKeywords: [
    "senior developer",
    "lead developer",
    "technical lead",
    "architect",
    "principal engineer",
  ],
};

type MatchOptions = {
  jobTitle: string;
  jobDescription?: string;
  jobLocation?: string;
  jobExperience?: string;
  jobSalary?: string;
  companySize?: number;
};

const normalize = (value: unknown): string =>
  String(value ?? "").toLowerCase().trim();

export function calculateJobMatchScore(
  jobTitle: string,
  jobDescription = "",
  jobLocation = "",
  options: MatchOptions | null = null
): number {
  const text = normalize(
    `${jobTitle} ${jobDescription} ${jobLocation}`
  );

  let score = 0;

  // Core technical skills: 45 points
  const coreSkills = RESUME_PROFILE.skills.core;

  const coreMatches = coreSkills.filter(skill =>
    text.includes(skill)
  ).length;

  score += (coreMatches / coreSkills.length) * 45;

  // Secondary skills: 20 points
  const secondarySkills = RESUME_PROFILE.skills.secondary;

  const secondaryMatches = secondarySkills.filter(skill =>
    text.includes(skill)
  ).length;

  score += (secondaryMatches / secondarySkills.length) * 20;

  // Additional skills: 5 points
  const additionalSkills = RESUME_PROFILE.skills.additional;

  const additionalMatches = additionalSkills.filter(skill =>
    text.includes(skill)
  ).length;

  score += (additionalMatches / additionalSkills.length) * 5;

  // Role relevance: 10 points
  const roleKeywords = [
    "full stack",
    "backend developer",
    "node.js developer",
    "react.js developer",
    "next.js developer",
    "software engineer",
    "react developer",
    "backend engineer",
  ];

  if (roleKeywords.some(keyword => text.includes(keyword))) {
    score += 10;
  }

  // Location relevance: 10 points
  const location = normalize(jobLocation);

  if (
    RESUME_PROFILE.preferredLocations.some(loc =>
      location.includes(loc)
    )
  ) {
    score += 10;
  }

  // Experience relevance: 5 points
  const experience = normalize(options?.jobExperience || text);

  if (
    /0\s*[-–to]+\s*2\s*years?|1\s*[-–to]+\s*2\s*years?|2\s*\+?\s*years?/.test(experience)
  ) {
    score += 5;
  } else if (/0\s*[-–to]+\s*3\s*years?/.test(experience)) {
    score += 3;
  }

  // Salary relevance: 5 points
  const salary = normalize(options?.jobSalary);

  if (salary) {
    if (
      salary.includes("6-9") ||
      salary.includes("6 to 9") ||
      salary.includes("6–9")
    ) {
      score += 5;
    } else if (salary.includes("5")) {
      score += 3;
    }
  }

  return Math.round(Math.min(100, score) * 10) / 10;
}

export function isPreferredLocation(location: string): boolean {
  const normalized = normalize(location);

  return RESUME_PROFILE.preferredLocations.some(loc =>
    normalized.includes(loc)
  );
}

export function isEligibleJob(job: any): boolean {
  const title = normalize(job.title || job.jobTitle || job.role);
  const description = normalize(job.description || job.jobDescription);
  const location = normalize(job.location || job.jobLocation);

  const combined = `${title} ${description}`;

  // Exclude internships and unwanted employment types
  if (
    RESUME_PROFILE.excludedJobTypes.some(type =>
      combined.includes(type)
    )
  ) {
    return false;
  }

  // Exclude senior-level positions
  if (
    RESUME_PROFILE.excludedKeywords.some(keyword =>
      title.includes(keyword)
    )
  ) {
    return false;
  }

  // Strict location filtering
  if (!isPreferredLocation(location)) {
    return false;
  }

  // Exclude explicitly closed jobs
  if (
    job.isActive === false ||
    job.isExpired === true ||
    job.isClosed === true ||
    ["closed", "expired", "inactive"].includes(
      normalize(job.status)
    )
  ) {
    return false;
  }

  // Exclude explicitly small companies
  const employees = Number(
    job.companySize || job.employeeCount || 0
  );

  if (
    employees > 0 &&
    employees < RESUME_PROFILE.companyPreferences.minimumEmployees
  ) {
    return false;
  }

  // Require verifiable posting or refresh date
  const dateValue =
    job.refreshedAt ||
    job.lastRefreshedAt ||
    job.postedAt ||
    job.postingDate ||
    job.createdAt;

  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  const ageDays =
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays < 0 || ageDays > 7) return false;

  return true;
}

export function getJobMatchLevel(score: number) {
  if (score >= 85) return "High";
  if (score >= 70) return "Medium";
  return "Low";
}
