import type { Request, Response } from "express";
import { JobService } from "../service/job.service.js";
import { JobFetcherService } from "../service/job-fetcher.service.js";

const jobService = new JobService();
const jobFetcherService = new JobFetcherService();

export const getAllJobs = async (req: Request, res: Response) => {
  const result = await jobService.fetchJobs();
  res.json(result);
};

export const createJob = async (req: Request, res: Response) => {
  const result = await jobService.addJob(req.body);
  res.status(result.status === 1 ? 201 : 500).json(result);
};

export const fetchAndSavePortalJobs = async (req: Request, res: Response) => {
  try {
    const result = await jobFetcherService.fetchAndStoreExternalJobs();
    res.json({ status: 1, message: "Jobs fetched and stored successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

export const getMatchedJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await jobFetcherService.getMatchedJobsForResume();
    res.json({ status: 1, message: "Matched jobs retrieved successfully", data: jobs });
  } catch (error: any) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

export const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const idStr = Array.isArray(rawId) ? (rawId[0] || "0") : (rawId || "0");
    const id = parseInt(idStr, 10);
    const { applicationStatus, notes } = req.body;
    const updated = await jobFetcherService.updateJobStatus(id, applicationStatus, notes);
    res.json({ status: 1, message: "Job status updated successfully", data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await jobFetcherService.getDashboardStats();
    res.json({ status: 1, message: "Dashboard stats retrieved successfully", data: stats });
  } catch (error: any) {
    res.status(500).json({ status: 0, message: error.message });
  }
};
