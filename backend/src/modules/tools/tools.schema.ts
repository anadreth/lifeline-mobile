export const TOOLS = [
    {
      name: "blackboard.write",
      description: "Append/UPDATE blackboard entry (dot path)",
      parameters: {
        type: "object",
        properties: {
          examId: { type: "string" },
          path: { type: "string", description: "dot path e.g. summary.chief_complaint" },
          value: { type: "object" },
          category: { type: "string" },
          source_phrase: { type: "string" },
          confidence: { type: "number" },
          approx: { type: "boolean" }
        },
        required: ["examId","path","value","category"]
      }
    },
    {
      name: "blackboard.read",
      description: "Read snapshot or subpath of blackboard",
      parameters: {
        type: "object",
        properties: {
          examId: { type: "string" },
          path: { type: "string" }
        },
        required: ["examId"]
      }
    },
    {
      name: "router.switch_agent",
      description: "Announce agent handover",
      parameters: {
        type: "object",
        properties: {
          examId: { type: "string" },
          target: { type: "string" },
          reason: { type: "string" }
        },
        required: ["examId","target"]
      }
    },
    {
      name: "qa.raise_conflict",
      description: "Mark conflicting data",
      parameters: {
        type: "object",
        properties: {
          examId: { type: "string" },
          path: { type: "string" },
          reason: { type: "string" }
        },
        required: ["examId","path","reason"]
      }
    },
    {
      name: "checkpoint.mark",
      description: "Emit completion marker",
      parameters: {
        type: "object",
        properties: { section: { type: "string" } },
        required: ["section"]
      }
    },
    {
      name: "ehr.export",
      description: "Map blackboard to FHIR Bundle and persist",
      parameters: {
        type: "object",
        properties: { examId: { type: "string" } },
        required: ["examId"]
      }
    }
  ];
  