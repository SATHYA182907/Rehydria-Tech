/** Central route map, so links and guards never drift from the folder structure. */
export const routes = {
  home: "/",
  about: "/about",
  internships: "/internships",
  internship: (slug: string) => `/internships/${slug}`,
  hackathonGuide: "/hackathon-guide",
  contact: "/contact",
  faq: "/faq",
  login: "/login",
  register: "/register",
  /** Enrollment application (creates the account if needed), optionally for one course. */
  enroll: (courseSlug?: string) => (courseSlug ? `/enroll?course=${encodeURIComponent(courseSlug)}` : "/enroll"),
  verify: (certificateId: string) => `/verify/${certificateId}`,
  dashboard: {
    root: "/dashboard",
    courses: "/dashboard/courses",
    course: (courseId: string) => `/dashboard/courses/${courseId}`,
    assessment: (courseId: string) => `/dashboard/courses/${courseId}/assessment`,
    certificates: "/dashboard/certificates",
    settings: "/dashboard/settings",
  },
  admin: {
    root: "/admin",
    students: "/admin/students",
    courses: "/admin/courses",
    modules: "/admin/modules",
    lessons: "/admin/lessons",
    enrollments: "/admin/enrollments",
    assessments: "/admin/assessments",
    questions: "/admin/questions",
    results: "/admin/results",
    certificates: "/admin/certificates",
    payments: "/admin/payments",
    products: "/admin/products",
    settings: "/admin/settings",
  },
} as const;

/** Prefixes that require a session cookie (optimistic check in proxy.ts). */
export const PROTECTED_PREFIXES = ["/dashboard", "/admin"] as const;
export const SESSION_COOKIE_NAME = "__session";
