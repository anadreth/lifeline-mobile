export type Blackboard = {
  meta: {
    patient_id: string | null;
    encounter_id: string;
    locale: string;
    collected_at: string;
    collector: string;
  };
  summary: {
    minimal_anamnesis: string | null;
    chief_complaint: string | null;
    cave_flags: string[];
    triage_level: "non-urgent" | "urgent" | "emergent" | null;
    confidence: number;
  };
  current_symptoms: any[];
  personal_history: { conditions: any[]; surgeries: any[]; injuries: any[] };
  family_history: any[];
  medications: { active: any[]; supplements: any[] };
  allergies: any[];
  substance_use: { smoking: any; alcohol: any; other: any[] };
  gynecologic_history: any | null;
  occupational_history: any;
  social_context: any;
  value_history: any;
  qa_report: { resolved_conflicts: any[]; remaining_gaps: any[] };
  fhir_bundle: any | null;
  transcript_alignment: {
    t: number;
    speaker: "patient" | "ai";
    text: string;
  }[];
};

export type BlackboardWritePayload = {
  path: string; // dot path, napr. "summary.chief_complaint"
  value: any; // ak zapisuješ pole, nahraď celé pole alebo definuj vlastnú merge politiku
  category: string; // OA/HPI/...
  source_phrase?: string;
  confidence?: number;
  approx?: boolean;
};
