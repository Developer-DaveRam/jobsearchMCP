import { NextRequest, NextResponse } from "next/server";
import { JobFetcherService } from "@/service/job-fetcher.service";

const jobFetcherService = new JobFetcherService();

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") || "node";
    const result = await jobFetcherService.fetchAndStoreExternalJobs(query);
    return NextResponse.json({
      status: 1,
      message: "Jobs retrieved successfully",
      data: { ...result, jobs: result.jobs }
    });
  } catch (error: any) {
    return NextResponse.json({ status: 0, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" && body.query.trim() ? body.query.trim() : "node";
    const result = await jobFetcherService.fetchAndStoreExternalJobs(query, true);
    return NextResponse.json({ status: 1, message: "Jobs synced successfully", data: result });
  } catch (error: any) {
    return NextResponse.json({ status: 0, message: error.message }, { status: 500 });
  }
}
