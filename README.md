# Job Search MCP

A personal job-search dashboard and Model Context Protocol (MCP) server.

## Current data source

The live fetcher currently uses the public **Remotive** remote-jobs API only. It does not scrape or claim to fetch individual vacancies from LinkedIn, Naukri, Indeed or Glassdoor. The old curated portal-search URLs were removed from the results because a search-results page is not a verified vacancy.

Jobs are deduplicated by their application URL and filtered using:
- A real publication date no older than seven days
- Bengaluru, Chennai or remote location
- Excluded internship, freelance, part-time and senior-role keywords
- Resume skill and role matching

A match score is a heuristic ranking aid, not a prediction of recruiter response or a guarantee of eligibility.

## Setup

```bash
npm ci
cp .env.example .env
```

The MCP server does not require the database. The database settings are used by the legacy Prisma-backed jobs API.

Generate the Prisma client before running the database-backed API:

```bash
npm run prisma:generate
```

## Run the dashboard

```bash
npm run dev
```

Open http://localhost:5066.

## Run the MCP server

Development:

```bash
npm run dev:mcp
```

Build and run:

```bash
npm run build:mcp
npm run start:mcp
```

The MCP server exposes:
- `search_jobs` — search Remotive by keyword
- `fetch_external_jobs` — refresh Node.js-focused results
- `get_matched_jobs` — list jobs above a minimum match score
- `get_resume_profile` — inspect the matching profile
- `update_job_application_status` — update local tracking status and notes

## Validation

```bash
npm run typecheck
npm test
npm run build
npm run build:mcp
```

## Important persistence limitation

Application status and notes are currently held in process memory. They reset when the relevant server process restarts and are not safe for multi-instance production deployment. Persist them in the Prisma `Job` table (with a stable external job identifier) before relying on this as a long-running production tracker.
