"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lexicalSimilarity = exports.extractTerms = exports.extractSkills = void 0;
exports.resumeToText = resumeToText;
exports.scoreResume = scoreResume;
const keywords_1 = require("./keywords");
const WEIGHTS = {
    keywords: 0.25,
    skillsMatch: 0.2,
    experienceRelevance: 0.15,
    educationRelevance: 0.05,
    impactQuality: 0.15,
    readability: 0.1,
    atsCompatibility: 0.1,
};
const STRONG_VERBS = new Set(("led built shipped launched designed architected drove increased reduced grew scaled " +
    "delivered improved optimized automated created developed implemented migrated owned " +
    "spearheaded negotiated managed mentored founded established streamlined accelerated " +
    "generated saved cut transformed pioneered orchestrated achieved won secured raised").split(/\s+/));
const WEAK_PHRASES = [
    "responsible for",
    "worked on",
    "helped with",
    "assisted in",
    "duties included",
    "tasked with",
    "involved in",
    "participated in",
    "familiar with",
];
function resumeToText(r) {
    const parts = [];
    if (r.basics.headline)
        parts.push(r.basics.headline);
    if (r.summary)
        parts.push(r.summary);
    for (const e of r.experience) {
        parts.push(`${e.title} ${e.company}`);
        parts.push(...e.bullets);
    }
    for (const ed of r.education)
        parts.push(`${ed.degree ?? ""} ${ed.field ?? ""} ${ed.school}`);
    for (const p of r.projects ?? []) {
        parts.push(p.name);
        parts.push(...p.bullets);
    }
    parts.push(r.skills.join(" "));
    const certText = (r.certifications ?? [])
        .map(c => (typeof c === "string" ? c : [c.name, c.issuer].filter(Boolean).join(" ")))
        .join(" ");
    if (certText)
        parts.push(certText);
    const langText = (r.languages ?? [])
        .map(l => (typeof l === "string" ? l : l.language))
        .join(" ");
    if (langText)
        parts.push(langText);
    for (const v of r.volunteer ?? []) {
        parts.push(`${v.role} ${v.organization}`);
        parts.push(...v.bullets);
    }
    for (const a of r.awards ?? []) {
        parts.push(a.title);
        if (a.description)
            parts.push(a.description);
    }
    return parts.join("\n");
}
function clamp(n, lo = 0, hi = 100) {
    return Math.max(lo, Math.min(hi, Math.round(n)));
}
function scoreKeywords(resumeText, jd) {
    const jdTerms = (0, keywords_1.extractTerms)(jd, 30);
    const resumeNorm = (0, keywords_1.normalize)(resumeText);
    const resumeTokens = new Set((0, keywords_1.tokenize)(resumeText));
    const matched = [];
    const missing = [];
    let matchedWeight = 0;
    let totalWeight = 0;
    for (const t of jdTerms) {
        totalWeight += t.weight;
        const hit = t.term.includes(" ")
            ? resumeNorm.includes(t.term)
            : resumeTokens.has(t.term) || resumeNorm.includes(t.term);
        if (hit) {
            matched.push(t.term);
            matchedWeight += t.weight;
        }
        else {
            missing.push(t.term);
        }
    }
    const coverage = totalWeight === 0 ? 1 : matchedWeight / totalWeight;
    return {
        sub: {
            score: clamp(coverage * 100),
            weight: WEIGHTS.keywords,
            details: [
                `${matched.length}/${jdTerms.length} weighted keywords from the job description appear in the resume.`,
            ],
        },
        matched,
        missing: missing.slice(0, 15),
    };
}
function scoreSkillsMatch(resume, jd) {
    const jdSkills = [...new Set((0, keywords_1.extractSkills)(jd))];
    const resumeSkillText = [resumeToText(resume)].join(" ");
    const resumeSkills = new Set([
        ...resume.skills.map((s) => (0, keywords_1.normalize)(s)),
        ...(0, keywords_1.extractSkills)(resumeSkillText),
    ]);
    if (jdSkills.length === 0) {
        return {
            sub: { score: 70, weight: WEIGHTS.skillsMatch, details: ["No recognizable hard skills found in the job description."] },
            missingSkills: [],
        };
    }
    const matched = jdSkills.filter((s) => resumeSkills.has(s) || (0, keywords_1.normalize)(resumeSkillText).includes(s));
    const missing = jdSkills.filter((s) => !matched.includes(s));
    return {
        sub: {
            score: clamp((matched.length / jdSkills.length) * 100),
            weight: WEIGHTS.skillsMatch,
            details: [`Matched ${matched.length} of ${jdSkills.length} skills required by the job.`],
        },
        missingSkills: missing,
    };
}
function scoreExperienceRelevance(resume, jd) {
    const expText = resume.experience
        .map((e) => `${e.title} ${e.company} ${e.bullets.join(" ")}`)
        .join("\n");
    const sim = (0, keywords_1.lexicalSimilarity)(expText, jd); // 0..1, typical good match ~0.25-0.5
    const score = clamp((sim / 0.45) * 100);
    return {
        score,
        weight: WEIGHTS.experienceRelevance,
        details: [
            score >= 70
                ? "Work history language closely mirrors the job description."
                : "Work history could mirror the job description's language more closely.",
        ],
    };
}
function scoreEducationRelevance(resume, jd) {
    const jdNorm = (0, keywords_1.normalize)(jd);
    const wantsDegree = /\b(degree|bachelor|master|phd|bs|ms|mba)\b/.test(jdNorm);
    if (!wantsDegree) {
        return { score: 100, weight: WEIGHTS.educationRelevance, details: ["Job does not emphasize formal education."] };
    }
    if (resume.education.length === 0) {
        return { score: 30, weight: WEIGHTS.educationRelevance, details: ["Job mentions a degree but the resume lists no education."] };
    }
    const eduText = resume.education.map((e) => `${e.degree ?? ""} ${e.field ?? ""}`).join(" ");
    const sim = (0, keywords_1.lexicalSimilarity)(eduText, jd);
    return {
        score: clamp(60 + sim * 200),
        weight: WEIGHTS.educationRelevance,
        details: ["Education section present; relevance estimated against the job's field."],
    };
}
function scoreImpactQuality(resume) {
    const bullets = [
        ...resume.experience.flatMap((e) => e.bullets),
        ...(resume.projects ?? []).flatMap((p) => p.bullets),
    ];
    if (bullets.length === 0) {
        return { score: 20, weight: WEIGHTS.impactQuality, details: ["No experience bullets found."] };
    }
    let quantified = 0;
    let strongStart = 0;
    let weak = 0;
    for (const b of bullets) {
        if (/\d|%|\$/.test(b))
            quantified++;
        const first = (0, keywords_1.normalize)(b).split(" ")[0] ?? "";
        if (STRONG_VERBS.has(first))
            strongStart++;
        if (WEAK_PHRASES.some((w) => b.toLowerCase().includes(w)))
            weak++;
    }
    const qRatio = quantified / bullets.length;
    const sRatio = strongStart / bullets.length;
    const wPenalty = (weak / bullets.length) * 30;
    const score = clamp(qRatio * 55 + sRatio * 45 - wPenalty + 15);
    const details = [];
    details.push(`${quantified}/${bullets.length} bullets include numbers, % or $ (aim for 60%+).`);
    if (sRatio < 0.6)
        details.push("Start more bullets with strong action verbs (Led, Built, Reduced…).");
    if (weak > 0)
        details.push(`Remove weak phrasing like "responsible for" (${weak} found).`);
    return { score, weight: WEIGHTS.impactQuality, details };
}
function scoreReadability(resume) {
    const bullets = resume.experience.flatMap((e) => e.bullets);
    const details = [];
    let score = 100;
    const tooLong = bullets.filter((b) => b.split(/\s+/).length > 32).length;
    if (tooLong > 0) {
        score -= Math.min(25, tooLong * 6);
        details.push(`${tooLong} bullets exceed ~32 words; tighten them for recruiter skimming.`);
    }
    if (resume.summary && resume.summary.split(/\s+/).length > 70) {
        score -= 10;
        details.push("Summary is long; aim for 2–3 punchy lines.");
    }
    const totalWords = (0, keywords_1.tokenize)(resumeToText(resume)).length;
    if (totalWords > 900) {
        score -= 15;
        details.push("Resume is dense; likely exceeds two pages.");
    }
    else if (totalWords < 120) {
        score -= 20;
        details.push("Resume is thin; add detail to experience bullets.");
    }
    if (details.length === 0)
        details.push("Length and bullet structure are recruiter-friendly.");
    return { score: clamp(score), weight: WEIGHTS.readability, details };
}
function scoreAtsCompatibility(resume) {
    const details = [];
    let score = 100;
    if (!resume.basics.email) {
        score -= 20;
        details.push("Missing email address — ATS parsers key on contact info.");
    }
    if (!resume.basics.phone) {
        score -= 5;
        details.push("Missing phone number.");
    }
    if (resume.experience.length === 0) {
        score -= 30;
        details.push("No work experience section detected.");
    }
    if (resume.skills.length === 0) {
        score -= 15;
        details.push("No dedicated skills section — most ATS keyword filters read this first.");
    }
    const missingDates = resume.experience.filter((e) => !e.start).length;
    if (missingDates > 0) {
        score -= 10;
        details.push(`${missingDates} roles missing start dates — ATS systems compute tenure from dates.`);
    }
    if (details.length === 0)
        details.push("Structure parses cleanly: contact info, dated experience, and a skills section.");
    return { score: clamp(score), weight: WEIGHTS.atsCompatibility, details };
}
function scoreResume(resume, jobDescription) {
    const resumeText = resumeToText(resume);
    const jd = jobDescription?.trim() || "";
    const kw = jd ? scoreKeywords(resumeText, jd) : null;
    const sk = jd ? scoreSkillsMatch(resume, jd) : null;
    const breakdown = {
        keywords: kw?.sub ?? { score: 70, weight: WEIGHTS.keywords, details: ["Add a job description to score keyword coverage."] },
        skillsMatch: sk?.sub ?? { score: 70, weight: WEIGHTS.skillsMatch, details: ["Add a job description to score skills match."] },
        experienceRelevance: jd
            ? scoreExperienceRelevance(resume, jd)
            : { score: 70, weight: WEIGHTS.experienceRelevance, details: ["No job description provided."] },
        educationRelevance: jd
            ? scoreEducationRelevance(resume, jd)
            : { score: 100, weight: WEIGHTS.educationRelevance, details: ["No job description provided."] },
        impactQuality: scoreImpactQuality(resume),
        readability: scoreReadability(resume),
        atsCompatibility: scoreAtsCompatibility(resume),
    };
    const overall = clamp(Object.values(breakdown).reduce((s, b) => s + b.score * b.weight, 0));
    const suggestions = [];
    for (const sub of Object.values(breakdown)) {
        if (sub.score < 75)
            suggestions.push(...sub.details);
    }
    if (kw && kw.missing.length > 0) {
        suggestions.push(`Work these job-description terms into your bullets where true: ${kw.missing.slice(0, 8).join(", ")}.`);
    }
    if (sk && sk.missingSkills.length > 0) {
        suggestions.push(`Missing skills the employer asks for: ${sk.missingSkills.join(", ")}.`);
    }
    return {
        overall,
        breakdown,
        matchedKeywords: kw?.matched ?? [],
        missingKeywords: [...new Set([...(kw?.missing ?? []), ...(sk?.missingSkills ?? [])])],
        suggestions: [...new Set(suggestions)],
    };
}
__exportStar(require("./types"), exports);
var keywords_2 = require("./keywords");
Object.defineProperty(exports, "extractSkills", { enumerable: true, get: function () { return keywords_2.extractSkills; } });
Object.defineProperty(exports, "extractTerms", { enumerable: true, get: function () { return keywords_2.extractTerms; } });
Object.defineProperty(exports, "lexicalSimilarity", { enumerable: true, get: function () { return keywords_2.lexicalSimilarity; } });
