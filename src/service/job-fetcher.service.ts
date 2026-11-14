import axios from "axios";
import { CURATED_JOBS } from "../helper/curated-jobs.helper";
import { calculateJobMatchScore } from "../helper/resume-matcher.helper";

// In-memory store for application statuses and notes
const jobStateMap = new Map<number, { applicationStatus: string; notes: string }>();

export class JobFetcherService {
  private getProbabilityStatus(score: number): string {
    if (score >= 85) return "HIGHLY POSSIBLE";
    if (score >= 70) return "GOOD MATCH";
    if (score >= 50) return "MODERATE";
    return "LOW";
  }

  async fetchAndStoreExternalJobs(): Promise<{ fetched: number; saved: number; jobs: any[] }> {
    const processedJobs: any[] = [];

    // 1. Process Curated Jobs on-the-fly
    CURATED_JOBS.forEach((item, index) => {
      const id = index + 1;
      const score = calculateJobMatchScore(item.title, item.description, item.location);
      const status = this.getProbabilityStatus(score);
      const state = jobStateMap.get(id) || { applicationStatus: "Not Applied", notes: "" };

      processedJobs.push({
        id,
        title: item.title,
        company: item.company,
        location: item.location,
        description: item.description,
        salary: item.salary,
        url: item.url,
        source: item.source,
        sourcePortal: item.sourcePortal,
        matchScore: score,
        probabilityStatus: status,
        whyIFit: item.whyIFit || `Matches profile with ${score}% compatibility.`,
        missingSkills: item.missingSkills || "None",
        recruiterResponseLikelihood: item.recruiterResponseLikelihood || (score > 80 ? "High" : "Medium"),
        applicationStatus: state.applicationStatus,
        notes: state.notes,
        postedAt: new Date().toISOString()
      });
    });

    // 2. Try fetching live remote jobs from Remotive on-the-fly
    try {
      const remotiveRes = await axios.get("https://remotive.com/api/remote-jobs?search=node&limit=15", { timeout: 4000 });
      const remotiveJobs = remotiveRes.data?.jobs || [];
      remotiveJobs.forEach((job: any, idx: number) => {
        const id = CURATED_JOBS.length + idx + 1;
        const score = calculateJobMatchScore(job.title, job.description, job.candidate_required_location);
        const status = this.getProbabilityStatus(score);
        const state = jobStateMap.get(id) || { applicationStatus: "Not Applied", notes: "" };

        processedJobs.push({
          id,
          title: job.title || "Untitled Job",
          company: job.company_name || "Unknown Company",
          location: job.candidate_required_location || "Remote",
          description: job.description ? job.description.substring(0, 5000) : "",
          salary: job.salary || "Competitive",
          url: job.url || "",
          source: "Remotive",
          sourcePortal: "Remotive",
          matchScore: score,
          probabilityStatus: status,
          whyIFit: `Remote Node.js role with ${score}% match.`,
          missingSkills: "Check description for specific infrastructure requirements.",
          recruiterResponseLikelihood: score > 80 ? "High" : "Medium",
          applicationStatus: state.applicationStatus,
          notes: state.notes,
          postedAt: job.publication_date || new Date().toISOString()
        });
      });
    } catch (err) {
      console.log("Remotive live fetch skipped/failed gracefully:", err);
    }

    // Sort by match score descending
    processedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return {
      fetched: processedJobs.length,
      saved: processedJobs.length,
      jobs: processedJobs
    };
  }

  async getMatchedJobsForResume(): Promise<any[]> {
    const result = await this.fetchAndStoreExternalJobs();
    return result.jobs;
  }

  async updateJobStatus(id: number, applicationStatus: string, notes?: string): Promise<any> {
    const existing = jobStateMap.get(id) || { applicationStatus: "Not Applied", notes: "" };
    const updated = {
      applicationStatus: applicationStatus !== undefined ? applicationStatus : existing.applicationStatus,
      notes: notes !== undefined ? notes : existing.notes
    };
    jobStateMap.set(id, updated);
    return { id, ...updated };
  }

  async getDashboardStats(): Promise<any> {
    const jobs = await this.getMatchedJobsForResume();
    const total = jobs.length;
    const highlyPossible = jobs.filter(j => j.probabilityStatus === "HIGHLY POSSIBLE").length;
    const goodMatch = jobs.filter(j => j.probabilityStatus === "GOOD MATCH").length;
    const moderate = jobs.filter(j => j.probabilityStatus === "MODERATE").length;
    const low = jobs.filter(j => j.probabilityStatus === "LOW").length;

    const applied = jobs.filter(j => j.applicationStatus === "Applied").length;
    const interview = jobs.filter(j => j.applicationStatus === "Interview").length;
    const rejected = jobs.filter(j => j.applicationStatus === "Rejected").length;
    const offer = jobs.filter(j => j.applicationStatus === "Offer").length;
    const pending = total - (applied + interview + rejected + offer);

    return {
      total,
      highlyPossible,
      goodMatch,
      moderate,
      low,
      applied,
      interview,
      rejected,
      offer,
      pending
    };
  }
}
