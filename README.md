<div align="center">

<img src="https://civil-os.vercel.app/logo.png" alt="CivilOS" width="80"/>

# CivilOS

**Infrastructure Regulations Terminal**

Upload a structural PDF → AI extracts members → IS code violations → Ghost fix proposals

[![Live](https://img.shields.io/badge/LIVE-civil--os.vercel.app-154212?style=flat-square&labelColor=0a0a0a)](https://civil-os.vercel.app)
[![API](https://img.shields.io/badge/API-civilos.onrender.com-154212?style=flat-square&labelColor=0a0a0a)](https://civilos.onrender.com/health)
[![Stack](https://img.shields.io/badge/React_+_Node_+_pgvector_+_Groq-black?style=flat-square)](.)
[![IS Codes](https://img.shields.io/badge/IS_456_·_IS_1893_·_IS_800-154212?style=flat-square&labelColor=0a0a0a)](.)

</div>

---

```
UPLOAD PDF  →  CHUNK + EMBED  →  GROQ EXTRACT  →  IS CODE CHECK  →  VIOLATIONS  →  AI FIX
    ↓               ↓                  ↓                 ↓               ↓              ↓
 pdf-parse       pgvector         llama-3.3-70b      IS 456:2000      D3 graph      Ghost SVG
```

---

### What happens when you upload a file

Your PDF hits the backend. `pdf-parse` splits it into chunks. Xenova `all-MiniLM-L6-v2` embeds each chunk into 384-dim vectors stored in pgvector. When you open Workshop or Reasoning, one Groq call reads all chunks and returns structured member JSON — IDs, Vu, Vc, clause, status. No regex. No templates.

---

### Modules

**`/ori`** — RAG chatbot. pgvector cosine similarity → top-5 chunks → Groq llama-3.3-70b → token streaming via Socket.io. Ask anything about your structural data.

**`/reasoning`** — D3 force-directed knowledge graph. Every extracted member is a node. Red = Vu > Vc. Click for full shear breakdown. Three diagnostic overlays: shear stress, thermal, rebar density.

**`/workshop`** — IS 1893:2016 load combination simulator. Real members. Live Vu recalculation on every slider tick. Cascade failure log. Six IS presets with real-time fail badges.

**`/ghostfix`** — AI fix proposals. 3D isometric SVG viewport with neon ghost overlays. Cross-section drawings with rebar layout, stirrup spacing, dimension annotations. Commit to project memory with audit trail.

**`/reports`** — PDFKit-generated engineering report. Cover page, stat cards, member results table, violation blocks with IS formula references, IS code standards table.

---

### Stack

```
Frontend   React 18 · TypeScript · Tailwind · D3.js · Socket.io client
Backend    Node.js · Express · Sequelize · Socket.io
Database   PostgreSQL 18 · pgvector (384-dim) · Sequelize ORM
AI         Groq llama-3.3-70b-versatile · llama-4-scout (Vision)
Embed      Xenova/transformers · all-MiniLM-L6-v2 · local inference
Reports    PDFKit · custom engineering layout
Deploy     Vercel · Render · Render PostgreSQL
```

---

### Run it

```bash
# backend
cd civilos-backend && cp .env.example .env
# fill GROQ_API_KEY, DB_*, JWT_SECRET, REFRESH_TOKEN_SECRET
npm install && node server.js

# frontend  
cd civilos-frontend
npm install && npx vite
```

```sql
-- enable pgvector on your postgres
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### IS codes

`IS 456:2000` — shear (Cl. 40.1–40.4), reinforcement ratio (Cl. 26.5.1.1), flexural design  
`IS 1893:2016` — seismic load combinations, storey drift (Cl. 7.11.1)  
`IS 800:2007` — lateral torsional buckling (Cl. 8.2, 8.4.1)  
`IS 2911:2010` — pile capacity: Qa = (Qb + Qs) / FOS  

---

### Structure

```
civilos-backend/src/
  compliance/     IS code engine + beam/column/foundation checkers
  parsers/        pdf-parse + Groq Vision drawing extractor  
  reports/        PDFKit generator with cover page + violation blocks
  config/         db.js · vectorDb.js · env.js
  routes/         REST + extract endpoint

civilos-frontend/src/
  components/     HomeTab · FilesTab · ComplianceTab · ReasoningTab
                  GhostFixTab · LoadCombinationWorkshop · ReportsTab
  api/            typed fetch clients for every endpoint
```

---

<div align="center">

Built by **Narsing Sharma** · B.Tech Civil Engineering · IIT Roorkee 2028

*Legacy tools aren't built for AI. CivilOS is.*

</div>
