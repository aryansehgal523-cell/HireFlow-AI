export interface ResumeContent {
    basics: {
        name: string;
        email?: string;
        phone?: string;
        location?: string;
        headline?: string;
        links?: {
            label: string;
            url: string;
        }[];
    };
    summary?: string;
    experience: {
        company: string;
        title: string;
        location?: string;
        start?: string;
        end?: string | null;
        bullets: string[];
    }[];
    education: {
        school: string;
        degree?: string;
        field?: string;
        start?: string;
        end?: string;
        gpa?: string;
        honors?: string;
    }[];
    projects?: {
        name: string;
        url?: string;
        start?: string;
        end?: string;
        bullets: string[];
    }[];
    skills: string[];
    certifications?: {
        name: string;
        issuer?: string;
        date?: string;
        url?: string;
    }[];
    languages?: {
        language: string;
        proficiency?: string;
    }[];
    volunteer?: {
        organization: string;
        role: string;
        location?: string;
        start?: string;
        end?: string;
        bullets: string[];
    }[];
    awards?: {
        title: string;
        issuer?: string;
        date?: string;
        description?: string;
    }[];
    publications?: {
        title: string;
        publisher?: string;
        date?: string;
        url?: string;
    }[];
}
export interface AtsBreakdown {
    keywords: SubScore;
    skillsMatch: SubScore;
    experienceRelevance: SubScore;
    educationRelevance: SubScore;
    impactQuality: SubScore;
    readability: SubScore;
    atsCompatibility: SubScore;
}
export interface SubScore {
    score: number;
    weight: number;
    details: string[];
}
export interface AtsResult {
    overall: number;
    breakdown: AtsBreakdown;
    missingKeywords: string[];
    matchedKeywords: string[];
    suggestions: string[];
}
