/**
 * ─────────────────────────────────────────────────────────────
 *  ALL PORTFOLIO CONTENT LIVES HERE.
 *  Edit this file only — every section reads from it.
 *  Source of truth: Ankit_Kumar_Das_CV.pdf
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Ankit Kumar Das",
  firstName: "Ankit",
  lastName: "Kumar Das",
  role: "AI/ML Engineer",
  location: "Noida, India",
  origin: "Kolkata",
  timezone: "Asia/Kolkata",
  available: true, // shows the "Open to new roles" status in the nav
  availabilityLabel: "Open to new roles",
  // Shown in About only while `available` is true
  lookingFor: "AI/ML & GenAI engineering roles — remote, Kolkata or Delhi NCR",

  // Rotating lines under the name in the hero
  roles: [
    "AI/ML Engineer",
    "Agentic & multi-agent AI",
    "RAG & LLM systems",
    "AI for cybersecurity",
  ],

  intro:
    "AI/ML engineer with 2+ years shipping production generative and agentic AI — security agents, multi-agent coding systems, and retrieval that respects who is allowed to see what.",

  about:
    "I started in the lab, not the terminal. A BSc in Biotechnology and an MSc in Bioinformatics taught me to treat messy data with suspicion and to test every claim. At Amity University that became deep-learning research and a Springer Best Research Paper award. Now at TurtleNeck Systems I build LLM systems for security — malware detection, vulnerability scanning and an autonomous testing agent — that help defenders find problems before anyone else does.",

  email: "ankitkumardas701@gmail.com",

  links: [
    { label: "GitHub", href: "https://github.com/iGNI3" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ankit-kumar-das-8a8b89209" },
    // Drop your CV into /public as cv.pdf, then set hidden: false
    { label: "Résumé", href: "/cv.pdf", hidden: true },
  ] as { label: string; href: string; hidden?: boolean }[],
};

export type Metric = { value: string; label: string };

export type Project = {
  slug: string;
  index: string;
  title: string;
  kicker: string;
  year: string;
  role: string;
  summary: string;
  metrics?: Metric[];
  points: string[];
  stack: string[];
  link?: { label: string; href: string };
  live?: { label: string; href: string };
  note?: string;
  visual:
    | { kind: "grid" }
    | { kind: "scan" }
    | { kind: "swarm" }
    | { kind: "codescan" }
    | { kind: "pipeline"; label: string; steps: { label: string; sub: string }[] }
    | { kind: "stat"; value: number; prefix?: string; suffix?: string; caption: string }
    | { kind: "code" };
  hidden?: boolean;
};

export const projects: Project[] = [
  {
    slug: "prahar",
    index: "01",
    title: "Prahar AI",
    kicker: "Autonomous AI security-testing agent",
    year: "2025 — now",
    role: "Built at TurtleNeck Systems",
    summary:
      "An agentic system that runs authorised security assessments end to end on local LLMs, so testers spend their time on judgement instead of repetition.",
    metrics: [
      { value: "−40%", label: "manual testing time" },
      { value: "Local", label: "LLMs + RAG" },
    ],
    points: [
      "Async tool orchestration streamed over FastAPI WebSockets",
      "React/TypeScript console with live terminal and real-time visualisation",
    ],
    stack: ["Python", "Local LLMs", "RAG", "FastAPI", "WebSockets", "React", "TypeScript"],
    note: "Private to TurtleNeck — demo on request.",
    visual: { kind: "scan" },
  },
  {
    slug: "refacto-ai",
    index: "02",
    title: "RefactoAI",
    kicker: "Multi-agent autonomous coding platform",
    year: "2025",
    role: "Personal project",
    summary:
      "Five agents — Planner, Architect, Coder, Reviewer, QA. The Planner emits a JSON task DAG that an asyncio orchestrator runs in parallel, with human-in-the-loop approval. Ships as a React 19 + Electron desktop app and a VS Code extension.",
    metrics: [
      { value: "5", label: "specialised agents" },
      { value: "7", label: "LLM providers routed" },
      { value: "120", label: "max lines per patch" },
    ],
    points: [
      "DAG orchestrator with 300-second task timeouts and deadlock detection",
      "Patches capped at 120 changed lines, with syntax check and auto-rollback",
      "Code-aware RAG: tree-sitter AST chunking into LanceDB, 384-d embeddings",
    ],
    stack: ["LangChain", "MCP", "tree-sitter", "LanceDB", "FastAPI", "asyncio", "React 19", "Electron", "VS Code extension"],
    link: { label: "GitHub", href: "https://github.com/iGNI3/RefactoAI" },
    visual: { kind: "swarm" },
  },
  {
    slug: "rag-assistant",
    index: "03",
    title: "Enterprise RAG",
    kicker: "Knowledge assistant with role-based access",
    year: "2026",
    role: "Design, build & deploy",
    summary:
      "Answers from your own documents with page-level citations. Retrieved chunks are filtered by the user's role before the prompt is built, so restricted content never reaches the LLM.",
    metrics: [
      { value: "Top-6", label: "grounded chunks" },
      { value: "1,200/200", label: "chunk / overlap (chars)" },
    ],
    points: [
      "Over-fetches ~5× top-k, then drops chunks the user's role can't see before prompting",
      "JWT auth, rate limiting, prompt-injection guardrails, latency and token metrics",
    ],
    stack: ["Gemini 2.5 Flash", "ChromaDB", "FastAPI", "PostgreSQL", "JWT", "Docker", "React"],
    link: { label: "GitHub", href: "https://github.com/iGNI3/personalize-RAG-assistance" },
    live: { label: "Live demo", href: "https://personalize-rag-assistance.vercel.app/login" },
    visual: {
      kind: "pipeline",
      label: "Retrieval pipeline from upload to answer",
      steps: [
        { label: "Upload", sub: "PDF · DOCX" },
        { label: "Chunk", sub: "recursive + overlap" },
        { label: "Embed", sub: "Gemini" },
        { label: "ChromaDB", sub: "cosine search" },
        { label: "Retrieve", sub: "~5× top-k, role filter" },
        { label: "Answer", sub: "cited response" },
      ],
    },
  },
  {
    slug: "vuln-scanner",
    index: "04",
    title: "Vulnerability Scanner",
    kicker: "Three-stage ML code-vulnerability detection",
    year: "2025 — now",
    role: "Built at TurtleNeck Systems",
    summary:
      "UniXCoder and GraphCodeBERT in a three-stage pipeline with calibrated per-CWE thresholds, mapped to OWASP Top 10 and NVD.",
    metrics: [
      { value: "82%", label: "CVE coverage" },
      { value: "−20%", label: "false positives" },
      { value: "<15 min", label: "for 4,500+ files" },
    ],
    points: ["Per-CWE threshold calibration to cut false positives", "OWASP Top 10 and NVD mapping on every finding"],
    stack: ["PyTorch", "UniXCoder", "GraphCodeBERT", "Python", "NVD", "OWASP"],
    note: "Private to TurtleNeck.",
    visual: { kind: "codescan" },
  },
  {
    slug: "research",
    index: "05",
    title: "Gesture Recognition",
    kicker: "Attention-based deep learning on multi-sensor data",
    year: "2024 — 25",
    role: "AI Research Engineer, Amity University",
    summary:
      "Deep-learning pipeline on 20,000+ multi-sensor physiotherapy records. Published in Springer CCIS; Best Research Paper at AI4S 2024.",
    metrics: [
      { value: "+30%", label: "Bayesian active learning" },
      { value: "+40%", label: "data via GAN synthesis" },
    ],
    points: ["Attention architectures and transfer learning across 10 multi-label classes"],
    stack: ["PyTorch", "TensorFlow", "Attention", "GANs", "Bayesian DL", "Active learning"],
    link: { label: "Paper (DOI)", href: "https://doi.org/10.1007/978-3-031-81369-6_10" },
    visual: { kind: "stat", value: 98, suffix: "%", caption: "accuracy across 10 activity classes" },
  },
  {
    slug: "portfolio",
    index: "06",
    title: "This site",
    kicker: "Motion-first portfolio",
    year: "2026",
    role: "Design & code",
    summary: "One content file, typed components, motion that respects reduced-motion settings.",
    points: ["Lenis synced to the GSAP ticker", "Liquid-glass nav and ⌘K command menu"],
    stack: ["Next.js", "TypeScript", "GSAP", "anime.js", "Motion", "Tailwind"],
    visual: { kind: "code" },
    hidden: true, // set false to show it in the reel
  },
];

/** Compact list under the reel. Leave `link` out until the repo URL is ready. */
export type MoreProject = {
  title: string;
  kicker: string;
  summary: string;
  stack: string[];
  link?: { label: string; href: string };
  live?: { label: string; href: string };
};

export const moreProjects: MoreProject[] = [
  {
    title: "RAG Knowledge Assistant",
    kicker: "Chat with your documents, with role-based access",
    summary:
      "Upload PDFs and DOCX, ask questions, get answers with page-level citations. Role filtering runs before the prompt is built, with JWT login, Google sign-in and guest mode.",
    stack: ["Gemini 2.5 Flash", "ChromaDB", "FastAPI", "PostgreSQL", "React"],
    link: { label: "GitHub", href: "https://github.com/iGNI3/personalize-RAG-assistance" },
    live: { label: "Live demo", href: "https://personalize-rag-assistance.vercel.app/login" },
  },
  {
    title: "Agent DocX Builder",
    kicker: "Self-reflective document-generation agent",
    summary:
      "Plan, write, reflect, render: Pydantic-validated outputs and an LLM-as-critic pass before DOCX rendering. Six LLM providers with auto-fallback.",
    stack: ["Pydantic", "FastAPI", "Groq", "OpenAI", "Gemini", "Claude"],
    link: { label: "GitHub", href: "https://github.com/iGNI3/DocGenerator" },
    live: { label: "Live demo", href: "https://docxgenerator-iota.vercel.app/" },
  },
  {
    title: "AI CRM Assistant for Odoo",
    kicker: "Human-approved lead assistant",
    summary:
      "Gemini lead summaries and next-step recommendations. A human approves before anything is created in Odoo; JWT company-scoped access and an audit log.",
    stack: ["Gemini", "Odoo", "JWT"],
    // link: { label: "GitHub", href: "" }, // TODO: add repo URL
  },
  {
    title: "repo-agent",
    kicker: "CLI multi-agent coder, the earlier version of RefactoAI",
    summary: "FAISS code search and a pytest self-correction loop with a circuit breaker.",
    stack: ["FAISS", "pytest", "CLI"],
    // link: { label: "GitHub", href: "" }, // TODO: add repo URL
  },
];

export type Role = {
  org: string;
  title: string;
  period: string;
  place: string;
  points: string[];
  link?: { label: string; href: string };
};

export const experience: Role[] = [
  {
    org: "TurtleNeck Systems & Solutions",
    title: "AI/ML Engineer",
    period: "Aug 2025 — Present",
    place: "Noida",
    points: [
      "Real-time LLM-powered fileless-malware detection over 1,000+ security logs per window on OpenSearch — 92% detection accuracy.",
      "Three-stage ML vulnerability pipeline (UniXCoder + GraphCodeBERT): 82% CVE coverage across 139 CWE types, 20% fewer false positives, 4,500+ files in under 15 minutes.",
      "Engineered Prahar, an autonomous AI security-testing agent on local LLMs and RAG — 40% less manual testing time.",
    ],
  },
  {
    org: "Amity University",
    title: "AI Research Engineer",
    period: "Jun 2024 — Aug 2025",
    place: "Noida",
    points: [
      "Deep-learning pipeline on 20,000+ multi-sensor physiotherapy records — 98% accuracy across 10 multi-label classes with attention and transfer learning.",
      "Bayesian deep active learning lifted classification performance by 30% on limited labelled data.",
      "GAN-based synthetic data expanded the training set by 40% and stabilised F1 on under-represented classes.",
    ],
  },
];

export const education: Role[] = [
  {
    org: "Amity University",
    title: "MSc, Bioinformatics",
    period: "Aug 2022 — Aug 2024",
    place: "Noida",
    points: ["GPA 8.71 / 10."],
  },
  {
    org: "Brainware University",
    title: "BSc, Biotechnology",
    period: "Aug 2019 — Aug 2022",
    place: "Kolkata",
    points: ["GPA 9.86 / 10."],
  },
];

export const recognition: Role[] = [
  {
    org: "Springer CCIS, vol. 2243",
    title: "Attention-Based Deep Learning for Hand Gesture Recognition Using Multi-sensor Data",
    period: "Publication · 2025",
    place: "",
    points: ["Gupta, Das & Singh."],
    link: { label: "Read on Springer (DOI)", href: "https://doi.org/10.1007/978-3-031-81369-6_10" },
  },
  {
    org: "AI4S 2024",
    title: "Springer Best Research Paper Award",
    period: "Award · 2024",
    place: "",
    points: ["For the attention-based gesture recognition paper."],
  },
  {
    org: "Amity University",
    title: "Junior Research Fellowship",
    period: "Fellowship",
    place: "Noida",
    points: ["Research fellowship at Amity University."],
  },
  {
    org: "Google · NSDC",
    title: "Certifications",
    period: "Certification",
    place: "",
    points: ["Google IT Automation with Python.", "Machine Learning (NSDC)."],
  },
];

export const capabilities: { group: string; items: string[] }[] = [
  {
    group: "Generative AI",
    items: ["RAG", "Agentic & multi-agent systems", "Tool calling · MCP", "Prompt engineering", "LLM fine-tuning", "Guardrails"],
  },
  {
    group: "Models & frameworks",
    items: ["LangChain · LangFlow", "Hugging Face Transformers", "OpenAI · Claude · Gemini", "Llama 3 · DeepSeek", "Ollama · Groq · OpenRouter"],
  },
  {
    group: "Machine learning",
    items: ["PyTorch", "TensorFlow · Keras", "scikit-learn", "Attention & transfer learning", "GANs · LSTM", "Bayesian deep learning"],
  },
  {
    group: "Data & vectors",
    items: ["ChromaDB", "FAISS", "LanceDB", "OpenSearch", "PostgreSQL", "MongoDB"],
  },
  {
    group: "Backend & ship",
    items: ["Python · FastAPI", "WebSockets · asyncio", "Pydantic · JWT · RBAC", "Docker · AWS · Linux", "React · TypeScript"],
  },
  {
    group: "Security",
    items: ["Malware detection", "Vulnerability detection", "CVE · CWE · NVD", "OWASP Top 10", "Penetration testing"],
  },
];

/**
 * OFF THE CLOCK — hobbies section.
 * Anything in [square brackets] is a placeholder: replace it with your own.
 * Photos: put JPGs in /public/photos and point `src` at them
 * (e.g. "/photos/ladakh.jpg"). Missing files show an empty frame.
 */
export const offTheClock = {
  intro: "Away from the keyboard I'm usually under a barbell or on the road — on two wheels, with a camera, somewhere new.",

  travel: {
    blurb: "I travel to reset. New places are the best debugging tool I know.",
    places: [
      { name: "Kolkata", note: "Home" },
      { name: "Noida", note: "Base" },
      { name: "[Place]", note: "[Year]" },
      { name: "[Place]", note: "[Year]" },
      { name: "[Place]", note: "[Year]" },
      { name: "[Place]", note: "[Year]" },
    ],
  },

  riding: {
    blurb: "Long rides, early starts, no notifications.",
    bike: "[Your bike]",
    totalKm: null as number | null, // e.g. 12000 — counts up when set
    rides: [
      { route: "[Start → Destination]", distance: "[000 km]" },
      { route: "[Start → Destination]", distance: "[000 km]" },
      { route: "[Start → Destination]", distance: "[000 km]" },
    ],
  },

  gym: {
    blurb: "A self-confessed gym freak. Same rule as the codebase: show up daily, add a little load, never skip legs.",
    split: "[Your split, e.g. Push · Pull · Legs]", // TODO
  },

  photography: {
    blurb: "Mostly roads, light and people. Drag the prints around.",
    gear: "[Camera / phone]",
    photos: [
      { src: "/photos/01.jpg", caption: "[Place, year]" },
      { src: "/photos/02.jpg", caption: "[Place, year]" },
      { src: "/photos/03.jpg", caption: "[Place, year]" },
      { src: "/photos/04.jpg", caption: "[Place, year]" },
      { src: "/photos/05.jpg", caption: "[Place, year]" },
    ],
  },
};

export type MotifName = "radar" | "graph" | "ingest" | "select" | "gate" | "report" | "split" | "wave";
export type FlowStep = { label: string; body: string; motif: MotifName };
export type CaseStudy = {
  overview: string;
  layout: "orbit" | "fork" | "funnel" | "conveyor" | "scurve";
  stackGroups: { group: string; items: string[] }[];
  flow: FlowStep[];
};

/**
 * Deep-dive content shown when a project is expanded into its 3D case study.
 * Keyed by project slug. Prahar stays high-level and non-operational.
 */
export const caseStudies: Record<string, CaseStudy> = {
  prahar: {
    overview:
      "Prahar runs an authorised security assessment the way a careful tester would, but without the repetition. It plans the engagement, works through each phase on local LLMs so nothing sensitive leaves the network, keeps a human in the loop for anything consequential, and writes up what it found. The flow below is the loop it runs, at a high level.",
    layout: "orbit",
    stackGroups: [
      { group: "Core", items: ["Python", "Local LLMs (Ollama / vLLM)", "RAG"] },
      { group: "Orchestration", items: ["asyncio", "Async tool calls", "Structured tool schemas"] },
      { group: "Realtime", items: ["FastAPI", "WebSockets"] },
      { group: "Console", items: ["React", "TypeScript", "Live terminal view"] },
    ],
    flow: [
      { label: "Recon", body: "Maps the authorised scope and gets its bearings on the target before touching anything.", motif: "radar" },
      { label: "Map surface", body: "Builds a picture of what's reachable and how the pieces connect.", motif: "graph" },
      { label: "Gather intel", body: "RAG pulls relevant context and past findings so the next step is informed, not blind.", motif: "ingest" },
      { label: "Select tools", body: "The planner picks the right tool for each step and calls it through a validated, structured schema.", motif: "select" },
      { label: "Safe checks", body: "Runs the checks inside a strict allow-list, with a human approving anything consequential.", motif: "gate" },
      { label: "Report", body: "Writes up findings with severity, evidence and remediation — the part testers actually keep.", motif: "report" },
    ],
  },
  "refacto-ai": {
    overview:
      "RefactoAI turns one coding request into a plan a team of agents executes in parallel. A planner breaks the work into a dependency graph; specialised agents build, review and test; and every change is applied as a small, reversible patch with a human approving the plan first.",
    layout: "fork",
    stackGroups: [
      { group: "Agents", items: ["Planner", "Architect", "Coder", "Reviewer", "QA"] },
      { group: "Orchestration", items: ["asyncio DAG runner", "300s task timeouts", "Deadlock detection"] },
      { group: "Code RAG", items: ["tree-sitter AST chunking", "BGE-small (384-dim)", "LanceDB"] },
      { group: "Routing", items: ["LangChain", "7 LLM providers", "MCP tool servers"] },
      { group: "App", items: ["React 19", "Electron", "VS Code extension"] },
    ],
    flow: [
      { label: "Request", body: "A single prompt describes the change the user wants made to their codebase.", motif: "ingest" },
      { label: "Plan", body: "The planner LLM emits a JSON task DAG — the work split into steps with dependencies.", motif: "graph" },
      { label: "Approve", body: "Nothing runs until the user approves the plan. Human-in-the-loop by default.", motif: "gate" },
      { label: "Branch out", body: "An asyncio orchestrator launches every independent task in parallel across the agents.", motif: "split" },
      { label: "Build & review", body: "Coder writes diffs; Reviewer and QA check them; code-aware RAG keeps everyone in context.", motif: "radar" },
      { label: "Patch", body: "Changes apply through a sandboxed engine: 120-line cap, syntax check, auto-rollback.", motif: "report" },
    ],
  },
  "rag-assistant": {
    overview:
      "An assistant that answers from your own documents with page-level citations, and enforces who can see what inside retrieval — so restricted content never reaches the model in the first place.",
    layout: "funnel",
    stackGroups: [
      { group: "LLM", items: ["Gemini 2.5 Flash", "Gemini embeddings"] },
      { group: "Retrieval", items: ["ChromaDB", "Recursive chunking 1,200/200", "Top-6 grounded"] },
      { group: "Backend", items: ["FastAPI", "PostgreSQL", "JWT + bcrypt"] },
      { group: "Ship", items: ["Docker", "Render", "React", "Vercel"] },
    ],
    flow: [
      { label: "Upload", body: "PDFs and DOCX come in; file bytes are stored so documents survive restarts.", motif: "ingest" },
      { label: "Chunk", body: "Recursive splitter, 1,200 chars with 200 overlap, keeping the page for each chunk.", motif: "split" },
      { label: "Embed", body: "Task-specific Gemini embeddings go into ChromaDB for cosine search.", motif: "graph" },
      { label: "Retrieve", body: "Over-fetch, then filter by the user's role before the prompt is ever built.", motif: "radar" },
      { label: "Answer", body: "Gemini responds with inline citations, relevance scores, latency and token counts.", motif: "report" },
    ],
  },
  "vuln-scanner": {
    overview:
      "A three-stage machine-learning pipeline that reads source code and flags likely weaknesses, calibrated per class to keep false positives down and mapped to the standards security teams already use.",
    layout: "conveyor",
    stackGroups: [
      { group: "Models", items: ["UniXCoder", "GraphCodeBERT", "Ensemble"] },
      { group: "Calibration", items: ["Per-CWE thresholds", "Temperature / Platt scaling"] },
      { group: "Enrichment", items: ["OWASP Top 10", "NVD", "CVSS severity"] },
    ],
    flow: [
      { label: "Parse", body: "Source is split into function-level units with an AST, so each sample is a real code unit.", motif: "split" },
      { label: "Detect", body: "UniXCoder and GraphCodeBERT classify each function and predict its weakness class.", motif: "radar" },
      { label: "Calibrate", body: "A separate tuned threshold per class turns scores into findings — 20% fewer false positives.", motif: "gate" },
      { label: "Enrich", body: "Findings map to OWASP Top 10 and pull CVE and severity detail from the NVD.", motif: "graph" },
      { label: "Report", body: "A ranked report: 82% coverage across 139 weakness types, 4,500+ files in under 15 minutes.", motif: "report" },
    ],
  },
  research: {
    overview:
      "Attention-based deep learning on 20,000+ multi-sensor records, with active learning and GAN-synthesised data to squeeze more out of a limited labelled set. Published in Springer CCIS and awarded Best Research Paper at AI4S 2024.",
    layout: "scurve",
    stackGroups: [
      { group: "Models", items: ["Attention architectures", "Transfer learning", "GANs"] },
      { group: "Data-efficiency", items: ["Bayesian active learning", "MC dropout", "BALD acquisition"] },
      { group: "Stack", items: ["PyTorch", "TensorFlow", "NumPy / Pandas"] },
    ],
    flow: [
      { label: "Signals", body: "20,000+ multi-sensor recordings across 10 multi-label activity classes.", motif: "wave" },
      { label: "Model", body: "Per-stream encoders feed an attention layer that learns which moments and sensors matter.", motif: "graph" },
      { label: "Active learning", body: "Bayesian uncertainty picks the most informative samples to label next — +30% with fewer labels.", motif: "select" },
      { label: "Augment", body: "A GAN synthesises realistic windows for rare classes, expanding the set by 40%.", motif: "ingest" },
      { label: "Result", body: "98% accuracy, a Springer publication, and the AI4S 2024 Best Research Paper award.", motif: "report" },
    ],
  },
};

export const nav = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Life", href: "#life" },
  { label: "Contact", href: "#contact" },
] as const;
