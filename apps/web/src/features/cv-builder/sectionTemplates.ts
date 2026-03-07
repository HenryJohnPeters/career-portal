export interface SectionTemplate {
  title: string;
  content: string;
  icon: string;
  description: string;
  sectionType: string;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    title: "Profile",
    content:
      "A passionate and results-driven professional with experience in...\n\n- Strong problem-solving skills\n- Excellent communication abilities\n- Team-oriented with leadership experience",
    icon: "👤",
    description: "Professional summary",
    sectionType: "profile",
  },
  {
    title: "Experience",
    content:
      "### Company Name | Job Title | Jan 2024 – Present\n\n- Led cross-functional team of 5 to deliver key projects\n- Increased efficiency by 30% through process optimization\n- Mentored junior team members",
    icon: "💼",
    description: "Work history",
    sectionType: "experience",
  },
  {
    title: "Education",
    content:
      "### University Name | Bachelor of Science in Computer Science | 2018 – 2022\n\n- GPA: 3.8/4.0\n- Dean's List: 2019–2022\n- Relevant coursework: Data Structures, Algorithms, Machine Learning",
    icon: "🎓",
    description: "Academic background",
    sectionType: "education",
  },
  {
    title: "Skills",
    content:
      "### Technical Skills\n- JavaScript, TypeScript, Python, Java\n- React, Node.js, Next.js\n- PostgreSQL, MongoDB, Redis\n\n### Soft Skills\n- Leadership & Team Management\n- Agile & Scrum Methodologies\n- Communication & Presentation",
    icon: "⚡",
    description: "Technical & soft skills",
    sectionType: "skills",
  },
  {
    title: "Projects",
    content:
      "### Project Name | React, Node.js, PostgreSQL\n\n- Built a full-stack application serving 1,000+ users\n- Implemented CI/CD pipeline reducing deployment time by 60%\n- [View Project](https://example.com)",
    icon: "🚀",
    description: "Key projects",
    sectionType: "projects",
  },
  {
    title: "Certifications",
    content:
      "- **AWS Solutions Architect** — Amazon Web Services, 2024\n- **Professional Scrum Master I** — Scrum.org, 2023\n- **Google Analytics Certified** — Google, 2023",
    icon: "🏆",
    description: "Professional certifications",
    sectionType: "certifications",
  },
  {
    title: "Languages",
    content:
      "- **English** — Native [rating: 5/5]\n- **Spanish** — Conversational [rating: 3/5]\n- **French** — Basic [rating: 2/5]",
    icon: "🌍",
    description: "Languages spoken",
    sectionType: "languages",
  },
  {
    title: "Interests",
    content:
      "- Open-source software development\n- Technical writing and blogging\n- Community mentorship and hackathons",
    icon: "✨",
    description: "Hobbies & interests",
    sectionType: "interests",
  },
];
