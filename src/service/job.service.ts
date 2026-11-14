import { db } from "../config/db.config.js";
import { ResponseBuilder, type ResponseFromate } from "../helper/response.formate.js";
import type { JobModel } from "../model/job.model.js";

export class JobService {
  async fetchJobs(): Promise<ResponseFromate> {
    try {
      const jobs = await db.job.findMany({
        where: { s_delete: 0 },
        orderBy: { postedAt: "desc" }
      });
      return ResponseBuilder.success(1, "Jobs fetched successfully", jobs);
    } catch (error: any) {
      return ResponseBuilder.failure(0, "Error fetching jobs", [error.message]);
    }
  }

  async addJob(data: JobModel): Promise<ResponseFromate> {
    try {
      const newJob = await db.job.create({
        data: {
          title: data.title,
          company: data.company,
          location: data.location ?? null,
          description: data.description ?? null,
          salary: data.salary ?? null
        }
      });
      return ResponseBuilder.success(1, "Job created successfully", [newJob]);
    } catch (error: any) {
      return ResponseBuilder.failure(0, "Error creating job", [error.message]);
    }
  }
}
