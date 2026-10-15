import {
  MAX_SELECTED_TAGS,
  TECH_TAG_CATALOG,
  groupTechTagsByCategory,
} from "../../common/tech-tags";
import { listInterviewers } from "./interviewer-traits";

/** Allowed session settings (the DTO validates against these lists). */
export const TRACKS = ["frontend", "backend", "fullstack", "devops"];
export const LEVELS = ["junior", "mid", "senior"];
export const ROLE_FOCUSES = ["frontend", "backend", "fullstack", "platform"];
export const INTERVIEW_TYPES = ["coding", "system-design", "behavioral"];
export const DURATIONS = [30, 60, 90];
export const DIFFICULTIES = ["easy", "medium", "hard"];
export const COMPANY_STYLES = ["faang", "startup", "enterprise"];
export const PERSONAS = ["friendly", "neutral", "tough"];

/**
 * GET /interview-prep/options. Static: tags come from the shared catalog only
 * (never from question-bank rows), so nothing user-supplied is listed.
 * `items` and `tags` hold catalog ids; labels come from the shared catalog.
 */
export const INTERVIEW_OPTIONS = {
  techCategories: groupTechTagsByCategory().map((category) => ({
    key: category.key,
    label: category.label,
    items: category.tags.map((tag) => tag.id),
  })),
  tags: TECH_TAG_CATALOG.map((tag) => tag.id),
  maxTags: MAX_SELECTED_TAGS,
  tracks: TRACKS,
  levels: LEVELS,
  roleFocuses: ROLE_FOCUSES,
  interviewTypes: INTERVIEW_TYPES,
  durations: DURATIONS,
  difficulties: DIFFICULTIES,
  companyStyles: COMPANY_STYLES,
  personas: PERSONAS,
  interviewers: listInterviewers(),
} as const;
