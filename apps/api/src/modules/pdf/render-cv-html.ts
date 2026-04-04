// render-cv-html.ts — Minimal CV Template Engine
// All template implementations are in ./templates/

import { getBaseCSS } from "./templates/base-css";
import {
  CvData,
  resolveTheme,
  buildContactItems,
  escapeHtml,
} from "./templates/shared";

// Import all template modules
import { getClassicCSS, renderClassicBody } from "./templates/classic";
import { getModernCSS, renderModernLayout } from "./templates/modern";
import { getMinimalCSS, renderMinimalBody } from "./templates/minimal";
import { getExecutiveCSS, renderExecutiveBody } from "./templates/executive";
import { getCreativeCSS, renderCreativeLayout } from "./templates/creative";
import { getCompactCSS, renderCompactLayout } from "./templates/compact";
import { getDeveloperCSS, renderDeveloperBody } from "./templates/developer";
import { getElegantCSS, renderElegantBody } from "./templates/elegant";
import { getBoldCSS, renderBoldBody } from "./templates/bold";
import { getAcademicCSS, renderAcademicBody } from "./templates/academic";
import { getStartupCSS, renderStartupBody } from "./templates/startup";
import {
  getInfographicCSS,
  renderInfographicLayout,
} from "./templates/infographic";
import { getNordicCSS, renderNordicBody } from "./templates/nordic";
import { getTimelineCSS, renderTimelineBody } from "./templates/timeline";
import { getMagazineCSS, renderMagazineLayout } from "./templates/magazine";
import { getTerminalCSS, renderTerminalBody } from "./templates/terminal";
import { getGradientCSS, renderGradientLayout } from "./templates/gradient";
import { getArchitectCSS, renderArchitectLayout } from "./templates/architect";
import {
  getMetropolisCSS,
  renderMetropolisLayout,
} from "./templates/metropolis";
import { getZenCSS, renderZenBody } from "./templates/zen";
import { getRetroCSS, renderRetroLayout } from "./templates/retro";
import { getBlueprintCSS, renderBlueprintLayout } from "./templates/blueprint";
import { getMosaicCSS, renderMosaicLayout } from "./templates/mosaic";
import { getLuxeCSS, renderLuxeLayout } from "./templates/luxe";
import { getNewspaperCSS, renderNewspaperLayout } from "./templates/newspaper";
import { getOrigamiCSS, renderOrigamiLayout } from "./templates/origami";
import { getPulseCSS, renderPulseLayout } from "./templates/pulse";
import { getArtisanCSS, renderArtisanBody } from "./templates/artisan";
import { getFrontierCSS, renderFrontierLayout } from "./templates/frontier";

// ═══════════════════════════════════════════════════════════
// MAIN RENDER FUNCTION
// ═══════════════════════════════════════════════════════════

export function renderCvHtml(data: CvData): string {
  const templateId = data.templateId || "classic";
  const themeConfig = data.themeConfig || {};
  const theme = resolveTheme(themeConfig);
  const contacts = buildContactItems(data);
  const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);
  const headerLayout = data.headerLayout || "split";

  let templateCSS = "";
  let bodyHtml = "";

  // Route to appropriate template
  switch (templateId) {
    case "modern":
      templateCSS = getModernCSS(theme);
      bodyHtml = renderModernLayout(data, contacts, sortedSections, templateId);
      break;

    case "creative":
      templateCSS = getCreativeCSS(theme);
      bodyHtml = renderCreativeLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "infographic":
      templateCSS = getInfographicCSS(theme);
      bodyHtml = renderInfographicLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "magazine":
      templateCSS = getMagazineCSS(theme);
      bodyHtml = renderMagazineLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "gradient":
      templateCSS = getGradientCSS(theme);
      bodyHtml = renderGradientLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "architect":
      templateCSS = getArchitectCSS(theme);
      bodyHtml = renderArchitectLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "compact":
      templateCSS = getCompactCSS();
      bodyHtml = renderCompactLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "terminal":
      templateCSS = getTerminalCSS();
      bodyHtml = renderTerminalBody(data, contacts, sortedSections, templateId);
      break;

    case "startup":
      templateCSS = getStartupCSS();
      bodyHtml = renderStartupBody(data, contacts, sortedSections, templateId);
      break;

    case "minimal":
      templateCSS = getMinimalCSS(headerLayout);
      bodyHtml = renderMinimalBody(data, contacts, sortedSections, templateId);
      break;

    case "executive":
      templateCSS = getExecutiveCSS(headerLayout);
      bodyHtml = renderExecutiveBody(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "developer":
      templateCSS = getDeveloperCSS(headerLayout);
      bodyHtml = renderDeveloperBody(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "elegant":
      templateCSS = getElegantCSS(headerLayout);
      bodyHtml = renderElegantBody(data, contacts, sortedSections, templateId);
      break;

    case "bold":
      templateCSS = getBoldCSS(headerLayout);
      bodyHtml = renderBoldBody(data, contacts, sortedSections, templateId);
      break;

    case "academic":
      templateCSS = getAcademicCSS(headerLayout);
      bodyHtml = renderAcademicBody(data, contacts, sortedSections, templateId);
      break;

    case "nordic":
      templateCSS = getNordicCSS(headerLayout);
      bodyHtml = renderNordicBody(data, contacts, sortedSections, templateId);
      break;

    case "timeline":
      templateCSS = getTimelineCSS(headerLayout);
      bodyHtml = renderTimelineBody(data, contacts, sortedSections, templateId);
      break;

    case "metropolis":
      templateCSS = getMetropolisCSS(theme);
      bodyHtml = renderMetropolisLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "retro":
      templateCSS = getRetroCSS(theme);
      bodyHtml = renderRetroLayout(data, contacts, sortedSections, templateId);
      break;

    case "blueprint":
      templateCSS = getBlueprintCSS(theme);
      bodyHtml = renderBlueprintLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "mosaic":
      templateCSS = getMosaicCSS(theme);
      bodyHtml = renderMosaicLayout(data, contacts, sortedSections, templateId);
      break;

    case "luxe":
      templateCSS = getLuxeCSS(theme);
      bodyHtml = renderLuxeLayout(data, contacts, sortedSections, templateId);
      break;

    case "newspaper":
      templateCSS = getNewspaperCSS(theme);
      bodyHtml = renderNewspaperLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "origami":
      templateCSS = getOrigamiCSS(theme);
      bodyHtml = renderOrigamiLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "pulse":
      templateCSS = getPulseCSS(theme);
      bodyHtml = renderPulseLayout(data, contacts, sortedSections, templateId);
      break;

    case "frontier":
      templateCSS = getFrontierCSS(theme);
      bodyHtml = renderFrontierLayout(
        data,
        contacts,
        sortedSections,
        templateId
      );
      break;

    case "zen":
      templateCSS = getZenCSS(headerLayout);
      bodyHtml = renderZenBody(data, contacts, sortedSections, templateId);
      break;

    case "artisan":
      templateCSS = getArtisanCSS(headerLayout);
      bodyHtml = renderArtisanBody(data, contacts, sortedSections, templateId);
      break;

    default: // classic
      templateCSS = getClassicCSS(headerLayout);
      bodyHtml = renderClassicBody(data, contacts, sortedSections, templateId);
      break;
  }

  // Combine base CSS + template CSS + body HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(data.title)}</title>
<style>
${getBaseCSS(theme)}
${templateCSS}
</style>
</head>
<body>
  <div class="page">
    ${bodyHtml}
  </div>
</body>
</html>`;
}
