// import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import { CallToolRequestSchema,ListToolsRequestSchema,} from "@modelcontextprotocol/sdk/types.js";
// import { JobFetcherService } from "../service/job-fetcher.service.js";
// import { RESUME_PROFILE } from "../helper/resume-matcher.helper.js";

// const jobFetcherService = new JobFetcherService();

// const server = new Server(
//   {
//     name: "jobsearch-mcp-server",
//     version: "1.0.0",
//   },
//   {
//     capabilities: {
//       tools: {},
//     },
//   }
// );

// server.setRequestHandler(ListToolsRequestSchema, async () => {
//   return {
//     tools: [
//       {
//         name: "fetch_external_jobs",
//         description: "Fetch and sync live and curated job postings across LinkedIn, Naukri, Indeed, Glassdoor, Remotive, and RemoteOK matching Daveram A's Full Stack Node.js/TypeScript/React profile.",
//         inputSchema: {
//           type: "object",
//           properties: {},
//         },
//       },
//       {
//         name: "search_linkedin_jobs",
//         description: "Search LinkedIn job postings tailored to Bengaluru/Chennai Node.js/React/Full Stack roles.",
//         inputSchema: {
//           type: "object",
//           properties: {
//             keyword: { type: "string", description: "Search keyword (e.g. Node.js, React)" },
//           },
//         },
//       },
//       {
//         name: "search_naukri_jobs",
//         description: "Search Naukri job postings for Bengaluru and Chennai matching ₹6-9 LPA expectations.",
//         inputSchema: {
//           type: "object",
//           properties: {
//             role: { type: "string", description: "Job role or tech stack" },
//           },
//         },
//       },
//       {
//         name: "search_indeed_jobs",
//         description: "Search Indeed job listings for Software Engineer / Full Stack positions.",
//         inputSchema: {
//           type: "object",
//           properties: {
//             query: { type: "string", description: "Search query" },
//           },
//         },
//       },
//       {
//         name: "search_glassdoor_jobs",
//         description: "Search Glassdoor job listings for top tech companies in Bengaluru and Chennai.",
//         inputSchema: {
//           type: "object",
//           properties: {
//             query: { type: "string", description: "Search query" },
//           },
//         },
//       },
//       {
//         name: "get_matched_jobs",
//         description: "Get stored job postings ranked by match score against Daveram A's resume profile (Node.js, TypeScript, React, Docker, etc.).",
//         inputSchema: {
//           type: "object",
//           properties: {
//             minScore: {
//               type: "number",
//               description: "Minimum match score percentage (0-100)",
//             },
//           },
//         },
//       },
//       {
//         name: "update_job_application_status",
//         description: "Update application status and notes for a specific job ID.",
//         inputSchema: {
//           type: "object",
//           properties: {
//             id: { type: "number", description: "Job ID" },
//             applicationStatus: { type: "string", description: "Not Applied, Applied, Interview, Rejected, Offer" },
//             notes: { type: "string", description: "Additional notes" },
//           },
//           required: ["id", "applicationStatus"],
//         },
//       },
//       {
//         name: "get_resume_profile",
//         description: "Get Daveram A's professional profile, tech stack, and skills used for matching job postings.",
//         inputSchema: {
//           type: "object",
//           properties: {},
//         },
//       },
//     ],
//   };
// });

// server.setRequestHandler(CallToolRequestSchema, async (request) => {
//   const { name, arguments: args } = request.params;

//   try {
//     if (name === "fetch_external_jobs" || name.startsWith("search_")) {
//       const result = await jobFetcherService.fetchAndStoreExternalJobs();
//       let filteredJobs = result.jobs;
      
//       if (name === "search_linkedin_jobs") {
//         filteredJobs = result.jobs.filter(j => j.sourcePortal === "LinkedIn");
//       } else if (name === "search_naukri_jobs") {
//         filteredJobs = result.jobs.filter(j => j.sourcePortal === "Naukri");
//       } else if (name === "search_indeed_jobs") {
//         filteredJobs = result.jobs.filter(j => j.sourcePortal === "Indeed");
//       } else if (name === "search_glassdoor_jobs") {
//         filteredJobs = result.jobs.filter(j => j.sourcePortal === "Glassdoor");
//       }

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify({
//               status: "success",
//               message: `Successfully searched and retrieved jobs from ${name}.`,
//               totalFound: filteredJobs.length,
//               jobs: filteredJobs.slice(0, 15),
//             }, null, 2),
//           },
//         ],
//       };
//     }

//     if (name === "get_matched_jobs") {
//       const minScore = (args as any)?.minScore || 0;
//       const jobs = await jobFetcherService.getMatchedJobsForResume();
//       const filtered = jobs.filter((j) => (j.matchScore || 0) >= minScore);

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify({
//               status: "success",
//               totalJobs: filtered.length,
//               jobs: filtered,
//             }, null, 2),
//           },
//         ],
//       };
//     }

//     if (name === "update_job_application_status") {
//       const { id, applicationStatus, notes } = args as any;
//       const updated = await jobFetcherService.updateJobStatus(id, applicationStatus, notes);
//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify({
//               status: "success",
//               message: `Job ID ${id} status updated to ${applicationStatus}`,
//               job: updated,
//             }, null, 2),
//           },
//         ],
//       };
//     }

//     if (name === "get_resume_profile") {
//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify({
//               status: "success",
//               profile: RESUME_PROFILE,
//             }, null, 2),
//           },
//         ],
//       };
//     }

//     throw new Error(`Unknown tool: ${name}`);
//   } catch (error: any) {
//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify({
//             status: "error",
//             message: error.message,
//           }, null, 2),
//         },
//       ],
//       isError: true,
//     };
//   }
// });

// async function run() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
//   console.error("Job Search MCP Server running on stdio");
// }

// run().catch((error) => {
//   console.error("Fatal error running MCP server:", error);
//   process.exit(1);
// });



import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { JobFetcherService } from "../service/job-fetcher.service.js";

import {
  RESUME_PROFILE,
  calculateJobMatchScore,
  getJobMatchLevel,
  isEligibleJob,
} from "../helper/resume-matcher.helper.js";

const jobFetcherService = new JobFetcherService();

const server = new Server(
  {
    name: "jobsearch-mcp-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const searchTools = [
  {
    name: "search_linkedin_jobs",
    description: "Search fresh LinkedIn jobs matching Daveram's resume.",
    property: "keyword",
  },
  {
    name: "search_naukri_jobs",
    description: "Search Naukri jobs matching Node.js, TypeScript and React.",
    property: "role",
  },
  {
    name: "search_indeed_jobs",
    description: "Search Indeed full-time developer jobs.",
    property: "query",
  },
  {
    name: "search_glassdoor_jobs",
    description: "Search Glassdoor jobs, prioritizing MNC and mid-sized companies.",
    property: "query",
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "fetch_external_jobs",
        description:
          "Fetch jobs across LinkedIn, Naukri, Indeed, Glassdoor, Remotive and RemoteOK. Apply Daveram's eligibility and freshness filters.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      ...searchTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: "object",
          properties: {
            [tool.property]: {
              type: "string",
              description: "Search keyword or job role",
            },
          },
          required: [tool.property],
        },
      })),

      {
        name: "get_matched_jobs",
        description:
          "Get eligible jobs ranked by resume match percentage.",
        inputSchema: {
          type: "object",
          properties: {
            minScore: {
              type: "number",
              description: "Minimum match score, default 70.",
            },
          },
        },
      },

      {
        name: "update_job_application_status",
        description: "Update application status and notes.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            applicationStatus: {
              type: "string",
              enum: [
                "Not Applied",
                "Applied",
                "Interview",
                "Rejected",
                "Offer",
              ],
            },
            notes: { type: "string" },
          },
          required: ["id", "applicationStatus"],
        },
      },

      {
        name: "get_resume_profile",
        description: "Get the complete resume matching profile.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Normalize jobs and calculate scores
function processJobs(jobs: any[]) {
  return jobs
    .filter(isEligibleJob)
    .map(job => {
      const score = calculateJobMatchScore(
        job.title || job.jobTitle || job.role || "",
        job.description || job.jobDescription || "",
        job.location || job.jobLocation || "",
        {
          jobTitle: job.title || job.jobTitle || "",
          jobDescription: job.description || "",
          jobLocation: job.location || "",
          jobExperience: job.experience || job.experienceRequired || "",
          jobSalary: job.salary || job.salaryRange || "",
          companySize: job.companySize || job.employeeCount,
        }
      );

      return {
        ...job,
        matchScore: score,
        matchLevel: getJobMatchLevel(score),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

server.setRequestHandler(
  CallToolRequestSchema,
  async request => {
    const { name, arguments: args } = request.params;

    try {
      // Fetch and search external jobs
      if (
        name === "fetch_external_jobs" ||
        searchTools.some(tool => tool.name === name)
      ) {
        const result =
          await jobFetcherService.fetchAndStoreExternalJobs();

        let jobs = result.jobs || [];

        // Source filtering
        const selectedTool = searchTools.find(
          tool => tool.name === name
        );

        if (selectedTool) {
          const source = name.replace("search_", "")
            .replace("_jobs", "");

          jobs = jobs.filter(job =>
            String(job.sourcePortal || "")
              .toLowerCase()
              .includes(source)
          );

          // Use the actual search keyword
          const searchValue = String(
            (args as any)?.[selectedTool.property] || ""
          ).toLowerCase().trim();

          if (searchValue) {
            jobs = jobs.filter(job => {
              const searchableText = [
                job.title,
                job.jobTitle,
                job.role,
                job.description,
                job.companyName,
                job.skills,
              ]
                .flat()
                .join(" ")
                .toLowerCase();

              return searchableText.includes(searchValue);
            });
          }
        }

        const matchedJobs = processJobs(jobs);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                totalFound: matchedJobs.length,
                filtersApplied: {
                  locations: RESUME_PROFILE.preferredLocations,
                  experience: "0-2 years",
                  salary: "₹5-9 LPA preferred",
                  freshness: "Last 7 days",
                  companySize: "50+ employees",
                  employmentType: "Full-time",
                },
                jobs: matchedJobs.slice(0, 30),
              }, null, 2),
            },
          ],
        };
      }

      // Get resume-matched jobs
      if (name === "get_matched_jobs") {
        const minScore =
          (args as any)?.minScore ?? 70;

        const jobs =
          await jobFetcherService.getMatchedJobsForResume();

        const matchedJobs = processJobs(jobs || [])
          .filter(job => job.matchScore >= minScore);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                totalJobs: matchedJobs.length,
                highMatches: matchedJobs.filter(
                  j => j.matchLevel === "High"
                ).length,
                mediumMatches: matchedJobs.filter(
                  j => j.matchLevel === "Medium"
                ).length,
                lowMatches: matchedJobs.filter(
                  j => j.matchLevel === "Low"
                ).length,
                jobs: matchedJobs,
              }, null, 2),
            },
          ],
        };
      }

      // Update application status
      if (name === "update_job_application_status") {
        const { id, applicationStatus, notes } =
          args as any;

        const updated =
          await jobFetcherService.updateJobStatus(
            id,
            applicationStatus,
            notes
          );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                message: `Job ${id} updated to ${applicationStatus}`,
                job: updated,
              }, null, 2),
            },
          ],
        };
      }

      // Resume profile
      if (name === "get_resume_profile") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                profile: RESUME_PROFILE,
              }, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: error.message,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

async function run() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Job Search MCP Server v2.0 running on stdio");
}

run().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
