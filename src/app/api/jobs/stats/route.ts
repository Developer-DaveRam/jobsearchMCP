import { NextResponse } from "next/server";
import { JobFetcherService } from "@/service/job-fetcher.service";

const jobFetcherService = new JobFetcherService();

export async function GET() {
  try {
    const stats = await jobFetcherService.getDashboardStats();
    return NextResponse.json({ status: 1, message: "Stats retrieved successfully", data: stats });
  } catch (error: any) {
    return NextResponse.json({ status: 0, message: error.message }, { status: 500 });
  }
}
