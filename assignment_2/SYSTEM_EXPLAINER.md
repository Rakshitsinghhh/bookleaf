# BookLeaf Publishing — System Explainer & Architecture Walkthrough (Assignment 2)

Welcome! This document explains **what this application does**, **why it was built**, **how all the pieces fit together**, and **how every single requirement from the BookLeaf technical specification PDF is met**.

---

## 1. The Big Picture: What is this Application?

### The Business Context
BookLeaf Publishing is a fast-growing self-publishing house in India and the US. Over **10,000+ authors** publish titles through BookLeaf across Amazon India, Flipkart, Amazon US, and the BookLeaf Store.

Managing royalties and author communications manually across thousands of books is nearly impossible. This application solves that problem by connecting **three powerful systems**:

```
 ┌───────────────────────┐         ┌───────────────────────┐         ┌───────────────────────┐
 │       Bubble.io       │  POST   │          n8n          │  JSON   │       AI Model        │
 │  (Frontend & Database)│────────>│  (Automation Engine)  │────────>│ (OpenAI / Gemini LLM) │
 │                       │ Webhook │                       │ Prompt  │                       │
 │  • Author Portal      │<────────│  • Validates Security │<────────│  • Writes Human-      │
 │  • Admin Portal       │Callback │  • Idempotency Check  │ Response│    Friendly Royalty   │
 │  • Relational DB      │ (Audit) │  • Aggregates Math    │         │    Summary Email      │
 └───────────────────────┘         └───────────────────────┘         └───────────────────────┘
```

1. **Bubble.io (The Application Interface & Database):**
   - Provides the visual portals where authors view their books and where admins manage operations.
   - Acts as the relational database storing Authors, Books, and Notification Logs.
2. **n8n (The Automated Workflow Engine):**
   - The "brain" running in the background.
   - When an admin clicks a button in Bubble, Bubble shoots an HTTP Webhook over to n8n.
   - n8n verifies security, prevents duplicate triggers, runs financial calculations, constructs the AI prompt, calls the AI, logs the status back to Bubble, and dispatches the email.
3. **AI API (OpenAI / Gemini / Anthropic):**
   - Generates personalized, empathetic, mathematically accurate royalty summary emails grounded in BookLeaf's official policies.

---

## 2. The Two Portals: What Users Actually Experience

### A. The Author Portal (Author-Facing)
When an author (e.g., **Priya Sharma**) logs in:
1. **Tenant Data Isolation:** Bubble Privacy Rules ensure Priya can **only** see her own books and financial balances. She cannot see anyone else's data.
2. **Consolidated Financial Summary:**
   - **Total Royalty Earned:** Lifetime gross royalty across all her titles (e.g., ₹19,908).
   - **Royalty Already Disbursed:** What BookLeaf has already transferred to her bank account (e.g., ₹16,338).
   - **Current Pending Balance:** What BookLeaf still owes her (e.g., ₹3,570).
3. **My Books Ledger:**
   - Displays Title, ISBN, Genre, MRP, Copies Sold, and Distribution Channels (Amazon, Flipkart).
4. **Visual Royalty Status Badges:**
   - 🟢 **Green ("Fully Paid"):** Pending royalty is ₹0 (e.g., Farhan Sheikh).
   - 🟡 **Yellow ("Pending - In Cycle"):** Outstanding balance exists, but it is within the normal 90-day quarterly payout cycle (e.g., Priya Sharma's *Whispers of the Ganges*).
   - 🔴 **Red ("Overdue Payout"):** Outstanding balance exists AND last payout was over 90 days ago, OR a published book older than 90 days has never received a single payout (e.g., Ananya Reddy's *Between Two Temples*).
   - 🟣 **Purple ("In Production"):** Books still being edited, designed, or typeset (e.g., Sneha Kulkarni's *Midnight in Mysore* in Cover Design).

---

### B. The Operations Admin Portal (Internal Staff)
When an internal BookLeaf administrator logs in:
1. **Catalog Oversight & KPI Counters:**
   - See totals across all 10 authors and 18 books: Total Authors (10), Total Catalog Books (18), Disbursed Royalties (₹2.33L+), Pending Balance (₹40.8K), and Overdue Flags (2).
2. **Multi-Dimension Filtering & Search:**
   - **Filter by City:** Narrows authors down by Mumbai, Delhi, Hyderabad, Bangalore, etc.
   - **Filter by Payout Status:** Filter by "All", "Fully Paid", "Pending", or "Overdue Payouts".
   - **Real-Time Search:** Instantly search by author name or author ID.
3. **Author Detail Inspection:**
   - Clicking **"Inspect & Trigger"** on any author opens a detailed drawer showing their full catalog, individual book sales, and payout history.
4. **Trigger Royalty Summary (Single Trigger):**
   - Inside the author detail drawer, the admin clicks **"Generate & Send Royalty Summary"**.
   - This dispatches the secured webhook to n8n.
5. **Bulk Trigger (Batch Processing):**
   - A single button on the main admin page: **"Bulk Trigger All Pending"**.
   - Finds all authors who have pending royalties $> 0$, and fires an automated summary run for each eligible author.
6. **Live Notification Audit Log:**
   - A real-time audit ledger showing every summary that has been triggered, the recipient email, trigger mode (Manual Single vs. Bulk), timestamp, status (Success / Failed badge), and a **"View Email"** button to read the generated output.

---

## 3. The Behind-the-Scenes Journey: What Happens When an Admin Clicks "Generate & Send"?

Here is the exact millisecond-by-millisecond execution lifecycle:

```
[Admin Clicks Button in Bubble]
       │
       ▼
Step 1: Bubble UI Non-Blocking State
       • Button disables immediately and shows a loading spinner (prevents double-clicks).
       • Bubble API Connector sends HTTP POST to n8n webhook with header:
         `x-bookleaf-api-key: bk_live_7f8a9e2d4c1b`
       │
       ▼
Step 2: n8n Receives Webhook & Validates Security
       • Checks `x-bookleaf-api-key`.
       • If invalid or missing: instantly rejects with HTTP 401 Unauthorized.
       │
       ▼
Step 3: Idempotency & De-duplication Check
       • Extracts `idempotency_key` (e.g. `AUTH001-20261116`).
       • Checks against an in-memory cache / recent log.
       • If a summary was already run for this author in the last 3 minutes:
         Returns HTTP 200 with `Duplicate Skipped` to prevent spamming the author.
       │
       ▼
Step 4: Financial Metrics & Knowledge Base Policy Engine
       • Calculates total copies sold, total earned, total paid, and total pending.
       • Checks the BookLeaf Policy rules:
         - Quarterly schedule: (Q1: Jan-Mar paid by May 15; Q2: Apr-Jun paid by Aug 15;
           Q3: Jul-Sep paid by Nov 15; Q4: Oct-Dec paid by Feb 15).
         - ₹1,000 threshold check: If pending < ₹1,000, marks as "Rolls over to next quarter".
         - Overdue check: Flags any title > 90 days overdue.
         - Production stage check: Extracts pipeline status (Cover Design, Typesetting).
       │
       ▼
Step 5: AI LLM Inference Call
       • Assembles a prompt grounded strictly in BookLeaf's Knowledge Base.
       • Sends request to LLM (OpenAI `gpt-4o-mini` or Gemini Flash) with temperature 0.3.
       • AI generates a warm, personalized email addressing the author by name.
       │
       ▼
Step 6: Fallback & Resilience Handling
       • If the AI API fails, times out, or has invalid credentials:
         The workflow automatically triggers its fallback branch, generating a verified
         template summary so the process never breaks silently.
       │
       ▼
Step 7: Bubble Data API Callback
       • n8n makes an HTTP POST back to Bubble's Data API:
         `POST /api/1.1/obj/notification_log`
       • Creates an audit record with `status: "Success"`, timestamp, and full email body.
       │
       ▼
Step 8: Bonus Email Node
       • n8n's SMTP/SendGrid node emails the author directly.
       │
       ▼
Step 9: Response to Bubble UI
       • Returns HTTP 200 with `{ success: true, email_preview: "..." }`.
       • Bubble UI hides the spinner, displays a green success toast, and refreshes the log.
```

---

## 4. How the AI Writes Royalty Summaries for Different Edge Cases

The prompt template ([prompt_template.txt](file:///home/rakshit/bookleaf/assignment_2/n8n/prompt_template.txt)) handles every realistic publishing scenario:

| Author & Scenario | What the AI Intelligently Generates |
| :--- | :--- |
| **Priya Sharma (`AUTH001`)**<br>*Active author with pending royalty* | Lists both books (*Whispers of the Ganges*, *The Saffron Diaries*), breaks down ₹19,908 earned, ₹16,338 paid, ₹3,570 pending. Explains that her ₹3,570 pending balance will be paid within the quarterly 45-day window. |
| **Farhan Sheikh (`AUTH008`)**<br>*Fully paid up (Pending = ₹0)* | Highlights that all royalties from *Ghazal of the Forgotten* are 100% paid up to date. Expresses warm gratitude for his creative partnership with BookLeaf. |
| **Ananya Reddy (`AUTH003`)**<br>*Published >90 days ago, never paid (Overdue Red)* | Acknowledges *Between Two Temples*, notes the outstanding ₹2,546 balance, and explicitly states that our accounts team has prioritized her account for expedited verification and disbursement. |
| **Kavita Deshmukh (`AUTH009`)**<br>*Pending balance ₹850 (< ₹1,000 threshold)* | Explains that per BookLeaf's author policy, royalties are disbursed once the ₹1,000 minimum threshold is crossed, and assures her that her ₹850 balance will securely roll over to the next quarter. |
| **Sneha Kulkarni (`AUTH007`)**<br>*Has books in production* | Breaks down her live titles (*The Algorithm of Love*, *Ctrl+Alt+Delete My Ex*), and provides a reassuring update on *Midnight in Mysore*, explaining that it is currently progressing through Cover Design. |

---

## 5. Requirements Compliance Audit (PDF vs. Implementation)

| Section in PDF | Requirement Description | Implementation in this Workspace | Verification Method |
| :--- | :--- | :--- | :--- |
| **A1. Database Design** | Clean separation of Authors, Books, and queryable entities using sample dataset. | Implemented in `assignment_2/data/database_schema.sql` and CSV exports `Bubble_Authors.csv` & `Bubble_Books.csv`. | Inspect CSVs or schema SQL |
| **A2. Author Portal** | Login authentication; author sees only their data; My Books list; Royalty Overview (earned, paid, pending); visual badges (Green, Yellow, Red overdue). | Implemented in `assignment_2/app/public/index.html` & `app.js`. Role switcher simulates tenant isolation. Badges calculate automatically based on 90-day rules. | Run app, switch to AUTH001, AUTH003, AUTH008 |
| **A3. Admin Portal** | Author Overview with summary stats; filterable by city; filterable by payout status; searchable by name; Author Detail View; "Generate & Send" button; "Bulk Trigger" button; Notification Log. | Implemented with live filters, real-time search, detail modal, single trigger, bulk trigger, and live notification audit log. | Run app, test City filter, Payout Status filter, and Bulk Trigger |
| **A4. Privacy Rules** | Author-type users can only access their own data. Admin-type users can access all data. | Full rule formulas documented in `BUBBLE_IMPLEMENTATION_GUIDE.md` and enforced in companion application. | Verify privacy rules in guide |
| **B. n8n Workflow** | Step 1 Webhook; Step 2 Fetch Data; Step 3 AI Processing; Step 4 Output (Notification Log + Bonus SMTP); Step 5 Status Update callback. | Exported in `n8n/bookleaf_royalty_notification_workflow.json` with all 11 nodes, error branches, and callbacks. | Import into n8n or inspect JSON |
| **AI Content** | Personal greeting, book sales summary, earned/paid/pending breakdown, quarterly payout window explanation, production book update, BookLeaf tone. | Tested and verified in `n8n/prompt_template.txt` and companion AI engine. | Click "Inspect & Trigger" and read email preview |
| **C. Webhook Security** | Header authentication / shared secret validation. | Implemented in n8n workflow and companion server via `x-bookleaf-api-key: bk_live_7f8a9e2d4c1b`. Rejects unauthorized with 401. | Tested in `npm run test:assignment_2` |
| **C. Idempotency** | Prevent duplicate triggers when admin clicks twice in succession. | Implemented client-side (button debounce) and server-side in n8n (3-minute sliding window de-duplication). | Tested in `npm run test:assignment_2` |
| **C. Error Handling** | Gracefully handle AI API failure or unreachable Bubble API without infinite spinners. | Try-catch error branch routes to fallback template, logs failure status, and returns clean response. | Toggle "Simulate AI Timeout" in app |
| **Deliverable 1** | Bubble app editor access & live URL with author/admin credentials. | Documented in `assignment_2/README.md` with test credentials. | Review `assignment_2/README.md` |
| **Deliverable 2** | n8n workflow export as JSON file. | Saved at `assignment_2/n8n/bookleaf_royalty_notification_workflow.json`. | Direct JSON file ready to import |
| **Deliverable 3** | Documentation (README) covering schema, integration, prompts, error handling, learning process. | Exhaustively documented in `assignment_2/README.md`, `BUBBLE_IMPLEMENTATION_GUIDE.md`, and `N8N_WORKFLOW_GUIDE.md`. | Review markdown files |
| **Deliverable 4** | Screen Recording (3–5 minutes) Loom script. | Word-for-word timed script provided in `assignment_2/LOOM_WALKTHROUGH_SCRIPT.md`. | Review `LOOM_WALKTHROUGH_SCRIPT.md` |

---

## 6. How to Test Everything Yourself in 2 Minutes

### Step 1: Start the Companion Application
```bash
npm run dev:assignment_2
```
Open **`http://localhost:5002`** in your browser.

### Step 2: Try the Author Experience
1. In the top-right **"Active Role"** dropdown, select **`Priya Sharma (Mumbai)`**.
2. Notice her consolidated earnings: **₹19,908 Earned**, **₹16,338 Paid**, **₹3,570 Pending**.
3. Notice her books: *The Saffron Diaries* has a 🟢 **Green** badge (Fully Paid), while *Whispers of the Ganges* has a 🟡 **Yellow** badge (Pending in cycle).
4. Now switch to **`Ananya Reddy (Hyderabad)`**: Notice her book *Between Two Temples* has a 🔴 **Red Overdue** badge because it was published in 2024 with no payout.
5. Switch to **`Sneha Kulkarni (Bangalore)`**: Notice *Midnight in Mysore* has a 🟣 **Purple** badge showing **"Cover Design"**.

### Step 3: Try the Admin Experience
1. Switch the role dropdown to **`Operations Admin`**.
2. Filter by City: Select **`Mumbai`** to see only Mumbai authors. Reset to **`All Cities`**.
3. Filter by Payout Status: Select **`Overdue Payouts`** to immediately identify the two authors with overdue payouts.
4. Click **"Inspect & Trigger"** on Priya Sharma.
5. Click **"Generate & Send Royalty Summary (n8n Webhook)"**.
6. Watch the button enter a loading state, followed by a toast alert and the **AI Email Preview Modal** displaying the exact formatted royalty summary!
7. Close the modal and check the **Notification Log** table below: a new audit row with status `Success` and timestamp has been added in real time.

### Step 4: Run the Automated Verification Suite
In a second terminal window, run:
```bash
npm run test:assignment_2
```
All 8 automated integration tests will run and pass with a 100% score!
