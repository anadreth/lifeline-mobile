# 🧠 Lifeline Realtime System Architecture

## Overview

Lifeline is an **AI-driven, voice-first medical anamnesis and exam system** built on top of OpenAI's Realtime API.

The architecture combines **React Native (frontend)**, **Node/Express (backend)**, **Redis (blackboard memory)**, and **OpenAI Realtime (multi-agent orchestration)** to create a conversational medical assistant that listens, speaks, and writes structured medical records in real-time.

This document serves as a **technical blueprint** for developers, AI agents, and integrators.

---

## 🏗️ High-Level Architecture

```
[React Native App]
├─ useWebRTCAudioSession (WebRTC + DataChannel)
├─ Barge-in & Ducking (interrupt speech)
├─ Conversation truncation via /api/blackboard/summary
└─ Tool-call proxy → Backend /api/tools/*

      ⇅ WebRTC (audio + data)

[OpenAI Realtime Model: gpt-4o-realtime]
├─ Orchestrator system prompt
├─ Virtual "agents" (MA, HPI, OA, FA, etc.)
└─ Tool calls → blackboard.write/read, router.switch_agent, ehr.export

      ⇅ HTTPS (REST)

[Backend – Express / Node.js]
├─ /api/openai-session → create Realtime session
├─ /api/openai-session/ice → provide STUN/TURN config
├─ /api/tools/* → execute model tool calls (Redis ops)
└─ /api/blackboard/* → blackboard CRUD + summary

[Redis]
└─ BLACKBOARD JSON (single source of truth)

[PostgreSQL]
└─ Stores encrypted health data, chat conversations, audit logs

[coturn]
└─ TURN/STUN relay for stable WebRTC
```

---

## 🧩 Core Concepts

### 1. Unified Realtime Model

A single OpenAI Realtime session runs the entire conversation, simulating **multiple agents** (MA, HPI, OA, FA, etc.) inside one orchestrator system prompt.

**Why:**

- No model swapping or latency from reinitialization
- Shared context for empathy, tone, and clinical continuity
- Agents are logical _states_, not separate models

---

### 2. Redis "Blackboard" Memory

All factual data (symptoms, history, vitals, etc.) are written to a **Blackboard JSON document** in Redis.

The model writes via tool calls → backend → Redis.

**Example structure:**

```json
{
  "meta": {
    "examId": "uuid",
    "patientName": "John Doe"
  },
  "summary": {
    "chief_complaint": "Chest pain",
    "duration": "2 hours"
  },
  "sections": {
    "HPI": { ... },
    "OA": { ... },
    "FA": { ... }
  },
  "version": 12
}
```

**Why:**

- Redis is atomic, fast, and ideal for JSON updates (with WATCH/MULTI locks)
- The blackboard acts as source of truth for all agents and summaries

---

### 3. Conversation Lifecycle

1. **App calls** `/api/openai-session` → backend creates OpenAI Realtime session with tools and system prompt
2. **App fetches** ICE config from `/api/openai-session/ice` for stable WebRTC (STUN/TURN)
3. **WebRTC connects** → audio and data channels open
4. **App sends** `session.update` to set up modalities and token limits
5. **User speaks** → ASR via `input_audio_buffer` → model listens and responds
6. **Model calls tools** like `blackboard.write` → backend updates Redis
7. **After finishing a section**, model outputs `[[COMPLETE: SECTION]]`
8. **Frontend fetches** `/api/blackboard/summary` and sends `conversation.truncate` (retaining last 8 messages + summary)
9. **Orchestrator switches** agents via `router.switch_agent("HPI")`
10. **After full exam**, model calls `ehr.export` → backend generates FHIR bundle and stores in PostgreSQL

---

### 4. Barge-In (Speech Interrupt)

When a patient starts speaking during AI's response:

1. RN app detects `speech_started`
2. Immediately sends `response.cancel` via data channel

**Why:**

- Natural, human-like interaction
- Prevents overlapping voices and TTS echo

---

### 5. Conversation Truncation

After each completed section (`[[COMPLETE: HPI]]`, etc.):

1. Fetches backend summary (`/api/blackboard/summary?examId=...`)
2. Sends truncation event:

```json
{
  "type": "conversation.truncate",
  "conversation": {
    "last_messages": 8,
    "summary": "...server summary..."
  }
}
```

**Why:**

- Prevents context bloat
- Reduces model latency
- Keeps long-term consistency (server state is truth)

---

### 6. Tools Layer

The Realtime model can call functions (tools) declared in `/api/openai-session`.

Each maps to an Express handler:

| Tool                  | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `blackboard.write`    | Writes value to Redis blackboard at given path           |
| `blackboard.read`     | Reads section from Redis blackboard                      |
| `blackboard.summary`  | Returns concise summary for model context                |
| `checkpoint.mark`     | Marks a section complete and triggers summary logic      |
| `router.switch_agent` | Switches active agent (logical subprompt)                |
| `ehr.export`          | Generates FHIR bundle from current blackboard            |
| `qa.raise_conflict`   | Creates short Q&A subflow for ambiguous/conflicting data |

**Why backend tools:**

- Centralized control
- Audit logging
- Unified EHR export compatibility

---

### 7. ICE Servers (STUN/TURN)

WebRTC clients behind NAT/firewalls need ICE servers to discover each other.

**Backend:** `/api/openai-session/ice`

```typescript
GET /api/openai-session/ice
→ {
  "iceServers": [
    {
      "urls": ["stun:stun.l.google.com:19302"]
    },
    {
      "urls": ["turn:turn.yourdomain.com:3478"],
      "username": "TURN_USER",
      "credential": "TURN_PASS"
    }
  ]
}
```

Frontend fetches this and passes it to:

```typescript
new RTCPeerConnection({ iceServers });
```

**Why:**

- Keeps TURN credentials secure (not in source code)
- Enables reliable WebRTC across all networks

---

### 8. Local Persistence (saveExam)

Frontend still stores local copies of progress (exam steps, timestamps) using `saveExam()`.

**Why:**

- Instant UI updates
- Offline tolerance
- The Redis blackboard remains the canonical data source

---

## 🧠 AI Layer (Realtime Orchestrator)

### Virtual Agents

Each "agent" represents a phase of the medical interview:

- **MA/CAVE** – Medical access & chief complaint
- **HPI** – History of present illness
- **OA** – Objective anamnesis
- **FA** – Family anamnesis
- **AA** – Allergies anamnesis
- **TA** – Treatment anamnesis
- **RA** – Risk assessment
- **PA** – Physical anamnesis
- **SA** – Social anamnesis
- **GA** – General assessment
- **HA** – Habits & lifestyle
- **QA** – Conflict resolution
- **EXPORT** – Summary and FHIR mapping

### System Prompt Orchestration

All agents live under one orchestrator prompt:

- Transitions between them are handled by tool calls (`router.switch_agent`)
- Agents can read/write blackboard entries via `blackboard.write/read`

**Why one model:**

- Continuous empathy, memory, and tone
- No context loss
- Real-time responsiveness

---

## 💾 Backend Modules

| Module                     | Responsibility                                   |
| -------------------------- | ------------------------------------------------ |
| `session.controller.ts`    | Create and manage OpenAI Realtime sessions       |
| `tools.controller.ts`      | Handle tool calls (Redis operations, EHR export) |
| `blackboard.controller.ts` | CRUD for blackboard + summaries                  |
| `ice.controller.ts`        | Serve STUN/TURN configuration                    |
| `redis.service.ts`         | JSON read/write utilities with versioning        |
| `fhir.service.ts`          | Map blackboard → FHIR bundle (EHR export)        |

---

## ⚙️ Redis Schema

| Key                           | Type | Description                               |
| ----------------------------- | ---- | ----------------------------------------- |
| `blackboard:<examId>`         | JSON | Current blackboard content (all sections) |
| `blackboard:<examId>:version` | INT  | Incremented on each write                 |
| `qa:<examId>`                 | JSON | Temporary QA conflicts/questions          |

**Example partial structure:**

```json
{
  "meta": {
    "examId": "123",
    "locale": "sk-SK"
  },
  "summary": {
    "chief_complaint": "Chest pain"
  },
  "HPI": {
    "onset": "2 hours",
    "severity": "moderate"
  },
  "version": 7
}
```

---

## 🔊 WebRTC + Realtime Communication Flow

1. **Audio input** captured from user microphone (RN WebRTC)
2. **Streamed** to OpenAI Realtime model as audio
3. **Model processes** input + context + blackboard state
4. **Generates audio output** via TTS → remote audio track
5. **Data channel** used for:
   - tool-calls
   - cancel/resume commands
   - conversation metadata
   - barge-in logic

---

## 🧰 Key Endpoints

| Endpoint                  | Method | Purpose                                               |
| ------------------------- | ------ | ----------------------------------------------------- |
| `/api/openai-session`     | POST   | Create Realtime session and inject tools/instructions |
| `/api/openai-session/ice` | GET    | Return STUN/TURN ICE server config                    |
| `/api/blackboard/init`    | POST   | Initialize blackboard for new exam                    |
| `/api/blackboard/summary` | GET    | Return condensed server-side summary for model        |
| `/api/tools/:tool`        | POST   | Execute model's tool call (e.g., blackboard.write)    |

---

## 🧪 Testing & Validation

### Unit Tests

- Redis blackboard operations (`blackboard.write`, version increment)
- Tool endpoints return correct JSON

### Integration Tests

- Full voice session: Start → Speak → AI → COMPLETE → truncate → next section
- Verify Redis state matches patient dialogue

### Smoke Test

1. Start app and backend
2. Speak: "Bolesť na hrudi."
3. Model should fill `summary.chief_complaint`
4. After `[[COMPLETE: MA]]`, check Redis JSON for update

---

## 🧱 Deployment & Infrastructure

| Component      | Deployment                | Notes                                 |
| -------------- | ------------------------- | ------------------------------------- |
| **Backend**    | Node.js (Docker)          | Exposes /api routes                   |
| **Redis**      | Docker / AWS ElastiCache  | Persistent volume optional            |
| **PostgreSQL** | RDS / Docker              | For encrypted health data persistence |
| **coturn**     | Separate Docker container | TURN relay with secrets in ENV        |
| **Mobile App** | Expo / EAS                | Communicates with backend API         |

### Environment Variables

```ini
OPENAI_API_KEY=
TURN_URI=turn:turn.domain.com:3478
TURN_USER=user
TURN_PASS=pass
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/lifeline_db
JWT_SECRET=your-secret-key
```

---

## ⚠️ Design Philosophy

- **Truth lives on the backend** (Redis blackboard)
- **Frontend is stateless** except for UX (progress, cache)
- **Model never hallucinates data**; it only writes facts via tools
- **Empathy and safety first**: Orchestrator ensures emotionally safe dialogue and red-flag escalation
- **Truncation keeps the model sharp**: short context, stable behavior
- **TURN ensures reliability**: no more ICE failed errors
- **Everything is inspectable, loggable, exportable**

---

## 🔒 Security & Privacy

- **Zero-knowledge architecture**: All health data encrypted client-side
- **End-to-end encryption**: AES-256-GCM for sensitive data
- **Prisma ORM**: Type-safe database queries with SQL injection prevention
- **JWT authentication**: Token-based auth with blacklist support
- **Audit logging**: All data access tracked
- **GDPR compliance**: User data export and deletion endpoints

---

## 📚 Additional Resources

- [Backend Integration Guide](../frontend/INTEGRATION_GUIDE.md)
- [Prisma Migration Guide](../backend/PRISMA_MIGRATION.md)
- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [WebRTC Documentation](https://webrtc.org/)
