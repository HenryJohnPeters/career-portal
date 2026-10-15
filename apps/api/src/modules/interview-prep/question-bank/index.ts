import { QUESTIONS as CORE } from "./data/core";
import { QUESTIONS as FRONTEND_JUNIOR } from "./data/frontend-junior";
import { QUESTIONS as FRONTEND_MID } from "./data/frontend-mid";
import { QUESTIONS as FRONTEND_SENIOR } from "./data/frontend-senior";
import { QUESTIONS as BACKEND_JUNIOR } from "./data/backend-junior";
import { QUESTIONS as BACKEND_MID } from "./data/backend-mid";
import { QUESTIONS as BACKEND_SENIOR } from "./data/backend-senior";
import { QUESTIONS as FULLSTACK_JUNIOR } from "./data/fullstack-junior";
import { QUESTIONS as FULLSTACK_MID } from "./data/fullstack-mid";
import { QUESTIONS as FULLSTACK_SENIOR } from "./data/fullstack-senior";
import { QUESTIONS as DEVOPS_JUNIOR } from "./data/devops-junior";
import { QUESTIONS as DEVOPS_MID } from "./data/devops-mid";
import { QUESTIONS as DEVOPS_SENIOR } from "./data/devops-senior";
import type { BankQuestion } from "./types";

export type { BankQuestion } from "./types";

/**
 * The reference question bank shipped with the app: every data file, in a
 * fixed order (core first, then track by track, junior to senior). Synced
 * into InterviewQuestion before each deploy (scripts/sync-question-bank.ts)
 * and by `pnpm db:seed`. A new data file must be added here.
 */
export const REFERENCE_QUESTIONS: readonly BankQuestion[] = [
  ...CORE,
  ...FRONTEND_JUNIOR,
  ...FRONTEND_MID,
  ...FRONTEND_SENIOR,
  ...BACKEND_JUNIOR,
  ...BACKEND_MID,
  ...BACKEND_SENIOR,
  ...FULLSTACK_JUNIOR,
  ...FULLSTACK_MID,
  ...FULLSTACK_SENIOR,
  ...DEVOPS_JUNIOR,
  ...DEVOPS_MID,
  ...DEVOPS_SENIOR,
];
