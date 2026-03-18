export interface CoverLetterTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  title: string;
  body: string;
}

export const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: "frontend-engineer",
    label: "Frontend Engineer",
    icon: "🖥️",
    description: "React / Vue / UI role",
    title: "Frontend Engineer Application",
    body: `Dear Hiring Manager,

I am writing to express my strong interest in the Frontend Engineer position at [Company Name]. With [X] years of experience building performant, accessible web applications using React and TypeScript, I am excited by the opportunity to contribute to your product.

In my current role at [Current Company], I have:
- Architected and shipped a component library used across [X] product teams, reducing UI inconsistency by [X]%
- Improved Core Web Vitals scores (LCP, CLS, FID) through code splitting, lazy loading, and asset optimisation
- Collaborated closely with designers in Figma to ship pixel-perfect, accessible interfaces

I am particularly drawn to [Company Name] because of [specific reason — product, tech stack, engineering culture]. Your use of [React / Next.js / Vue / etc.] aligns closely with my day-to-day expertise.

I would welcome the opportunity to discuss how my frontend experience can help your team ship faster and at a higher quality bar. Thank you for your time and consideration.

Yours sincerely,
[Your Name]`,
  },
  {
    id: "backend-engineer",
    label: "Backend Engineer",
    icon: "⚙️",
    description: "API / services / infra role",
    title: "Backend Engineer Application",
    body: `Dear Hiring Manager,

I am applying for the Backend Engineer role at [Company Name]. I specialise in building reliable, scalable server-side systems and APIs, and I am drawn to the engineering challenges your team is working on.

Highlights from my experience include:
- Designed and maintained RESTful and GraphQL APIs serving [X]k+ requests per day with 99.9% uptime
- Reduced average API response time by [X]% through query optimisation, caching strategies, and async processing
- Led the migration of a monolithic service to microservices using [Node.js / Go / Python / etc.], improving deployment independence and fault isolation

My core stack includes [Node.js / Python / Go / Java], [PostgreSQL / MongoDB], and cloud platforms ([AWS / GCP / Azure]). I take pride in writing clean, well-tested code and designing systems that are easy to reason about and operate in production.

I am excited about [Company Name]'s approach to [specific technical challenge or product area] and would love to bring my experience to your backend team.

Yours sincerely,
[Your Name]`,
  },
  {
    id: "fullstack-engineer",
    label: "Full-Stack Engineer",
    icon: "🔧",
    description: "End-to-end product role",
    title: "Full-Stack Engineer Application",
    body: `Dear Hiring Manager,

I am excited to apply for the Full-Stack Engineer position at [Company Name]. I thrive working across the entire stack — from crafting polished React UIs to designing robust backend services — and I enjoy taking ownership of features end-to-end.

Key contributions from my career so far:
- Built and shipped [feature / product] from zero to production, owning the full stack from database schema to UI
- Implemented CI/CD pipelines that reduced deployment time from [X] hours to [X] minutes
- Introduced end-to-end testing with [Playwright / Cypress] that caught [X]% of regressions before they reached production

I am comfortable with [React / Next.js], [Node.js / Python], and [PostgreSQL / MongoDB], and I pick up new technologies quickly when the problem demands it.

What excites me most about [Company Name] is [specific product, mission, or engineering challenge]. I would love to discuss how I can contribute to your team.

Yours sincerely,
[Your Name]`,
  },
  {
    id: "devops-sre",
    label: "DevOps / SRE",
    icon: "🚀",
    description: "Infrastructure / reliability role",
    title: "DevOps / SRE Application",
    body: `Dear Hiring Manager,

I am writing to apply for the DevOps / Site Reliability Engineer role at [Company Name]. I am passionate about building the platforms and practices that enable engineering teams to ship with confidence and operate systems reliably at scale.

What I bring to the role:
- Designed and maintained Kubernetes-based infrastructure on [AWS / GCP / Azure], supporting [X] microservices with high availability
- Built automated CI/CD pipelines with [GitHub Actions / Jenkins / CircleCI] that enabled multiple deployments per day with zero-downtime releases
- Reduced mean time to recovery (MTTR) by [X]% by implementing comprehensive observability with [Datadog / Grafana / PagerDuty]

I have strong experience with Terraform for infrastructure-as-code, Docker for containerisation, and Linux systems administration. I believe in treating reliability as a feature and automating toil wherever possible.

I am particularly interested in [Company Name]'s infrastructure challenges and would love to contribute to your reliability and platform engineering efforts.

Yours sincerely,
[Your Name]`,
  },
  {
    id: "mobile-engineer",
    label: "Mobile Engineer",
    icon: "📱",
    description: "iOS / Android / React Native",
    title: "Mobile Engineer Application",
    body: `Dear Hiring Manager,

I am applying for the Mobile Engineer role at [Company Name]. Building smooth, native-feeling mobile experiences that delight users is what I do best, and I am excited by the opportunity to bring that to your team.

Highlights from my experience:
- Shipped [X] apps to the App Store / Google Play with a combined [X]k+ active users and a [X]★ average rating
- Reduced app launch time by [X]% through lazy initialisation and optimised asset loading
- Implemented offline-first architecture using [Redux Persist / SQLite / Realm], ensuring a seamless experience regardless of connectivity

My core expertise is in [Swift / Kotlin / React Native / Flutter], and I have strong opinions about mobile UX patterns, performance profiling, and accessibility. I work closely with design and backend teams to deliver a cohesive product experience.

[Company Name]'s mobile product stands out because [specific observation about their app or approach]. I would love to discuss how I can help take it further.

Yours sincerely,
[Your Name]`,
  },
  {
    id: "senior-ic-career-move",
    label: "Senior / Staff IC",
    icon: "⭐",
    description: "Step-up or staff-level role",
    title: "Senior Engineer Application",
    body: `Dear Hiring Manager,

I am writing to express my interest in the Senior / Staff Engineer position at [Company Name]. I am at a stage in my career where I want to work on genuinely hard problems alongside exceptionally talented engineers — and [Company Name] is exactly the kind of place I have in mind.

What I offer at this level:
- [X]+ years of hands-on engineering experience across [domains / stacks], with a track record of owning and delivering complex, cross-functional projects
- A history of raising the technical bar — through design reviews, mentoring junior engineers, and establishing patterns and practices adopted across teams
- Experience influencing technical direction beyond my immediate team, including [architectural decision / migration / platform initiative]

I am as comfortable whiteboarding system designs as I am shipping production code, and I believe the best senior engineers make everyone around them more effective.

What draws me to [Company Name] is [specific technical challenge, product domain, or engineering culture aspect]. I am keen to explore how my experience aligns with what your team is building next.

Yours sincerely,
[Your Name]`,
  },
];
