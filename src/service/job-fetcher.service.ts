import axios from "axios";
import { calculateJobMatchScore, isEligibleJob, getJobEligibilityReason, getJobMatchLevel } from "../helper/resume-matcher.helper";

type ApplicationState = { applicationStatus: string; notes: string };

// Temporary process-local state. Persist this in the Job table before deploying multiple instances.
const jobStateMap = new Map<number, ApplicationState>();
const jobCache = new Map<string, { expiresAt: number; fetched: number; jobs: any[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const http = axios.create({
  timeout: 12000,
  headers: { Accept: "application/json", "User-Agent": "jobsearchMCP/2.1" }
});

const toStableId = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
};

export class JobFetcherService {
  private getProbabilityStatus(score: number): string {
    if (score >= 85) return "HIGHLY POSSIBLE";
    if (score >= 70) return "GOOD MATCH";
    if (score >= 50) return "MODERATE";
    return "LOW";
  }

  async fetchAndStoreExternalJobs(searchQuery = "node", forceRefresh = false): Promise<{ fetched: number; saved: number; jobs: any[]; rejected: Record<string, number> }> {
    const query = searchQuery.trim().slice(0, 120) || "node";
    const cached = jobCache.get(query.toLowerCase());
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      const jobs = cached.jobs.map(job => ({ ...job, ...(jobStateMap.get(job.id) ?? {}) }));
      return { fetched: cached.fetched, saved: jobs.length, jobs };
    }
    const response = await http.get("https://remotive.com/api/remote-jobs", {
      params: { search: query, limit: 100 }
    });

    const rawJobs: any[] = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
    const unique = new Map<string, any>();\n    const rejected: Record<string, number> = {};

    for (const job of rawJobs) {
      const url = String(job.url ?? "").trim();
      if (!url || unique.has(url)) continue;
      const rejectionReason = getJobEligibilityReason({
        ...job,
        location: job.candidate_required_location,
        postedAt: job.publication_date
      });
      if (rejectionReason) {
        rejected[rejectionReason] = (rejected[rejectionReason] ?? 0) + 1;
        continue;
      }

      const id = toStableId(url);
      const title = String(job.title ?? "Untitled role");
      const description = String(job.description ?? "").replace(/<[^>]*>/g, " ").slice(0, 10000);
      const location = String(job.candidate_required_location ?? "Remote");
      const score = calculateJobMatchScore(title, description, location, {
        jobExperience: job.job_type ?? "",
        jobSalary: job.salary ?? ""
      });
      const state = jobStateMap.get(id) ?? { applicationStatus: "Not Applied", notes: "" };

      unique.set(url, {
        id,
        externalId: String(job.id ?? url),
        title,
        company: String(job.company_name ?? "Company not provided"),
        location,
        description,
        salary: String(job.salary ?? "Not disclosed"),
        url,
        source: "Remotive",
        sourcePortal: "Remotive",
        matchScore: score,
        matchLevel: getJobMatchLevel(score),
        probabilityStatus: this.getProbabilityStatus(score),
        whyIFit: `Matched skills and role keywords; calculated match score ${score}%.`,
        missingSkills: "Review the original job description for requirements not listed in your profile.",
        recruiterResponseLikelihood: "Not reliably predictable",
        applicationStatus: state.applicationStatus,
        notes: state.notes,
        postedAt: job.publication_date ?? null
      });
    }

    const jobs = [...unique.values()].sort((a, b) => b.matchScore - a.matchScore);
    jobCache.set(query.toLowerCase(), { expiresAt: Date.now() + CACHE_TTL_MS, fetched: rawJobs.length, jobs });
    return { fetched: rawJobs.length, saved: jobs.length, jobs, rejected };
  }

  async getMatchedJobsForResume(searchQuery = "node"): Promise<any[]> {
    const result = await this.fetchAndStoreExternalJobs(searchQuery);
    return result.jobs;
  }

  async updateJobStatus(id: number, applicationStatus?: string, notes?: string): Promise<any> {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("A valid job ID is required.");
    const allowed = ["Not Applied", "Applied", "Interview", "Rejected", "Offer"];
    if (applicationStatus !== undefined && !allowed.includes(applicationStatus)) {
      throw new Error("Invalid application status.");
    }
    if (applicationStatus === undefined && notes === undefined) {
      throw new Error("Provide applicationStatus or notes to update.");
    }

    const existing = jobStateMap.get(id) ?? { applicationStatus: "Not Applied", notes: "" };
    const updated = {
      applicationStatus: applicationStatus ?? existing.applicationStatus,
      notes: notes === undefined ? existing.notes : String(notes).slice(0, 5000)
    };
    jobStateMap.set(id, updated);
    return { id, ...updated };
  }

  async getDashboardStats(): Promise<any> {
    const jobs = await this.getMatchedJobsForResume();
    const count = (status: string) => jobs.filter(job => job.applicationStatus === status).length;
    return {
      total: jobs.length,
      highlyPossible: jobs.filter(job => job.probabilityStatus === "HIGHLY POSSIBLE").length,
      goodMatch: jobs.filter(job => job.probabilityStatus === "GOOD MATCH").length,
      moderate: jobs.filter(job => job.probabilityStatus === "MODERATE").length,
      low: jobs.filter(job => job.probabilityStatus === "LOW").length,
      applied: count("Applied"),
      interview: count("Interview"),
      rejected: count("Rejected"),
      offer: count("Offer"),
      pending: count("Not Applied")
    };
  }
}
