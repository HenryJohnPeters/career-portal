/** The parts of a CV version the match engine reads. */
export interface MatchCvSection {
  title: string;
  sectionType: string;
  content: string;
}

export interface MatchCv {
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  sections: MatchCvSection[];
}
