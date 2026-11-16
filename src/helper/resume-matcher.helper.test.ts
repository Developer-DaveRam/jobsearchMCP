import test from "node:test";
import assert from "node:assert/strict";
import { calculateJobMatchScore, isEligibleJob } from "./resume-matcher.helper.js";

test("matches common Node.js, Express.js and React.js spellings", () => {
  const score = calculateJobMatchScore(
    "Node.js Backend Developer",
    "Build APIs with Express.js, React.js, TypeScript, Prisma and MySQL",
    "Bengaluru",
    { jobExperience: "2 years", jobSalary: "₹5-12 LPA" }
  );
  assert.ok(score >= 65, `expected a strong match, received ${score}`);
  assert.ok(score <= 100);
});

test("accepts a fresh remote job with a real URL and publication date", () => {
  assert.equal(isEligibleJob({
    title: "Node.js Developer",
    description: "Build REST APIs with TypeScript",
    location: "Worldwide remote",
    url: "https://example.com/jobs/123",
    publication_date: new Date().toISOString()
  }), true);
});

test("rejects jobs without a verifiable publication date", () => {
  assert.equal(isEligibleJob({
    title: "Node.js Developer",
    description: "Build APIs",
    location: "Remote",
    url: "https://example.com/jobs/123"
  }), false);
});

test("rejects internships and senior roles", () => {
  const date = new Date().toISOString();
  assert.equal(isEligibleJob({
    title: "Node.js Intern",
    description: "Internship",
    location: "Remote",
    url: "https://example.com/jobs/1",
    publication_date: date
  }), false);
  assert.equal(isEligibleJob({
    title: "Senior Node.js Developer",
    description: "Remote",
    location: "Remote",
    url: "https://example.com/jobs/2",
    publication_date: date
  }), false);
});

test("accepts India and Asia remote roles", () => {
  const date = new Date().toISOString();
  for (const location of ["India", "Asia", "Anywhere in the World"]) {
    assert.equal(isEligibleJob({
      title: "Node.js Backend Developer",
      description: "Build APIs",
      location,
      url: `https://example.com/jobs/${encodeURIComponent(location)}`,
      publication_date: date,
      job_type: "full_time"
    }), true, `expected location to be eligible: ${location}`);
  }
});

test("does not reject a role only because its description mentions contracts", () => {
  assert.equal(isEligibleJob({
    title: "Node.js Developer",
    description: "Work with customers and manage API contracts.",
    location: "India",
    url: "https://example.com/jobs/api-contracts",
    publication_date: new Date().toISOString(),
    job_type: "full_time"
  }), true);
});
