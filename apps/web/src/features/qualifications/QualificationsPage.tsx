import { Award } from "lucide-react";
import { PageHero, EmptyFeatureState } from "../shared";

export function QualificationsPage() {
  return (
    <div className="space-y-8">
      <PageHero
        icon={Award}
        title="Qualifications"
        subtitle="Manage your certifications, education, skills, and other qualifications to showcase on your CV and applications."
      />
      <EmptyFeatureState
        title="No qualifications added yet"
        subtitle="Start adding your certifications, degrees, and skills"
      />
    </div>
  );
}
