import test from "node:test";
import assert from "node:assert";
import { scoreResume, extractSkills } from "../dist/index.js";

const resume = {
  basics: { name: "Ada Lovelace", email: "ada@example.com", phone: "+1 555 0100" },
  summary: "Senior software engineer focused on TypeScript, React and distributed systems.",
  experience: [
    {
      company: "Acme", title: "Senior Software Engineer", start: "2021-01", end: null,
      bullets: [
        "Led migration of a Node.js monolith to microservices on AWS, reducing p95 latency 42%",
        "Built React + TypeScript design system adopted by 6 product teams",
        "Reduced CI/CD pipeline time from 30 to 8 minutes with GitHub Actions caching"
      ]
    }
  ],
  education: [{ school: "MIT", degree: "BS", field: "Computer Science", start: "2013", end: "2017" }],
  skills: ["TypeScript", "React", "Node.js", "AWS", "PostgreSQL", "Docker"],
};

const jd = `Senior Software Engineer. Requirements: 5+ years experience with TypeScript,
React, Node.js. Strong AWS and Docker experience. Kubernetes a plus. Bachelor's degree in
Computer Science preferred. You will design microservices and improve CI/CD pipelines.`;

test("extractSkills finds canonical skills in a JD", () => {
  const skills = extractSkills(jd);
  for (const s of ["typescript", "react", "node.js", "aws", "docker", "kubernetes"]) {
    assert.ok(skills.includes(s), `expected ${s} in ${skills}`);
  }
});

test("strong match scores high, missing kubernetes is surfaced", () => {
  const r = scoreResume(resume, jd);
  assert.ok(r.overall >= 70, `overall ${r.overall} should be >= 70`);
  assert.ok(r.missingKeywords.includes("kubernetes"));
});

test("weak resume scores low with actionable suggestions", () => {
  const weak = {
    basics: { name: "X" },
    experience: [{ company: "Shop", title: "Clerk", bullets: ["responsible for helping customers"] }],
    education: [],
    skills: [],
  };
  const r = scoreResume(weak, jd);
  assert.ok(r.overall < 45, `overall ${r.overall} should be < 45`);
  assert.ok(r.suggestions.length >= 3);
});

test("scoring works without a JD (general resume health)", () => {
  const r = scoreResume(resume);
  assert.ok(r.overall >= 70);
});
