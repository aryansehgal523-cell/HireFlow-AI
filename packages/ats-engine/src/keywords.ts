// Keyword extraction for ATS comparison.
// Strategy: normalize -> tokenize -> unigrams + bigrams/trigrams -> filter stopwords
// -> weight by frequency and position -> map known skill aliases to canonical slugs.

const STOPWORDS = new Set(
  (
    "a an and are as at be by for from has have he her his i in is it its " +
    "of on or our she that the their them they this to was we were will with you your " +
    "about across after all also am any been but can did do does doing down during each few " +
    "more most must my no nor not now off once only other out over own same so some such " +
    "than then there these those through too under until up very what when where which while who whom why " +
    "ability able strong excellent good great work working team teams role position company candidate " +
    "experience experiences responsibilities requirements qualifications preferred required years year " +
    "including include includes etc plus new join us looking seeking ideal day days week per month"
  ).split(/\s+/)
);

// Canonical skill dictionary with aliases. In production this is seeded into
// Postgres and extended over time; this in-code set covers the high-traffic terms.
const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["javascript", "js", "es6", "ecmascript"],
  typescript: ["typescript", "ts"],
  react: ["react", "reactjs", "react.js"],
  "next.js": ["next.js", "nextjs", "next js"],
  "node.js": ["node.js", "nodejs", "node js", "node"],
  python: ["python", "python3"],
  java: ["java"],
  golang: ["golang", "go"],
  rust: ["rust"],
  "c++": ["c++", "cpp"],
  "c#": ["c#", "csharp", ".net", "dotnet"],
  sql: ["sql", "postgresql", "postgres", "mysql", "sql server", "tsql"],
  nosql: ["nosql", "mongodb", "dynamodb", "cassandra"],
  redis: ["redis"],
  graphql: ["graphql"],
  rest: ["rest", "restful", "rest api", "rest apis"],
  aws: ["aws", "amazon web services", "ec2", "s3", "lambda"],
  gcp: ["gcp", "google cloud", "google cloud platform"],
  azure: ["azure", "microsoft azure"],
  docker: ["docker", "containers", "containerization"],
  kubernetes: ["kubernetes", "k8s"],
  terraform: ["terraform", "infrastructure as code", "iac"],
  "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous delivery", "github actions", "jenkins"],
  git: ["git", "github", "gitlab", "version control"],
  linux: ["linux", "unix"],
  kafka: ["kafka", "event streaming"],
  spark: ["spark", "apache spark", "pyspark"],
  airflow: ["airflow"],
  "machine learning": ["machine learning", "ml", "deep learning", "neural networks"],
  nlp: ["nlp", "natural language processing"],
  llm: ["llm", "llms", "large language models", "generative ai", "genai"],
  pytorch: ["pytorch", "torch"],
  tensorflow: ["tensorflow", "tf"],
  pandas: ["pandas"],
  "data analysis": ["data analysis", "data analytics", "analytics"],
  tableau: ["tableau"],
  "power bi": ["power bi", "powerbi"],
  excel: ["excel", "microsoft excel", "spreadsheets"],
  figma: ["figma"],
  "ui/ux": ["ui/ux", "ux", "ui", "user experience", "user interface", "product design"],
  agile: ["agile", "scrum", "kanban", "sprint planning"],
  jira: ["jira"],
  "project management": ["project management", "program management", "pmp"],
  "product management": ["product management", "product strategy", "roadmap", "roadmapping"],
  "stakeholder management": ["stakeholder management", "stakeholders", "cross-functional"],
  leadership: ["leadership", "team leadership", "mentoring", "mentorship", "people management"],
  communication: ["communication", "presentation", "public speaking", "written communication"],
  marketing: ["marketing", "digital marketing", "growth marketing"],
  seo: ["seo", "search engine optimization"],
  sales: ["sales", "business development", "bd"],
  "customer success": ["customer success", "account management", "client relations"],
  finance: ["finance", "financial analysis", "financial modeling", "fp&a"],
  accounting: ["accounting", "gaap", "bookkeeping"],
  microservices: ["microservices", "distributed systems", "service oriented"],
  testing: ["testing", "unit testing", "tdd", "jest", "pytest", "qa", "quality assurance"],
  security: ["security", "appsec", "owasp", "penetration testing", "infosec"],
  api: ["api", "apis", "api design", "api development"],
  stripe: ["stripe", "payments", "billing"],
  websockets: ["websockets", "real-time", "realtime"],
};

const ALIAS_TO_SKILL = new Map<string, string>();
for (const [skill, aliases] of Object.entries(SKILL_ALIASES)) {
  for (const a of aliases) ALIAS_TO_SKILL.set(a, skill);
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9+#./&\- ]+/g, " ")
    .replace(/\.(?=\s|$)/g, " ") // drop sentence-ending periods ("Node.js." -> "node.js")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function ngrams(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + n <= tokens.length; i++) out.push(tokens.slice(i, i + n).join(" "));
  return out;
}

export interface WeightedTerm {
  term: string; // canonical skill slug or raw term
  weight: number; // importance in the source document
  isSkill: boolean;
}

/**
 * Extract weighted terms from text. Skills (via dictionary) get boosted weight;
 * terms appearing earlier in a job description (title/requirements usually first)
 * get a positional boost.
 */
export function extractTerms(text: string, topN = 40): WeightedTerm[] {
  const norm = normalize(text);
  const rawTokens = norm.split(" ").filter(Boolean);
  const tokens = rawTokens.filter((t) => !STOPWORDS.has(t) && t.length > 1);

  const counts = new Map<string, { count: number; firstPos: number; isSkill: boolean }>();
  const add = (term: string, pos: number, isSkill: boolean) => {
    const cur = counts.get(term);
    if (cur) cur.count += 1;
    else counts.set(term, { count: 1, firstPos: pos, isSkill });
  };

  // Multi-word skill aliases matched against the normalized string
  for (const [alias, skill] of ALIAS_TO_SKILL) {
    if (!alias.includes(" ")) continue;
    let idx = norm.indexOf(alias);
    while (idx !== -1) {
      add(skill, idx / Math.max(norm.length, 1) * tokens.length, true);
      idx = norm.indexOf(alias, idx + alias.length);
    }
  }

  // Unigrams (mapped to canonical skill if alias)
  tokens.forEach((tok, i) => {
    const skill = ALIAS_TO_SKILL.get(tok);
    if (skill) add(skill, i, true);
    else add(tok, i, false);
  });

  // Bigrams that look like meaningful phrases (both words content words)
  for (const bg of ngrams(tokens, 2)) {
    const skill = ALIAS_TO_SKILL.get(bg);
    if (skill) add(skill, 0, true);
  }

  const total = tokens.length || 1;
  const terms: WeightedTerm[] = [];
  for (const [term, { count, firstPos, isSkill }] of counts) {
    const tf = count / total;
    const positional = 1 + 0.5 * (1 - Math.min(firstPos / total, 1)); // earlier = up to 1.5x
    const skillBoost = isSkill ? 2.5 : 1;
    terms.push({ term, isSkill, weight: tf * positional * skillBoost });
  }

  terms.sort((a, b) => b.weight - a.weight);
  return terms.slice(0, topN);
}

export function extractSkills(text: string): string[] {
  return extractTerms(text, 60)
    .filter((t) => t.isSkill)
    .map((t) => t.term);
}

/** Cosine similarity between two term-frequency vectors (lexical semantic baseline). */
export function lexicalSimilarity(a: string, b: string): number {
  const va = new Map<string, number>();
  const vb = new Map<string, number>();
  for (const t of tokenize(a)) va.set(t, (va.get(t) ?? 0) + 1);
  for (const t of tokenize(b)) vb.set(t, (vb.get(t) ?? 0) + 1);
  let dot = 0;
  for (const [t, c] of va) dot += c * (vb.get(t) ?? 0);
  const mag = (m: Map<string, number>) =>
    Math.sqrt([...m.values()].reduce((s, c) => s + c * c, 0));
  const denom = mag(va) * mag(vb);
  return denom === 0 ? 0 : dot / denom;
}
