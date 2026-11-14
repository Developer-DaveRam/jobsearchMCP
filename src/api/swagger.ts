import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Job Search MCP',
    description: 'Job Search MCP APIs',
    version: '1.0.0'
  },
  host: 'localhost:5066',
  basePath: '/',
  schemes: ['http'],
  definitions: {
    Job: {
      id: 1,
      title: "Software Engineer",
      company: "Tech Corp",
      location: "Remote",
      description: "Node.js / TypeScript Developer",
      salary: "$120k",
      url: "https://example.com/job",
      source: "Remotive",
      matchScore: 92.5,
      postedAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:00:00.000Z",
      s_delete: 0
    },
    JobCreate: {
      title: "Software Engineer",
      company: "Tech Corp",
      location: "Remote",
      description: "Node.js / TypeScript Developer",
      salary: "$120k"
    },
    ApiResponse: {
      status: 1,
      message: "Success message",
      data: {}
    }
  }
};

const outputFile = './src/api/swagger-output.json';
const routes = ['./src/app.ts', './src/router/job.router.ts'];

swaggerAutogen()(outputFile, routes, doc);

