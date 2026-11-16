# BookLeaf Publishing — Full-Stack Technical Assessments

Welcome to the technical assessment submission for BookLeaf Publishing. This repository is cleanly organized into two distinct directories to allow reviewers to independently evaluate **Assignment 1** and **Assignment 2**.

```
bookleaf/
├── assignment_1/       # Assignment 1: Author Support & Communication Portal
│   ├── BookLeaf_Technical_Assignment_1.pdf
│   ├── README.md       # Comprehensive Assignment 1 technical documentation
│   ├── WRITEUP.md      # Architectural approach & engineering decisions
│   ├── frontend/       # Next.js 16 / React 19 Author & Operations Portals
│   ├── backend/        # Express REST API, SQLite, JWT, SSE real-time streaming
│   ├── aiml/           # Gemini AI classification, draft generation & fallback
│   └── database/       # Seed scripts & sample dataset (10 authors, 18 books)
│
├── assignment_2/       # Assignment 2: Royalty Dashboard & Automated Notification System
│   ├── README.md       # Master Assignment 2 documentation & review guide
│   ├── SYSTEM_EXPLAINER.md             # Plain-English system breakdown & requirements audit
│   ├── BUBBLE_IMPLEMENTATION_GUIDE.md  # Step-by-step Bubble.io configuration manual
│   ├── N8N_WORKFLOW_GUIDE.md           # n8n node architecture, security & testing
│   ├── LOOM_WALKTHROUGH_SCRIPT.md      # 3–5 min video walkthrough script
│   ├── data/
│   │   ├── bookleaf_sample_data.json   # Seed dataset (10 authors, 18 books)
│   │   ├── Bubble_Authors.csv          # 1-click Bubble database upload
│   │   ├── Bubble_Books.csv            # 1-click Bubble database upload
│   │   └── database_schema.sql         # Relational schema reference
│   ├── n8n/
│   │   ├── bookleaf_royalty_notification_workflow.json  # Full n8n workflow export
│   │   └── prompt_template.txt                          # Grounded AI prompt
│   └── app/            # Interactive companion prototype (Bubble + n8n simulation)
│       ├── server.js   # Express server, n8n webhook endpoint & Bubble API mock
│       ├── public/     # Responsive Author & Admin portals with live triggers
│       └── test/       # Automated test suite (security, idempotency, edge cases)
│
└── package.json        # Unified root orchestrator
```

---

## Comparative Assessment Matrix

| Dimension | Assignment 1 | Assignment 2 |
| :--- | :--- | :--- |
| **System Focus** | Author Support Ticketing & Operations Workbench | Author Royalty Dashboard & Automated Notifications |
| **Primary Platforms**| Next.js 16 (React 19) + Express + SQLite | Bubble.io + n8n + AI API |
| **Real-Time / Automation** | Server-Sent Events (SSE) live ticket updates | n8n Webhook, Callback loop, Bonus SMTP |
| **AI Integration** | Gemini Flash ticket classification & draft responses | Knowledge Base grounded AI royalty summaries |
| **Key Policies Enforced** | 48hr SLA, Free Reprint for defects, ISBN escalations | 80/20 net split, Quarterly 45d payout, ₹1k threshold |
| **Status Indicators** | Open, In Review, Escalated, Resolved | Green (Paid), Yellow (In Cycle), Red (Overdue), Purple (In Prod) |
| **Test Coverage** | AI test cases (`npm run test:assignment1`) | Webhook & idempotency suite (`npm run test:assignment2`) |

---

## Quick Start: Testing Assignment 1

Assignment 1 is an enterprise-grade full-stack web application featuring an Author Portal and an Operations Ticket Workbench.

### 1. Launch Assignment 1 Dev Server:
```bash
npm run dev:assignment1
```
- **Author Portal:** `http://localhost:3000` (Login with any seeded author, e.g. `priya.sharma@gmail.com` / `BookLeaf2026!`)
- **Operations Portal:** `http://localhost:3000` (Switch to Admin mode: `admin_ops@bookleaf.in` / `AdminSecret2026!`)
- **REST API & Swagger Docs:** `http://localhost:5001/api-docs`

### 2. Run Assignment 1 AI & Database Tools:
```bash
# Query the database
npm run dev:assignment1 -- db

# Run AI classification test cases
npm run test:assignment1
```
*For complete architecture and features, see [`assignment_1/README.md`](file:///home/rakshit/bookleaf/assignment_1/README.md) and [`assignment_1/WRITEUP.md`](file:///home/rakshit/bookleaf/assignment_1/WRITEUP.md).*

---

## Quick Start: Testing Assignment 2

Assignment 2 provides all required deliverables for Bubble.io and n8n, along with an interactive companion web app that runs locally.

### 1. Launch Assignment 2 Companion Server:
```bash
npm run dev:assignment2
```
Open **`http://localhost:5002`** in your browser.

- **Author Portal:** Switch roles in the dropdown to test tenant data isolation (e.g. Priya Sharma, Ananya Reddy, Sneha Kulkarni). Observe the Green, Yellow, and Overdue Red badges.
- **Admin Portal:** Filter by city, filter by payout status, search by author name, and inspect author details.
- **Trigger AI Royalty Summary:** Click "Inspect & Trigger" on any author, then click "Generate & Send Royalty Summary" to execute the n8n webhook and inspect the AI-generated email preview modal!
- **Bulk Trigger:** Trigger summaries across all authors with pending balances in 1 click.
- **Test Error Handling:** Toggle "Simulate AI Timeout" to verify graceful degradation and logging.

### 2. Run Assignment 2 Automated Test Suite:
```bash
npm run test:assignment2
```
Validates:
- Webhook security (rejects unauthorized calls with HTTP 401).
- Payout status calculations and badge assignments (Green, Yellow, Red, In Production).
- Webhook execution & AI summary generation.
- Idempotency & duplicate suppression (3-minute sliding window).
- Admin bulk trigger execution.

---

## Assignment 2 Deliverables Summary

1. **Bubble.io Implementation:**
   - Detailed setup guide: [`assignment_2/BUBBLE_IMPLEMENTATION_GUIDE.md`](file:///home/rakshit/bookleaf/assignment_2/BUBBLE_IMPLEMENTATION_GUIDE.md)
   - Ready-to-import CSVs: [`assignment_2/data/Bubble_Authors.csv`](file:///home/rakshit/bookleaf/assignment_2/data/Bubble_Authors.csv) and [`assignment_2/data/Bubble_Books.csv`](file:///home/rakshit/bookleaf/assignment_2/data/Bubble_Books.csv)
2. **n8n Automation Workflow:**
   - Production JSON export: [`assignment_2/n8n/bookleaf_royalty_notification_workflow.json`](file:///home/rakshit/bookleaf/assignment_2/n8n/bookleaf_royalty_notification_workflow.json)
   - Execution & deployment manual: [`assignment_2/N8N_WORKFLOW_GUIDE.md`](file:///home/rakshit/bookleaf/assignment_2/N8N_WORKFLOW_GUIDE.md)
3. **Screen Recording:**
   - Complete 3–5 minute presentation script: [`assignment_2/LOOM_WALKTHROUGH_SCRIPT.md`](file:///home/rakshit/bookleaf/assignment_2/LOOM_WALKTHROUGH_SCRIPT.md)
4. **Complete Report:**
   - Full technical report: [`assignment_2/README.md`](file:///home/rakshit/bookleaf/assignment_2/README.md)
