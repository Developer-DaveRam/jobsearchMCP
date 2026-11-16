import axios from "axios";
import {
  calculateJobMatchScore,
  getJobEligibilityReason,
  getJobMatchLevel,
  isPreferredLocation
} from "../helper/resume-matcher.helper";

type ApplicationState = { applicationStatus: string; notes: string };
type ProviderResult = { source: string; jobs: any[]; fetched: number; error?: string };
type CachedResult = {
  expiresAt: number;
  fetched: number;
  jobs: any[];
  rejected: Record<string, number>;
  sources: Array<{ source: string; fetched: number; saved: number; status: "ok" | "error"; error?: string }>;
};

const jobStateMap = new Map<number, ApplicationState>();
const jobCache = new Map<string, CachedResult>();
const CACHE_TTL_MS = 15 * 60 * 1000;
const http = axios.create({
  timeout: 15000,
  headers: { Accept: "application/json", "User-Agent": "jobsearchMCP/2.2 (+https://github.com/Developer-DaveRam/jobsearchMCP)" }
});

const toStableId = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
};

const stripHtml = (value: unknown): string =>
  String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();

const asDate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = typeof value === "number" ? new Date(value < 10_000_000_000 ? value * 1000 : value) : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const matchesQuery = (job: any, query: string): boolean => {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  if (!words.length) return true;
  const text = [job.title, job.description, ...(Array.isArray(job.tags) ? job.tags : [])].join(" ").toLowerCase();
  return words.some(word => text.includes(word));
};

const normalizeJob = (job: any, source: string, fields: {
  title: unknown; company: unknown; location: unknown; description: unknown;
  url: unknown; postedAt: unknown; salary?: unknown; employmentType?: unknown;
}): any | null => {
  const url = String(fields.url ?? "").trim();
  const title = String(fields.title ?? "").trim();
  if (!url || !/^https?:\/\//i.test(url) || !title) return null;
  const description = stripHtml(fields.description).slice(0, 12000);
  const location = String(fields.location ?? "Remote").trim() || "Remote";
  const postedAt = asDate(fields.postedAt);
  const score = calculateJobMatchScore(title, description, location, {
    jobExperience: String(fields.employmentType ?? ""),
    jobSalary: String(fields.salary ?? "")
  });
  const id = toStableId(url);
  const state = jobStateMap.get(id) ?? { applicationStatus: "Not Applied", notes: "" };
  return {
    id,
    externalId: String(job.id ?? url),
    title,
    company: String(fields.company ?? "Company not provided"),
    location,
    description,
    salary: String(fields.salary ?? "Not disclosed"),
    url,
    source,
    sourcePortal: source,
    matchScore: score,
    matchLevel: getJobMatchLevel(score),
    probabilityStatus: score >= 85 ? "HIGHLY POSSIBLE" : score >= 70 ? "GOOD MATCH" : score >= 50 ? "MODERATE" : "LOW",
    whyIFit: `Matched profile skills and role keywords; heuristic match score ${score}%.`,
    missingSkills: "Review the original job description for requirements not listed in your profile.",
    recruiterResponseLikelihood: "Not reliably predictable",
    applicationStatus: state.applicationStatus,
    notes: state.notes,
    postedAt
  };
};

const safelyFetch = async (source: string, fetcher: () => Promise<any>, mapper: (data: any) => any[]): Promise<ProviderResult> => {
  try {
    const response = await fetcher();
    const jobs = mapper(response.data);
    return { source, jobs, fetched: jobs.length };
  } catch (error: any) {
    return { source, jobs: [], fetched: 0, error: error?.response?.status ? `HTTP ${error.response.status}` : String(error?.message ?? "Provider request failed") };
  }
};

export class JobFetcherService {
  private readonly portalSearchLinks = (query: string) => {
    const q = encodeURIComponent(query);
    return {
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=India`,
      naukri: `https://www.naukri.com/${encodeURIComponent(query.replace(/\s+/g, "-"))}-jobs`,
      indeed: `https://in.indeed.com/jobs?q=${q}&l=India`,
      glassdoor: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${q}`
    };
  };

  private async fetchProviders(query: string): Promise<ProviderResult[]> {
    const q = query.trim().slice(0, 80) || "node";
    const providers = await Promise.all([
      safelyFetch("Remotive", () => http.get("https://remotive.com/api/remote-jobs", { params: { search: q, limit: 100 } }), data =>
        (Array.isArray(data?.jobs) ? data.jobs : []).map((j: any) => normalizeJob(j, "Remotive", {
          title: j.title, company: j.company_name, location: j.candidate_required_location || "Remote",
          description: j.description, url: j.url, postedAt: j.publication_date, salary: j.salary, employmentType: j.job_type
        })).filter(Boolean)),
      safelyFetch("RemoteOK", () => http.get("https://remoteok.com/api"), data =>
        (Array.isArray(data) ? data.slice(1) : []).filter((j: any) => matchesQuery({ ...j, title: j.position, tags: j.tags }, q)).map((j: any) =>
          normalizeJob(j, "RemoteOK", {
            title: j.position, company: j.company, location: j.location || "Remote",
            description: j.description, url: j.apply_url || j.url, postedAt: j.date || j.epoch,
            salary: j.salary_min || j.salary_max ? `${j.salary_min || 0}-${j.salary_max || 0}` : "Not disclosed",
            employmentType: ""
          })).filter(Boolean)),
      safelyFetch("Jobicy", () => http.get("https://jobicy.com/api/jobs", { params: { count: 100, tag: q.length >= 3 ? q : "node" } }), data =>
        (Array.isArray(data?.jobs) ? data.jobs : []).map((j: any) => normalizeJob(j, "Jobicy", {
          title: j.jobTitle, company: j.companyName, location: j.jobGeo || "Remote",
          description: j.jobDescription, url: j.url, postedAt: j.pubDate,
          salary: j.annualSalaryMin || j.annualSalaryMax ? `${j.annualSalaryMin || 0}-${j.annualSalaryMax || 0} ${j.salaryCurrency ?? ""}` : "Not disclosed",
          employmentType: j.jobType
        })).filter(Boolean)),
      safelyFetch("Himalayas", () => http.get("https://himalayas.app/jobs/api/search", { params: { q, country: "India", sort: "recent", page: 1 } }), data =>
        (Array.isArray(data?.jobs) ? data.jobs : []).map((j: any) => {
          const restrictions = Array.isArray(j.locationRestrictions) ? j.locationRestrictions : [];
          const location = restrictions.length ? restrictions.join(", ") : "Worldwide remote";
          return normalizeJob(j, "Himalayas", {
            title: j.title, company: j.companyName, location,
            description: j.description || j.excerpt, url: j.applicationLink, postedAt: j.pubDate,
            salary: j.minSalary || j.maxSalary ? `${j.minSalary || 0}-${j.maxSalary || 0} ${j.currency ?? ""} / ${j.salaryPeriod ?? "annual"}` : "Not disclosed",
            employmentType: j.employmentType
          });
        }).filter(Boolean)),
      safelyFetch("Arbeitnow", () => http.get("https://www.arbeitnow.com/api/job-board-api", { params: { page: 1 } }), data =>
        (Array.isArray(data?.data) ? data.data : []).filter((j: any) => j.remote === true && matchesQuery({ ...j, title: j.title }, q)).map((j: any) =>
          normalizeJob(j, "Arbeitnow", {
            title: j.title, company: j.company_name, location: j.location || "Remote",
            description: j.description, url: j.url, postedAt: j.created_at, employmentType: j.job_types?.join(", ")
          })).filter(Boolean))
    ]);
    return providers;
  }

  async fetchAndStoreExternalJobs(searchQuery = "node", forceRefresh = false): Promise<{
    fetched: number; saved: number; jobs: any[]; rejected: Record<string, number>;
    sources: CachedResult["sources"]; portalSearchLinks: Record<string, string>;
    unavailablePortals: string[];
  }> {
    const query = searchQuery.trim().slice(0, 120) || "node";
    const cacheKey = query.toLowerCase();
    const cached = jobCache.get(cacheKey);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      const jobs = cached.jobs.map(job => ({ ...job, ...(jobStateMap.get(job.id) ?? {}) }));
      return {
        fetched: cached.fetched, saved: jobs.length, jobs, rejected: cached.rejected,
        sources: cached.sources, portalSearchLinks: this.portalSearchLinks(query),
        unavailablePortals: ["LinkedIn", "Naukri", "Indeed", "Glassdoor"]
      };
    }

    const results = await this.fetchProviders(query);
    const rawCount = results.reduce((total, item) => total + item.fetched, 0);
    const unique = new Map<string, any>();
    const rejected: Record<string, number> = {};

    for (const provider of results) {
      for (const job of provider.jobs) {
        if (unique.has(job.url)) continue;
        const reason = getJobEligibilityReason({
          title: job.title, url: job.url, location: job.location, postedAt: job.postedAt,
          job_type: job.employmentType
        });
        if (reason) {
          rejected[reason] = (rejected[reason] ?? 0) + 1;
          continue;
        }
        // Job-board API feeds already represent published listings; only reject a known stale date.
        unique.set(job.url, job);
      }
    }

    const jobs = [...unique.values()].sort((a, b) => b.matchScore - a.matchScore);
    const sources = results.map(item => ({
      source: item.source, fetched: item.fetched,
      saved: jobs.filter(job => job.source === item.source).length,
      status: item.error ? "error" as const : "ok" as const,
      ...(item.error ? { error: item.error } : {})
    }));
    jobCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS, fetched: rawCount, jobs, rejected, sources
    });

    return {
      fetched: rawCount, saved: jobs.length, jobs, rejected, sources,
      portalSearchLinks: this.portalSearchLinks(query),
      unavailablePortals: ["LinkedIn", "Naukri", "Indeed", "Glassdoor"]
    };
  }

  async getMatchedJobsForResume(searchQuery = "node"): Promise<any[]> {
    const result = await this.fetchAndStoreExternalJobs(searchQuery);
    return result.jobs;
  }

  async updateJobStatus(id: number, applicationStatus?: string, notes?: string): Promise<any> {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("A valid job ID is required.");
    const allowed = ["Not Applied", "Applied", "Interview", "Rejected", "Offer"];
    if (applicationStatus !== undefined && !allowed.includes(applicationStatus)) throw new Error("Invalid application status.");
    if (applicationStatus === undefined && notes === undefined) throw new Error("Provide applicationStatus or notes to update.");
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
      applied: count("Applied"), interview: count("Interview"), rejected: count("Rejected"),
      offer: count("Offer"), pending: count("Not Applied")
    };
  }
}
