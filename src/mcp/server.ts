import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { JobFetcherService } from "../service/job-fetcher.service.js";
import { RESUME_PROFILE } from "../helper/resume-matcher.helper.js";

const jobFetcher = new JobFetcherService();
const server = new Server(
  { name: "jobsearch-mcp-server", version: "2.1.0" },
  { capabilities: { tools: {} } }
);

const textResult = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }]
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_jobs",
      description: "Search current Remotive remote job listings by keyword, then filter by freshness, location, seniority and resume fit. This connector currently searches Remotive only; it does not scrape LinkedIn, Naukri, Indeed or Glassdoor.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", minLength: 1, maxLength: 120, description: "Search term such as Node.js, TypeScript or React" } },
        required: ["query"],
        additionalProperties: false
      }
    },
    {
      name: "fetch_external_jobs",
      description: "Fetch current Node.js-focused remote listings from Remotive and rank eligible results against the resume profile.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }
    },
    {
      name: "get_matched_jobs",
      description: "Retrieve current eligible remote listings ranked by resume match score.",
      inputSchema: {
        type: "object",
        properties: { minScore: { type: "number", minimum: 0, maximum: 100, default: 60 } },
        additionalProperties: false
      }
    },
    {
      name: "update_job_application_status",
      description: "Update application status and notes for a job returned by this running MCP process. Status is currently in-memory and resets when the server restarts.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "integer", minimum: 1 },
          applicationStatus: { type: "string", enum: ["Not Applied", "Applied", "Interview", "Rejected", "Offer"] },
          notes: { type: "string", maxLength: 5000 }
        },
        required: ["id", "applicationStatus"],
        additionalProperties: false
      }
    },
    {
      name: "get_resume_profile",
      description: "Return the candidate profile and preferences used for job matching.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: rawArgs } = request.params;
  const args = (rawArgs ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case "search_jobs": {
        const query = typeof args.query === "string" ? args.query.trim() : "";
        if (!query) throw new Error("query must be a non-empty string.");
        const result = await jobFetcher.fetchAndStoreExternalJobs(query);
        return textResult({ status: "success", query, totalFound: result.jobs.length, source: "Remotive", jobs: result.jobs.slice(0, 30) });
      }

      case "fetch_external_jobs": {
        const result = await jobFetcher.fetchAndStoreExternalJobs();
        return textResult({ status: "success", source: "Remotive", fetched: result.fetched, eligible: result.saved, jobs: result.jobs.slice(0, 30) });
      }

      case "get_matched_jobs": {
        const minScore = args.minScore === undefined ? 60 : Number(args.minScore);
        if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
          throw new Error("minScore must be a number between 0 and 100.");
        }
        const jobs = (await jobFetcher.getMatchedJobsForResume()).filter(job => job.matchScore >= minScore);
        return textResult({ status: "success", totalJobs: jobs.length, minScore, jobs });
      }

      case "update_job_application_status": {
        const id = Number(args.id);
        const status = String(args.applicationStatus ?? "");
        const notes = args.notes === undefined ? undefined : String(args.notes);
        const job = await jobFetcher.updateJobStatus(id, status, notes);
        return textResult({ status: "success", job });
      }

      case "get_resume_profile":
        return textResult({ status: "success", profile: RESUME_PROFILE });

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ status: "error", message }) }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Job Search MCP Server v2.1 running on stdio");
}

main().catch(error => {
  console.error("Fatal MCP server error:", error);
  process.exitCode = 1;
});
