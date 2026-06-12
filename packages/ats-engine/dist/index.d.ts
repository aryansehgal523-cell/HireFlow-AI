import { AtsResult, ResumeContent } from "./types";
export declare function resumeToText(r: ResumeContent): string;
export declare function scoreResume(resume: ResumeContent, jobDescription?: string): AtsResult;
export * from "./types";
export { extractSkills, extractTerms, lexicalSimilarity } from "./keywords";
