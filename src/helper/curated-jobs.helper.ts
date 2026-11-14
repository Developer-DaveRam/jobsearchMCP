export interface CuratedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  url: string;
  source: string;
  sourcePortal: string;
  matchScore: number;
  probabilityStatus: string;
  whyIFit: string;
  missingSkills: string;
  recruiterResponseLikelihood: string;
}

export const CURATED_JOBS: CuratedJob[] = [
  {
    title: "Node.js / TypeScript Developer",
    company: "LinkedIn Search Results",
    location: "Bengaluru / Chennai",
    description: "Real-time search for Node.js and TypeScript roles in Bengaluru and Chennai. Matches your profile (Node.js, TypeScript, Express, React).",
    salary: "₹7-12 LPA",
    url: "https://www.linkedin.com/jobs/search/?keywords=Node.js%20TypeScript%20Developer&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r604800&f_E=2%2C3",
    source: "LinkedIn",
    sourcePortal: "LinkedIn",
    matchScore: 98.0,
    probabilityStatus: "HIGHLY POSSIBLE",
    whyIFit: "Matches your core stack (Node.js, TS) and preferred location.",
    missingSkills: "None",
    recruiterResponseLikelihood: "High"
  },
  {
    title: "Backend Engineer (Node.js)",
    company: "Naukri.com Search",
    location: "Bengaluru / Chennai",
    description: "Filtered jobs for 1-2 years experience in Node.js backend development. Focuses on REST APIs, Prisma, and MySQL.",
    salary: "₹6-10 LPA",
    url: "https://www.naukri.com/node-js-typescript-jobs-in-bengaluru-chennai?experience=1&k=node.js%2C%20typescript%2C%20express",
    source: "Naukri",
    sourcePortal: "Naukri",
    matchScore: 96.5,
    probabilityStatus: "HIGHLY POSSIBLE",
    whyIFit: "Fits experience level (1-2 yrs) and backend expertise.",
    missingSkills: "None",
    recruiterResponseLikelihood: "High"
  },
  {
    title: "Full Stack Developer (React + Node)",
    company: "Indeed Search",
    location: "Remote / Hybrid",
    description: "Direct search on Indeed for Full Stack roles matching React and Node.js. High response rate for your profile.",
    salary: "₹8-11 LPA",
    url: "https://in.indeed.com/jobs?q=Node.js+React+Developer&l=Bengaluru%2C+Karnataka&fromage=7",
    source: "Indeed",
    sourcePortal: "Indeed",
    matchScore: 95.0,
    probabilityStatus: "HIGHLY POSSIBLE",
    whyIFit: "Matches Full Stack profile with React and Node.js.",
    missingSkills: "None",
    recruiterResponseLikelihood: "Medium-High"
  },
  {
    title: "Software Engineer SDE-1",
    company: "Glassdoor Openings",
    location: "Bengaluru",
    description: "SDE-1 roles at top product companies and startups in Bengaluru. Filtered for recent postings.",
    salary: "₹9-13 LPA",
    url: "https://www.glassdoor.co.in/Job/bengaluru-software-engineer-jobs-SRCH_IL.0,9_IC2881943_KO10,27.htm?fromAge=7",
    source: "Glassdoor",
    sourcePortal: "Glassdoor",
    matchScore: 92.0,
    probabilityStatus: "GOOD MATCH",
    whyIFit: "Strong technical foundation in modern JS/TS stack.",
    missingSkills: "System Design basics",
    recruiterResponseLikelihood: "Medium"
  },
  // Add more specific curated roles with actual portal search links
  {
    title: "Junior Backend Developer",
    company: "Internshala Full-Time",
    location: "Chennai",
    description: "Full-time backend roles for early-career developers. High visibility for Node.js profiles.",
    salary: "₹5-8 LPA",
    url: "https://internshala.com/jobs/node-js-development-jobs-in-chennai/",
    source: "Internshala",
    sourcePortal: "Internshala",
    matchScore: 89.0,
    probabilityStatus: "GOOD MATCH",
    whyIFit: "Perfect for 1-2 years experience range.",
    missingSkills: "None",
    recruiterResponseLikelihood: "High"
  }
];

