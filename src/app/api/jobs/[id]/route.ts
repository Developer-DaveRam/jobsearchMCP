import { NextResponse } from "next/server";
import { JobFetcherService } from "@/service/job-fetcher.service";

const jobFetcherService = new JobFetcherService();

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id || "0", 10);
    const body = await request.json();
    const { applicationStatus, notes } = body;
    const updated = await jobFetcherService.updateJobStatus(id, applicationStatus, notes);
    return NextResponse.json({ status: 1, message: "Job updated successfully", data: updated });
  } catch (error: any) {
    return NextResponse.json({ status: 0, message: error.message }, { status: 500 });
  }
}
