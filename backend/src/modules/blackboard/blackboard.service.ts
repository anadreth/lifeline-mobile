import { Blackboard, BlackboardWritePayload } from "./blackboard.types";
import { getByPath, setByPath } from "./blackboard.paths";
import { getRedisClient } from "../../config/redis";

const blackboardKey = (examId: string) => `blackboard:${examId}`;
const blackboardVersionKey = (examId: string) => `blackboard:${examId}:version`;

const EMPTY_blackboard = (examId: string, locale = "sk-SK"): Blackboard => ({
  meta: {
    patient_id: null,
    encounter_id: examId,
    locale,
    collected_at: new Date().toISOString(),
    collector: "ai_anamnesis_v1",
  },
  summary: {
    minimal_anamnesis: null,
    chief_complaint: null,
    cave_flags: [],
    triage_level: null,
    confidence: 0,
  },
  current_symptoms: [],
  personal_history: { conditions: [], surgeries: [], injuries: [] },
  family_history: [],
  medications: { active: [], supplements: [] },
  allergies: [],
  substance_use: { smoking: {}, alcohol: {}, other: [] },
  gynecologic_history: null,
  occupational_history: {},
  social_context: {},
  value_history: {},
  qa_report: { resolved_conflicts: [], remaining_gaps: [] },
  fhir_bundle: null,
  transcript_alignment: [],
});

export async function blackboardInit(examId: string, locale?: string) {
  const client = getRedisClient();
  const key = blackboardKey(examId);
  const exists = await client.exists(key);
  if (!exists) {
    const initDoc = EMPTY_blackboard(examId, locale);
    await client.set(key, JSON.stringify(initDoc));
    await client.set(blackboardVersionKey(examId), "1");
  }
}

export async function blackboardRead(examId: string, path?: string) {
  const client = getRedisClient();
  const raw = await client.get(blackboardKey(examId));
  if (!raw) return null;
  const doc: Blackboard = JSON.parse(raw);
  return path ? getByPath(doc, path) : doc;
}

export async function blackboardWrite(
  examId: string,
  payload: BlackboardWritePayload
) {
  const client = getRedisClient();
  const key = blackboardKey(examId);
  const vKey = blackboardVersionKey(examId);

  // Optimistic lock + retry
  for (let attempt = 0; attempt < 5; attempt++) {
    await client.watch(key);
    const raw = await client.get(key);
    if (!raw) {
      await client.unwatch();
      throw new Error(`Blackboard not initialized for ${examId}`);
    }
    const doc: Blackboard = JSON.parse(raw);

    // aplikuj zmenu
    setByPath(doc, payload.path, payload.value);

    // (voliteľne) môžeš zmeniť summary.confidence atď. podľa payload
    // doc.summary.confidence = Math.min(1, doc.summary.confidence + (payload.confidence ?? 0) * 0.01);

    const multi = client.multi();
    multi.set(key, JSON.stringify(doc));
    multi.incr(vKey);
    const res = await multi.exec(); // null = konflikt
    if (res) return { ok: true };
  }
  throw new Error("blackboardWrite conflict, retry limit reached");
}

export async function blackboardSummaryText(examId: string): Promise<string> {
  const doc = await blackboardRead(examId);
  if (!doc) return "-";
  const s = (doc as Blackboard).summary;
  const hpi = (doc as Blackboard).current_symptoms
    ?.map((x: any) => x.name)
    .filter(Boolean)
    .join(", ");
  return `CC: ${s?.chief_complaint || "-"} | CAVE: ${
    (s?.cave_flags || []).join(",") || "-"
  } | HPI: ${hpi || "-"}`;
}
