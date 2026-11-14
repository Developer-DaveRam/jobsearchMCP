import { NextResponse } from "next/server";
import { JobFetcherService } from "@/service/job-fetcher.service";

const jobFetcherService = new JobFetcherService();

export async function GET() {
  try {
    const jobs = await jobFetcherService.getMatchedJobsForResume();
    return NextResponse.json({ status: 1, message: "Jobs retrieved successfully", data: jobs });
  } catch (error: any) {
    return NextResponse.json({ status: 0, message: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await jobFetcherService.fetchAndStoreExternalJobs();
    return NextResponse.json({ status: 1, message: "Jobs synced successfully", data: result });
  } catch (error: any) {
    return NextResponse.json({ status: 0, message: error.message }, { status: 500 });
  }
}
