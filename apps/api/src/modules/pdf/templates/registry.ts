// registry.ts — every CV template, keyed by its public id.
// Mirrors TemplateId / TEMPLATE_OPTIONS in libs/shared/types/src/cv-templates.ts
// (registry.spec.ts asserts the ids match).

import type { ContactItem, CvData, CvSection, ResolvedTheme } from "./shared";
import { getClassicCSS, renderClassicBody } from "./classic";
import { getModernCSS, renderModernLayout } from "./modern";
import { getMinimalCSS, renderMinimalBody } from "./minimal";
import { getExecutiveCSS, renderExecutiveBody } from "./executive";
import { getCreativeCSS, renderCreativeLayout } from "./creative";
import { getCompactCSS, renderCompactLayout } from "./compact";
import { getDeveloperCSS, renderDeveloperBody } from "./developer";
import { getElegantCSS, renderElegantBody } from "./elegant";
import { getBoldCSS, renderBoldBody } from "./bold";
import { getAcademicCSS, renderAcademicBody } from "./academic";
import { getStartupCSS, renderStartupBody } from "./startup";
import { getInfographicCSS, renderInfographicLayout } from "./infographic";
import { getNordicCSS, renderNordicBody } from "./nordic";
import { getTimelineCSS, renderTimelineBody } from "./timeline";
import { getMagazineCSS, renderMagazineLayout } from "./magazine";
import { getTerminalCSS, renderTerminalBody } from "./terminal";
import { getGradientCSS, renderGradientLayout } from "./gradient";
import { getArchitectCSS, renderArchitectLayout } from "./architect";
import { getMetropolisCSS, renderMetropolisLayout } from "./metropolis";
import { getZenCSS, renderZenBody } from "./zen";
import { getRetroCSS, renderRetroLayout } from "./retro";
import { getBlueprintCSS, renderBlueprintLayout } from "./blueprint";
import { getMosaicCSS, renderMosaicLayout } from "./mosaic";
import { getLuxeCSS, renderLuxeLayout } from "./luxe";
import { getNewspaperCSS, renderNewspaperLayout } from "./newspaper";
import { getOrigamiCSS, renderOrigamiLayout } from "./origami";
import { getPulseCSS, renderPulseLayout } from "./pulse";
import { getArtisanCSS, renderArtisanBody } from "./artisan";
import { getFrontierCSS, renderFrontierLayout } from "./frontier";

export interface TemplateStyleContext {
  theme: ResolvedTheme;
  headerLayout: string;
}

export interface CvTemplate {
  /** Template-specific CSS, appended after the base CSS. */
  css: (ctx: TemplateStyleContext) => string;
  render: (
    data: CvData,
    contacts: ContactItem[],
    sections: CvSection[],
    templateId: string,
  ) => string;
}

export const CV_TEMPLATES = {
  classic: { css: (c) => getClassicCSS(c.headerLayout), render: renderClassicBody },
  modern: { css: (c) => getModernCSS(c.theme), render: renderModernLayout },
  minimal: { css: (c) => getMinimalCSS(c.headerLayout), render: renderMinimalBody },
  executive: { css: (c) => getExecutiveCSS(c.headerLayout), render: renderExecutiveBody },
  creative: { css: (c) => getCreativeCSS(c.theme), render: renderCreativeLayout },
  compact: { css: () => getCompactCSS(), render: renderCompactLayout },
  developer: { css: (c) => getDeveloperCSS(c.headerLayout), render: renderDeveloperBody },
  elegant: { css: (c) => getElegantCSS(c.headerLayout), render: renderElegantBody },
  bold: { css: (c) => getBoldCSS(c.headerLayout), render: renderBoldBody },
  academic: { css: (c) => getAcademicCSS(c.headerLayout), render: renderAcademicBody },
  startup: { css: () => getStartupCSS(), render: renderStartupBody },
  infographic: { css: (c) => getInfographicCSS(c.theme), render: renderInfographicLayout },
  nordic: { css: (c) => getNordicCSS(c.headerLayout), render: renderNordicBody },
  timeline: { css: (c) => getTimelineCSS(c.headerLayout), render: renderTimelineBody },
  magazine: { css: (c) => getMagazineCSS(c.theme), render: renderMagazineLayout },
  terminal: { css: () => getTerminalCSS(), render: renderTerminalBody },
  gradient: { css: (c) => getGradientCSS(c.theme), render: renderGradientLayout },
  architect: { css: (c) => getArchitectCSS(c.theme), render: renderArchitectLayout },
  metropolis: { css: (c) => getMetropolisCSS(c.theme), render: renderMetropolisLayout },
  zen: { css: (c) => getZenCSS(c.headerLayout), render: renderZenBody },
  retro: { css: (c) => getRetroCSS(c.theme), render: renderRetroLayout },
  blueprint: { css: (c) => getBlueprintCSS(c.theme), render: renderBlueprintLayout },
  mosaic: { css: (c) => getMosaicCSS(c.theme), render: renderMosaicLayout },
  luxe: { css: (c) => getLuxeCSS(c.theme), render: renderLuxeLayout },
  newspaper: { css: (c) => getNewspaperCSS(c.theme), render: renderNewspaperLayout },
  origami: { css: (c) => getOrigamiCSS(c.theme), render: renderOrigamiLayout },
  pulse: { css: (c) => getPulseCSS(c.theme), render: renderPulseLayout },
  artisan: { css: (c) => getArtisanCSS(c.headerLayout), render: renderArtisanBody },
  frontier: { css: (c) => getFrontierCSS(c.theme), render: renderFrontierLayout },
} satisfies Record<string, CvTemplate>;

export type TemplateId = keyof typeof CV_TEMPLATES;

export const TEMPLATE_IDS = Object.keys(CV_TEMPLATES) as TemplateId[];

export const DEFAULT_TEMPLATE_ID: TemplateId = "classic";

export function isTemplateId(value: unknown): value is TemplateId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(CV_TEMPLATES, value)
  );
}
