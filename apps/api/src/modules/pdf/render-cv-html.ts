// render-cv-html.ts — CV template engine entry point.
// Template implementations live in ./templates/ and are looked up in the registry.

import { getBaseCSS } from "./templates/base-css";
import { CV_TEMPLATES, DEFAULT_TEMPLATE_ID, isTemplateId } from "./templates/registry";
import { buildContactItems, CvData, escapeHtml } from "./templates/shared";
import { HEADER_LAYOUTS, resolveTheme } from "./templates/theme";

export function renderCvHtml(data: CvData): string {
  const templateId = isTemplateId(data.templateId)
    ? data.templateId
    : DEFAULT_TEMPLATE_ID;
  const template = CV_TEMPLATES[templateId];
  const theme = resolveTheme(data.themeConfig);
  const headerLayout = (HEADER_LAYOUTS as readonly string[]).includes(
    data.headerLayout ?? "",
  )
    ? (data.headerLayout as string)
    : "split";
  const contacts = buildContactItems(data);
  const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);

  const templateCSS = template.css({ theme, headerLayout });
  const bodyHtml = template.render(data, contacts, sortedSections, templateId);

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
