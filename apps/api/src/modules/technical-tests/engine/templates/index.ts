import type { ScenarioTemplate } from "../scenario-types";
import { dataImportTemplate } from "./data-import.template";
import { deliveryPipelineTemplate } from "./delivery-pipeline.template";
import { designSystemTemplate } from "./design-system.template";
import { formWizardTemplate } from "./form-wizard.template";
import { fullstackAppTemplate } from "./fullstack-app.template";
import { kubernetesPlatformTemplate } from "./kubernetes-platform.template";
import { notificationServiceTemplate } from "./notification-service.template";
import { realtimeDashboardTemplate } from "./realtime-dashboard.template";
import { restApiTemplate } from "./rest-api.template";

/**
 * Every static scenario. Each role has at least one template for every level
 * and difficulty (a spec checks this), so strict filtering never comes up empty.
 */
export const SCENARIO_TEMPLATES: readonly ScenarioTemplate[] = [
  designSystemTemplate,
  formWizardTemplate,
  realtimeDashboardTemplate,
  restApiTemplate,
  dataImportTemplate,
  notificationServiceTemplate,
  fullstackAppTemplate,
  deliveryPipelineTemplate,
  kubernetesPlatformTemplate,
];
