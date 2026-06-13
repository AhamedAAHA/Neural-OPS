# Neural OPS — Backend Setup Guide

Autonomous Enterprise Security, Investigation & Crisis Command Network — Band-powered multi-agent backend.

## Architecture

```
Client → Next.js API Routes → Services → Agents (Band + AI)
                ↓                    ↓
           Supabase PG          Band Adapter
                ↓                    ↓
         Prisma ORM            AIML / Featherless / OpenAI
                ↓
         Supabase Realtime (broadcasts)
```

## Quick Start

### 1. Supabase PostgreSQL

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection strings
3. Enable **Realtime** for tables: `AgentMessage`, `Evidence`, `TaskHandoff`, `HumanApproval`, `VoiceCommand`, `Incident`

```bash
# Connection pooler (for app)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 2. Environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, Supabase keys
# Set USE_MOCK_BAND=true for hackathon demo without Band API keys
# Set AUTH_DEV_MODE=true for header-based dev auth
```

### 3. Database Setup

```bash
npm install
npm run db:generate
npm run db:push      # Push schema to Supabase
npm run db:seed      # Seed 4 incidents + agents + evidence
```

### 4. Run

```bash
npm run dev
```

API available at `http://localhost:3000/api/*`

---

## Authentication (Dev Mode)

With `AUTH_DEV_MODE=true`, pass role via headers:

```bash
curl -H "X-User-Role: analyst" http://localhost:3000/api/incidents
curl -H "X-User-Role: executive" -X POST http://localhost:3000/api/approvals/{id}/respond \
  -H "Content-Type: application/json" \
  -d '{"decision":"approved"}'
```

### Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **admin** | Full access — incidents, agents, reports, approvals |
| **analyst** | Create incidents, add evidence, view investigations |
| **executive** | Approve/reject/escalate, generate reports |
| **auditor** | Read-only audit logs, reports, investigation history |

Production: use Supabase Auth JWT via `Authorization: Bearer <token>`.

---

## Band Integration

Band is the **real collaboration layer** — all agent messages flow through `BandAdapter`:

```typescript
interface BandAdapter {
  createRoom(name, metadata): Promise<string>
  recruitAgent(roomId, agent): Promise<void>
  sendMessage(roomId, from, to, content): Promise<string>
  getRoomMessages(roomId): Promise<BandMessage[]>
}
```

- `USE_MOCK_BAND=true` → In-memory `MockBandAdapter` (hackathon default)
- `USE_MOCK_BAND=false` + `BAND_API_KEY` → `RealBandAdapter` (HTTP to Band API)

Every agent action calls `sendMessageToBand()` which:
1. Sends to Band room
2. Persists to `AgentMessage` table
3. Broadcasts via Supabase Realtime

---

## AI Providers

Unified `AIProvider` interface with automatic fallback:

| Agent | Preferred Provider |
|-------|-------------------|
| Incident Commander, Forensics, Legal, Executive | AIML API |
| Compliance, Risk Simulation | Featherless |
| Audit | Local (deterministic) |

```bash
POST /api/ai/complete
{
  "system": "You are a compliance agent",
  "prompt": "Review GDPR exposure",
  "provider": "AIML_API"
}
```

---

## Demo Workflow

```bash
# 1. Create incident (auto-starts Band workflow)
curl -X POST http://localhost:3000/api/incidents \
  -H "X-User-Role: analyst" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vendor ABC suspected of fraud",
    "description": "Suspicious $847K payment to Vendor ABC",
    "type": "Vendor Fraud",
    "severity": "critical"
  }'

# 2. Get full incident with agents, messages, evidence
curl http://localhost:3000/api/incidents/{id} -H "X-User-Role: analyst"

# 3. Get Band message stream
curl http://localhost:3000/api/rooms/{roomId}/messages -H "X-User-Role: analyst"

# 4. Simulate risk scenario
curl -X POST http://localhost:3000/api/risk/simulate \
  -H "X-User-Role: analyst" \
  -H "Content-Type: application/json" \
  -d '{"incidentId":"...","scenario":"freeze"}'

# 5. Executive approval
curl -X POST http://localhost:3000/api/approvals/{id}/respond \
  -H "X-User-Role: executive" \
  -H "Content-Type: application/json" \
  -d '{"decision":"approved","decisionNote":"Freeze payments immediately"}'

# 6. Generate executive report
curl -X POST http://localhost:3000/api/reports/generate \
  -H "X-User-Role: executive" \
  -H "Content-Type: application/json" \
  -d '{"incidentId":"..."}'
```

---

## Voice Commands

```bash
# Transcribe audio
curl -X POST http://localhost:3000/api/voice/transcribe \
  -H "X-User-Role: analyst" \
  -F "audio=@command.wav"

# Process voice command
curl -X POST http://localhost:3000/api/voice/command \
  -H "X-User-Role: analyst" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Start investigation for Vendor ABC fraud"}'

# Create incident from voice (audio upload)
curl -X POST http://localhost:3000/api/voice/incident \
  -H "X-User-Role: analyst" \
  -F "audio=@command.wav"
```

Without `SPEECHMATICS_API_KEY`, mock transcription is used.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/incidents` | Create incident + Band room + start workflow |
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents/:id` | Full incident details |
| POST | `/api/incidents/:id/start` | Start/restart investigation workflow |
| GET | `/api/incidents/:id/evidence` | Incident evidence |
| POST | `/api/agents/recruit` | Recruit agent via Band |
| POST | `/api/agents/message` | Send Band message |
| POST | `/api/agents/handoff` | Task handoff via Band |
| GET | `/api/agents` | List agents |
| GET | `/api/agents/:id` | Agent profile |
| GET | `/api/rooms/:id/messages` | Band collaboration stream |
| POST | `/api/rooms/:id/broadcast` | Broadcast to room |
| POST | `/api/evidence` | Save evidence |
| POST | `/api/risk/analyze` | Risk assessment |
| POST | `/api/risk/simulate` | Scenario simulation |
| POST | `/api/compliance/review` | Compliance findings |
| POST | `/api/legal/review` | Legal findings |
| POST | `/api/approvals/request` | Request human approval |
| POST | `/api/approvals/:id/respond` | Approve/reject/escalate |
| POST | `/api/reports/generate` | Executive report |
| GET | `/api/reports/:id` | Get report |
| POST | `/api/voice/transcribe` | Speechmatics transcription |
| POST | `/api/voice/command` | Route voice intent via Band |
| POST | `/api/voice/incident` | Voice-created incident |
| POST | `/api/ai/complete` | Unified AI completion |
| GET | `/api/ai/providers` | Available AI providers |
| GET | `/api/audit` | Audit logs (auditor role) |

---

## Realtime (Supabase)

Events broadcast on channel `incident:{incidentId}`:

- `agent_message` — New Band message
- `evidence_created` — New evidence
- `task_handoff` — Agent task handoff
- `approval_requested` / `approval_updated`
- `voice_transcript`
- `incident_status` / `risk_update`
- `report_generated`

Frontend subscribe example:

```typescript
const supabase = createClient(url, anonKey)
supabase.channel(`incident:${incidentId}`)
  .on('broadcast', { event: 'agent_message' }, (payload) => {
    console.log('New agent message', payload)
  })
  .subscribe()
```

---

## Agent Tiers (20 Agents)

All implemented as TypeScript classes extending `BaseAgent`:

- **Tier 1 Detection**: SecurityMonitoring, ThreatIntelligence, SocialIntelligence
- **Tier 2 Investigation**: IncidentCommander, DigitalForensics, CommunicationAnalysis, FinancialForensics, IdentityInvestigation, TimelineReconstruction
- **Tier 3 Intelligence**: Correlation, RootCause, ImpactAnalysis, FutureRiskSimulation
- **Tier 4 Governance**: Compliance, Legal, Audit
- **Tier 5 Response**: PRResponse, CustomerCommunication, Remediation, ExecutiveStrategy

Each agent implements: `receiveContext()`, `analyze()`, `sendMessageToBand()`, `handoffTask()`, `recruitAgent()`, `requestHumanApproval()`

---

## Seed Data

4 incidents pre-loaded:
1. Vendor ABC suspected of fraud
2. Customer database breach detected
3. Ransomware activity on finance server
4. Social media reputation attack detected

Includes: Band messages, evidence, handoffs, risk scores, compliance/legal findings, approvals, reports, voice commands, model invocations.

```bash
npm run db:seed
```

---

## Security

- All inputs validated with **Zod**
- Role-based access control on every endpoint
- API keys server-side only (never exposed to frontend)
- Rate limiting on AI and voice endpoints
- Audio upload validation (type + 10MB max)
- Full audit trail in `AuditLog` table
