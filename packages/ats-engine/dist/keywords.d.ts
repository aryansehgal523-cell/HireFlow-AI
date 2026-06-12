export declare function normalize(text: string): string;
export declare function tokenize(text: string): string[];
export interface WeightedTerm {
    term: string;
    weight: number;
    isSkill: boolean;
}
/**
 * Extract weighted terms from text. Skills (via dictionary) get boosted weight;
 * terms appearing earlier in a job description (title/requirements usually first)
 * get a positional boost.
 */
export declare function extractTerms(text: string, topN?: number): WeightedTerm[];
export declare function extractSkills(text: string): string[];
/** Cosine similarity between two term-frequency vectors (lexical semantic baseline). */
export declare function lexicalSimilarity(a: string, b: string): number;
