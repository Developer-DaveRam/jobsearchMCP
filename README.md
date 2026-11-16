# Job Search MCP

A personal job-search dashboard and Model Context Protocol (MCP) server.

## Free public job data sources

The live aggregator uses these public job-board APIs, without paid subscriptions or mandatory API keys:

- **Remotive** — https://remotive.com/api/remote-jobs
- **RemoteOK** — https://remoteok.com/api
- **Jobicy** — https://jobicy.com/api/jobs
- **Himalayas** — https://himalayas.app/jobs/api/search
- **Arbeitnow** — https://www.arbeitnow.com/api/job-board-api

Each provider is called independently. If one is down or rate-limited, results from the others are still returned. Listings are normalized, deduplicated by their canonical URL, filtered for the configured resume/location/freshness preferences, and ranked with a heuristic match score. Match scores are not a prediction of recruiter response.

**Attribution:** keep the source name and original listing URL visible. Himalayas requires a visible source link and use of its `applicationLink`; Jobicy and RemoteOK also require source attribution/link-back. Provider terms can change, so review them before redistributing listings or turning this into a commercial job board. The public feeds are not guaranteed to contain Bengaluru/Chennai on-site roles.

## LinkedIn, Naukri, Indeed and Glassdoor

These portals do not provide unrestricted public job-search APIs for this kind of free integration. This project does not scrape login-protected pages, bypass bot protections, or invent listings. The API response includes direct search links for these four portals so the user can search there manually. A separate authorized/partner API would be needed for automated listings.

## Setup

```bash
npm ci
cp .env.example .env
npm run prisma:generate
```

## Run the dashboard

```bash
npm run dev
```

Open http://localhost:5066.

## Run the MCP server

```bash
npm run dev:mcp
```

Build and run:

```bash
npm run build:mcp
npm run start:mcp
```

## API usage

- `POST /api/jobs` — refresh jobs; optional JSON body: `{"query":"node.js"}`
- `GET /api/jobs?q=node.js` — retrieve cached/current results
- `GET /api/jobs/stats` — dashboard counts
- Express `POST /fetch-portals` — refresh all free providers; optional `{"query":"node.js"}`
- Express `GET /matched?q=node.js` — matched jobs and provider diagnostics

The sync response includes `sources` (per-provider fetched/saved/error), `rejected` (why listings were filtered), and `portalSearchLinks` for LinkedIn, Naukri, Indeed and Glassdoor.

Application status and notes are currently stored in process memory and reset when the server restarts. Persist them in the database before relying on this as a production tracker.

## Validation

```bash
npm run typecheck
npm test
npm run build
npm run build:mcp
```
