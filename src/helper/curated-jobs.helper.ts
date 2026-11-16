/**
 * Curated portal search URLs are not verified job listings and must never be
 * presented as individual vacancies. The live fetcher currently uses Remotive.
 */
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

export const CURATED_JOBS: CuratedJob[] = [];
