/**
 * Homepage editorial copy.
 *
 * Rule for this file: only statements that are true of the platform as built
 * (enrollment, Razorpay, dashboard, server-graded MCQ assessment, QR-verifiable
 * certificates, secure guide downloads). No statistics, testimonials, partner names,
 * placement claims, refund terms or access-duration promises: those must come from
 * Rehydria (Firestore data or reviewed copy). Program and product details are read
 * from Firestore, never from here.
 */

export const introStatement =
  "Rehydria Technology is a technology-focused company offering technical internship programs, practical learning experiences, hackathon preparation resources and professional development opportunities.";

export const pillars = [
  {
    title: "Technical internships",
    body: "Structured programs that take you from fundamentals to a finished project, module by module.",
    points: ["Clear modules and objectives", "Online assessment", "Verifiable certificate"],
    href: "/internships",
    cta: "Explore internships",
    motif: "board",
  },
  {
    title: "Practical learning",
    body: "Video lessons, notes and assignments built around real components, so every concept turns into something you can build.",
    points: ["Video lessons and notes", "Hands-on assignments", "Progress saved as you go"],
    href: "/internships",
    cta: "See how you learn",
    motif: "network",
  },
  {
    title: "Hackathon guidance",
    body: "A focused guide for ideating, planning, building and pitching when the clock is running.",
    points: ["Pick the right problem", "Plan the build", "Pitch with confidence"],
    href: "/hackathon-guide",
    cta: "Get the guide",
    motif: "wave",
  },
] as const;

/** Words cycled in the "Who we are" ticker. */
export const introTickerWords = ["Learn", "Build", "Innovate", "Compete"] as const;

export const methodology = [
  {
    step: "01",
    title: "Enroll",
    body: "Pick a program and complete a short enrollment form. Pay securely through Razorpay; your access activates as soon as the payment is verified.",
    meta: "Form · Razorpay · Instant access",
  },
  {
    step: "02",
    title: "Learn",
    body: "Work through structured modules in your dashboard: video lessons, PDF notes and reference material, with progress saved as you go.",
    meta: "Modules · Videos · Notes",
  },
  {
    step: "03",
    title: "Build",
    body: "Apply each concept in practical assignments and projects, so you understand how circuits, code and systems actually behave.",
    meta: "Assignments · Projects",
  },
  {
    step: "04",
    title: "Assess",
    body: "When you complete the course, a timed MCQ assessment unlocks. Answers are evaluated on the server and your grade is recorded instantly.",
    meta: "Timed · Auto-graded",
  },
  {
    step: "05",
    title: "Certify",
    body: "Pass and receive a certificate with a unique ID and QR code that anyone can verify online.",
    meta: "Unique ID · QR verification",
  },
] as const;

export const reasons = [
  {
    key: "curriculum",
    title: "Industry-oriented curriculum",
    body: "Programs are organised into focused modules with clear learning objectives and prerequisites, so you always know what you are building toward.",
    icon: "Layers",
    size: "wide",
  },
  {
    key: "practical",
    title: "Practical by design",
    body: "Assignments and projects follow every major concept.",
    icon: "CircuitBoard",
    size: "tall",
  },
  {
    key: "pace",
    title: "Learn at your pace",
    body: "Resume exactly where you left off. Your dashboard tracks every lesson and module.",
    icon: "Gauge",
    size: "regular",
  },
  {
    key: "assessment",
    title: "Fair, automatic assessment",
    body: "Randomised questions, a server-side timer and instant, consistent grading.",
    icon: "ListChecks",
    size: "regular",
  },
  {
    key: "certificate",
    title: "Certificates anyone can verify",
    body: "Each certificate carries a unique ID and QR code linked to a public verification page.",
    icon: "BadgeCheck",
    size: "wide",
  },
  {
    key: "payments",
    title: "Secure payments",
    body: "Checkout runs on Razorpay and every payment is verified on our servers before access is granted.",
    icon: "ShieldCheck",
    size: "regular",
  },
] as const;

/** Topics on Rehydria's program roadmap (from the company brief). Shown as "coming soon". */
export const roadmapTopics = [
  "Embedded Systems",
  "Robotics",
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Python Programming",
  "PCB Design",
  "ESP32 Programming",
  "Industrial IoT",
] as const;

export const homeFaq = [
  {
    q: "Who can join a Rehydria internship?",
    a: "Students and early-career learners interested in hands-on technology. Each program page lists its prerequisites; most launch programs start from the fundamentals.",
  },
  {
    q: "How do I enroll?",
    a: "Open a program, select Enroll Now and fill in a short form. You then pay securely through Razorpay. Course access is activated once the payment is verified, and you receive a confirmation email.",
  },
  {
    q: "Where do I access the course material?",
    a: "Everything lives in your student dashboard: modules, video lessons, PDF notes and resources, with your progress saved automatically.",
  },
  {
    q: "How does the final assessment work?",
    a: "After you complete the required lessons, a timed multiple-choice assessment unlocks. Questions are presented one at a time and answers are graded automatically on our servers.",
  },
  {
    q: "Will I receive a certificate?",
    a: "Yes. When you meet the completion requirements and pass the assessment, a certificate is issued with a unique ID and a QR code that links to its public verification page.",
  },
  {
    q: "How do I get the Hackathon Guide after buying it?",
    a: "Your purchase appears in your dashboard, where you can download the guide through a secure, time-limited link.",
  },
] as const;
