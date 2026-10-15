import { toSectionType } from "../../cv/cv.rules";
import type { MatchCv, MatchCvSection } from "./match.types";

export interface AtsCheck {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export const CV_WORD_RANGE = { min: 300, max: 1500 } as const;

/*
 * Every pattern here is linear on any input (no nested or adjacent
 * overlapping quantifiers), or runs on short, bounded strings only.
 */
const EMAIL_WORD = /^[^@]+@[^@]+\.[^@]+$/;
const MAX_EMAIL_LENGTH = 254;
const YEAR_OR_PRESENT = /\b(?:19|20)\d{2}\b|\b(?:present|current|now)\b/i;
const IMAGE_PATTERN = /!\[[^\]\n]{0,200}\]\(/;
const TABLE_SEPARATOR_LINE = /^[|:\- ]+$/;
const WORD_PATTERN = /[A-Za-z0-9]+/g;

/** Words an ATS recognises as the heading for each standard section type. */
const STANDARD_HEADINGS: Readonly<Record<string, RegExp>> = {
  profile: /\b(profile|summary|about|objective|introduction|personal statement)\b/i,
  experience: /\b(experience|employment|work history|career history|professional history)\b/i,
  education: /\b(education|qualifications?|academic|training)\b/i,
  skills: /\b(skills|technologies|tech stack|technical|competencies|expertise|tools)\b/i,
};

const has = (value: string | null | undefined) => !!value?.trim();

function sectionsOfType(cv: MatchCv, type: string): MatchCvSection[] {
  return cv.sections.filter((s) => toSectionType(s.sectionType) === type);
}

function containsEmail(text: string): boolean {
  if (!text.includes("@")) return false;
  return text
    .split(/\s+/)
    .some((word) => word.length <= MAX_EMAIL_LENGTH && word.includes("@") && EMAIL_WORD.test(word));
}

/** A Markdown table separator row such as "| --- | :---: |". */
function usesTable(text: string): boolean {
  if (!text.includes("|") || !text.includes("---")) return false;
  return text.split("\n").some((line) => {
    const trimmed = line.trim();
    return trimmed.includes("|") && trimmed.includes("---") && TABLE_SEPARATOR_LINE.test(trimmed);
  });
}

function wordCount(text: string): number {
  let count = 0;
  for (const _ of text.matchAll(WORD_PATTERN)) count++;
  return count;
}

/**
 * Deterministic CV hygiene checks that matter to applicant-tracking systems
 * and recruiters. Independent of any job description.
 */
export function runAtsChecks(cv: MatchCv): AtsCheck[] {
  const allText = cv.sections.map((s) => s.content).join("\n");
  const profile = sectionsOfType(cv, "profile").find((s) => has(s.content));
  const experience = sectionsOfType(cv, "experience").filter((s) => has(s.content));
  const skills = sectionsOfType(cv, "skills").find((s) => has(s.content));
  const words = wordCount(allText);
  const usesTables = usesTable(allText);
  const usesImages = IMAGE_PATTERN.test(allText);
  const oddHeadings = cv.sections
    .filter((s) => has(s.content))
    .filter((s) => {
      const pattern = STANDARD_HEADINGS[toSectionType(s.sectionType)];
      return pattern !== undefined && !pattern.test(s.title);
    })
    .map((s) => `"${s.title.trim() || "Untitled"}"`);

  const hasEmail = has(cv.email) || containsEmail(allText);
  const hasPhone = has(cv.phone);
  const datedExperience = experience.some((s) => YEAR_OR_PRESENT.test(s.content));
  const lengthOk = words >= CV_WORD_RANGE.min && words <= CV_WORD_RANGE.max;

  return [
    {
      key: "contact_email",
      label: "Email address",
      passed: hasEmail,
      detail: hasEmail
        ? "Recruiters can reach you by email."
        : "Add an email address to your contact details.",
    },
    {
      key: "contact_phone",
      label: "Phone number",
      passed: hasPhone,
      detail: hasPhone
        ? "A phone number is included."
        : "Add a phone number so recruiters can call you.",
    },
    {
      key: "profile",
      label: "Profile / summary",
      passed: !!profile,
      detail: profile
        ? "Your CV has a profile summary."
        : "Add a short profile that sums up who you are and what you're looking for.",
    },
    {
      key: "experience_dates",
      label: "Experience with dates",
      passed: datedExperience,
      detail: datedExperience
        ? "Your experience includes dates."
        : experience.length > 0
          ? "Add dates (e.g. 2021 – Present) to each role so your timeline is clear."
          : "Add an experience section with your roles and their dates.",
    },
    {
      key: "skills",
      label: "Skills section",
      passed: !!skills,
      detail: skills
        ? "You list your skills in their own section."
        : "Add a skills section: ATS software looks for skills listed together.",
    },
    {
      key: "length",
      label: "Length",
      passed: lengthOk,
      detail: `${words.toLocaleString("en-GB")} words${
        lengthOk
          ? " — a good length."
          : words < CV_WORD_RANGE.min
            ? ` — aim for at least ${CV_WORD_RANGE.min}.`
            : ` — aim for at most ${CV_WORD_RANGE.max.toLocaleString("en-GB")} (about two pages).`
      }`,
    },
    {
      key: "formatting",
      label: "No tables or images",
      passed: !usesTables && !usesImages,
      detail:
        usesTables || usesImages
          ? "ATS software often can't read tables or images; use plain headings and bullet points."
          : "Plain text that ATS software can read.",
    },
    {
      key: "photo",
      label: "No photo",
      passed: !has(cv.photoUrl),
      detail: has(cv.photoUrl)
        ? "UK and US employers generally expect CVs without a photo, and ATS software ignores images."
        : "No photo, as UK and US employers expect.",
    },
    {
      key: "standard_headings",
      label: "Standard section headings",
      passed: oddHeadings.length === 0,
      detail:
        oddHeadings.length === 0
          ? "Section headings are ones ATS software recognises."
          : `Rename ${oddHeadings.slice(0, 3).join(", ")} to a standard heading such as "Experience", "Skills" or "Education".`,
    },
  ];
}
