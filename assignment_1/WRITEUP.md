# BookLeaf Publishing — Architectural Approach & Engineering Write-Up

**Candidate Position:** Full-Stack Developer  
**Project:** Author Support & Communication Portal  

---

### 1. Approach & Prioritization
BookLeaf Publishing operates at high operational scale (1,200+ monthly titles, 22,000+ catalog, thousands of authors across India and the US). Author queries directly impact author trust, catalog availability, and brand reputation. 

In approaching this solution, I prioritized:
1. **AI Integration Quality & Deterministic Grounding (25% weight):**  
   AI must not be an afterthought or a raw LLM prompt. The system strictly adheres to the official BookLeaf Knowledge Base (80/20 royalty formula, quarterly payout window, ₹1,000 threshold, 48-hour SLA for escalations, free reprint policy). Crucially, the AI proposes responses as drafts that human operations staff can inspect, refine, or override before anything reaches an author.
2. **Graceful Degradation & High Availability:**  
   If the LLM API is rate-limited, unauthenticated, or down, author ticket creation must **never fail**. I architected a dual-engine AI service: attempting Gemini 2.5 Flash / 1.5 Flash first, and automatically degrading to a local knowledge-grounded semantic classifier and response generator with 100% uptime.
3. **Real-Time Synchronicity:**  
   Authors should never have to manually refresh to see responses. I implemented Server-Sent Events (SSE) broadcasting ticket status transitions and messages instantly across both author and admin viewports.
4. **Product Thinking for Edge Cases:**  
   The provided dataset features crucial real-world edge cases: books in production (e.g. *Midnight in Mysore* in Cover Design, *Raising Roots* in Typesetting) with no sales yet; royalties under the ₹1,000 threshold that roll over to the next quarter; and pending payouts vs. fully settled titles. Each is rendered with contextual visual cues (production steppers, rollover notices, platform sync statuses).

---

### 2. Architecture Decisions & Trade-Offs

| Decision | Selection | Rationale & Trade-Off |
| :--- | :--- | :--- |
| **Backend Framework** | Node.js + Express (REST) | Lightweight, predictable REST API conventions, native SSE streaming support, zero lock-in. |
| **Database Engine** | SQLite (Node 24 `node:sqlite`) | Zero native C++ compilation lag, embedded relational schema with foreign key cascades, instant portability for evaluators without configuring PostgreSQL/Docker. |
| **Real-Time Layer** | Server-Sent Events (SSE) | HTTP-native, automatic reconnection, transparent through corporate firewalls and proxies without WebSocket protocol upgrade complexities. |
| **Frontend Framework** | Next.js 15 (React 19) + Vanilla CSS | Server/Client components, responsive layout, fast client-side reactivity, matching BookLeaf's brand aesthetics (#eb586f coral gradients). |
| **AI Integration** | Gemini 2.5 Flash + Fallback Engine | Low-latency (~500ms), low-cost token consumption, JSON schema mode enforcement, paired with deterministic rule fallback. |

---

### 3. Cost-Conscious AI Token Strategy
Rather than stuffing the entire knowledge base into every inference call:
- **Modular Policy Retrieval:** The query is semantically scanned, and only the relevant policy slice (e.g., Royalty Policy vs. ISBN Policy vs. Printing & Quality) is injected into the context window.
- **Structured JSON Schema:** Compact schema output minimizes completion tokens and eliminates parsing errors.
- **Admin Caching:** Regenerate draft is an explicit user action rather than continuous polling.

---

### 4. Roadmap to Production Scale
If evolving this system for BookLeaf's enterprise deployment:
1. **Vector RAG & Embeddings:** Store full author contracts, ISBN logs, and courier tracking in pgvector or Pinecone to auto-resolve stock and tracking tickets automatically.
2. **Automated Platform Sync Webhooks:** Direct API integrations with Amazon SP-API and Flipkart Marketplace to automatically trigger re-syncs when availability tickets are raised.
3. **WhatsApp Business API Integration:** Since Indian authors heavily use WhatsApp, wire inbound WhatsApp messages directly into the ticket queue with AI drafts sent to operations for 1-click approvals.
