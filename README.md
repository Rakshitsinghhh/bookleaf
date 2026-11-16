# BookLeaf Publishing — Full-Stack Technical Assessments

Welcome to the technical assessment submission for BookLeaf Publishing. This workspace is organized into two distinct directories to allow reviewers to independently evaluate, run, and test **Assignment 1** and **Assignment 2**.

---

## ⚡ 1-Step Master Setup (For Reviewers)

To automatically install all dependencies across the root, Assignment 1 (backend & Next.js frontend), and Assignment 2 (companion app), seed databases, and generate fresh Bubble CSV files:

```bash
# Run one command:
npm run setup
```
*(Or use `./setup.sh` on Linux/macOS)*

---

## 🚀 Quick Execution Guide

| Application | Command | Access URL & Features |
| :--- | :--- | :--- |
| **Assignment 1**<br>*Author Support Portal* | `npm run dev:assignment_1` | • **Author & Admin UI:** `http://localhost:3000`<br>• **REST API & Swagger Docs:** `http://localhost:5001/api-docs`<br>• Real-time SSE streaming & Gemini classification |
| **Assignment 2**<br>*Royalty Dashboard & n8n* | `npm run dev:assignment_2` | • **Interactive Dashboard:** `http://localhost:5002`<br>• **n8n Webhook Endpoint:** `http://localhost:5002/webhook/generate-royalty-summary`<br>• Tenant isolation, status badges & live email previews |
| **Assignment 1 Tests** | `npm run test:assignment_1` | AI classification, draft reply, and knowledge fallback tests |
| **Assignment 2 Tests** | `npm run test:assignment_2` | Webhook auth (401), 90-day overdue logic, badges, idempotency & bulk trigger |
| **Run All Tests** | `npm run test:all` | Automated health check across all systems |

---

## 📁 Repository Directory Structure

```
bookleaf/
├── setup.sh                                    # 1-click Linux/macOS setup launcher
├── scripts/
│   └── setup.js                                # Cross-platform automated workspace installer
│
├── assignment_1/                               # Technical Assignment 1: Support & Ticketing Portal
│   ├── BookLeaf_Technical_Assignment_1.pdf     # Original assignment specification
│   ├── README.md                               # Comprehensive Assignment 1 technical documentation
│   ├── WRITEUP.md                              # Architectural approach & engineering decisions
│   ├── frontend/                               # Next.js 16 + React 19 Author & Ops Portals
│   ├── backend/                                # Express REST API, SQLite, JWT, SSE streaming
│   ├── aiml/                                   # Gemini AI classification, reply drafts & fallback
│   ├── database/                               # Seed scripts & SQLite relational database
│   └── scripts/                                # Dev launchers & database explorer
│
├── assignment_2/                               # Technical Assignment 2: Royalty Dashboard & Automation
│   ├── README.md                               # Master technical documentation & evaluation rubric guide
│   ├── SYSTEM_EXPLAINER.md                     # Plain-English system breakdown & requirements audit
│   ├── BUBBLE_IMPLEMENTATION_GUIDE.md          # Field-by-field Bubble.io schema & privacy rules manual
│   ├── N8N_WORKFLOW_GUIDE.md                   # n8n node architecture, security & testing guide
│   ├── LOOM_WALKTHROUGH_SCRIPT.md              # 3–5 minute timed presentation script for Loom video
│   ├── test-live-tunnel.js                     # Script to test live n8n tunnel webhook
│   ├── data/
│   │   ├── bookleaf_sample_data.json           # Original dataset (10 authors, 18 books)
│   │   ├── Bubble_Authors.csv                  # 1-click upload for Bubble Author database
│   │   ├── Bubble_Books.csv                    # 1-click upload for Bubble Book database
│   │   ├── Bubble_Notification_Logs.csv        # Seed CSV for Bubble notification logs
│   │   └── database_schema.sql                 # Relational SQL schema reference
│   ├── n8n/
│   │   ├── bookleaf_royalty_notification_workflow.json  # Standards-compliant n8n workflow export
│   │   └── prompt_template.txt                 # Knowledge Base grounded AI prompt template
│   └── app/                                    # Interactive Companion Prototype
│       ├── server.js                           # Express server, n8n webhook bridge & Bubble API mock
│       ├── public/                             # Responsive Author & Admin portals with live triggers
│       └── test/test-webhook.js                # Automated test suite (security, idempotency, edge cases)
│
└── package.json                                # Unified root orchestrator with dev & test scripts
```

---

## 📊 Comparative Assessment Matrix

| Dimension | Assignment 1 | Assignment 2 |
| :--- | :--- | :--- |
| **System Focus** | Author Support Ticketing & Operations Workbench | Author Royalty Dashboard & Automated Notifications |
| **Primary Platforms**| Next.js 16 (React 19) + Express + SQLite | Bubble.io + n8n + AI API |
| **Real-Time / Automation** | Server-Sent Events (SSE) live ticket updates | n8n Webhook, Callback loop, Bonus SMTP |
| **AI Integration** | Gemini Flash ticket classification & draft responses | Knowledge Base grounded AI royalty summaries |
| **Key Policies Enforced** | 48hr SLA, Free Reprint for defects, ISBN escalations | 80/20 net split, Quarterly 45d payout, ₹1k threshold |
| **Status Indicators** | Open, In Review, Escalated, Resolved | Green (Paid), Yellow (In Cycle), Red (Overdue), Purple (In Prod) |
| **Test Coverage** | AI test cases (`npm run test:assignment_1`) | Webhook & idempotency suite (`npm run test:assignment_2`) |

---

## 🔍 How to Review & Evaluate Assignment 1

1. Start the Assignment 1 development stack:
   ```bash
   npm run dev:assignment_1
   ```
2. Open **`http://localhost:3000`** in your browser.
3. Test Author Portal:
   - Sign in as `priya.sharma@gmail.com` / `BookLeaf2026!`.
   - View registered titles, royalties, and submit a query with an image/PDF attachment.
4. Test Operations Portal:
   - Switch to Operations mode: `admin_ops@bookleaf.in` / `AdminSecret2026!`.
   - Inspect AI classification, edit AI-generated draft responses, and review real-time updates via SSE.
5. Interactive Swagger API Docs:
   - Visit `http://localhost:5001/api-docs` to test all REST endpoints.
6. Documentation & Architecture:
   - Read [`assignment_1/README.md`](assignment_1/README.md) and [`assignment_1/WRITEUP.md`](assignment_1/WRITEUP.md).

---

## 🔍 How to Review & Evaluate Assignment 2

1. Start the Assignment 2 companion server:
   ```bash
   npm run dev:assignment_2
   ```
2. Open **`http://localhost:5002`** in your browser.
3. Test the Author Experience:
   - Switch between authors using the top-right **"Active Role"** dropdown (e.g. Priya Sharma, Ananya Reddy, Sneha Kulkarni).
   - Observe tenant data isolation, summary metrics, and visual status badges:
     - 🟢 **Green ("Fully Paid"):** Pending royalty is ₹0 (Farhan Sheikh).
     - 🟡 **Yellow ("Pending in Cycle"):** Within the 90-day quarterly window (Priya Sharma).
     - 🔴 **Red ("Overdue Payout"):** Overdue payouts $>90$ days (Ananya Reddy, Arjun Malhotra).
     - 🟣 **Purple ("In Production"):** Pipeline stage tracker (*Midnight in Mysore* in Cover Design).
4. Test the Admin Operations Portal:
   - Switch role to **Operations Admin**.
   - Filter by city (e.g. Mumbai) and payout status (e.g. Overdue).
   - Click **"Inspect & Trigger"** on any author ➔ Click **"Generate & Send Royalty Summary"**.
   - Watch the button show a loading state, trigger the n8n webhook, open the **AI Email Preview Modal**, and record an entry into the Notification Log table.
5. Test n8n Workflow Export:
   - File location: [`assignment_2/n8n/bookleaf_royalty_notification_workflow.json`](assignment_2/n8n/bookleaf_royalty_notification_workflow.json).
   - Ready for 1-click import into n8n Cloud or local n8n (`http://localhost:5678`).
6. Run Automated Test Suite:
   ```bash
   npm run test:assignment_2
   ```
7. Documentation & Guides:
   - System Breakdown: [`assignment_2/SYSTEM_EXPLAINER.md`](assignment_2/SYSTEM_EXPLAINER.md)
   - Bubble Setup Manual: [`assignment_2/BUBBLE_IMPLEMENTATION_GUIDE.md`](assignment_2/BUBBLE_IMPLEMENTATION_GUIDE.md)
   - n8n Guide: [`assignment_2/N8N_WORKFLOW_GUIDE.md`](assignment_2/N8N_WORKFLOW_GUIDE.md)
   - Loom Video Script: [`assignment_2/LOOM_WALKTHROUGH_SCRIPT.md`](assignment_2/LOOM_WALKTHROUGH_SCRIPT.md)
