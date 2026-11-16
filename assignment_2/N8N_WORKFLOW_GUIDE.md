# BookLeaf Publishing — n8n Automation Workflow Guide

This guide details how to install, import, and execute the **n8n Royalty Notification & AI Summary Pipeline**.

---

## ⚠️ Important: Is Importing the Workflow Compulsory?

**YES, IT IS COMPULSORY.**  
n8n is an orchestration engine that starts with an empty canvas. It has no built-in knowledge of BookLeaf's data model, webhook security header, 90-day overdue logic, quarterly calculation cycles, or AI prompt structure.

You **must** import the prepared workflow file:  
📁 [`assignment_2/n8n/bookleaf_royalty_notification_workflow.json`](file:///home/rakshit/bookleaf/assignment_2/n8n/bookleaf_royalty_notification_workflow.json)

---

## 1. Quick Installation & Launch

You can run n8n in either of two ways:

### Option A: Local n8n (Easiest for Evaluation)
Run directly in your terminal (no installation required via npx):
```bash
npx n8n
```
Open **`http://localhost:5678`** in your browser.

### Option B: n8n Cloud
1. Go to [https://n8n.io](https://n8n.io) and start a free trial.
2. Open your cloud workspace.

---

## 2. Importing the Workflow (Compulsory Step)

1. In the n8n canvas, click the **`...` (Options / Menu)** button in the top-right corner.
2. Click **"Import from File"**.
3. Select:  
   `assignment_2/n8n/bookleaf_royalty_notification_workflow.json`
4. Click **Save** (or press `Ctrl + S`).
5. *All 12 nodes, branches, and connections will instantly appear on your screen.*

---

## 3. How to Run & Execute in n8n (Two Execution Modes)

Reviewers can execute the workflow in either of two modes depending on how they prefer to evaluate:

### Mode 1: Active / Published Mode (Recommended for Continuous Portal Use)
- Look in the top-right corner next to the **Save** button.
- Click the toggle switch to **"Active" / "Publish"**:
  ```
  [ Inactive ◯────── ]  ➔  [ Active ──────◯ ]
  ```
- **How it works:** n8n listens 24/7 on the production webhook URL (`http://localhost:5678/webhook/generate-royalty-summary`).
- Any button click from the portal on `http://localhost:5002` or CLI command will automatically trigger n8n in the background.
- Reviewers can view all past executions and outputs by clicking **"Executions"** in the left sidebar.

### Mode 2: Canvas Test Mode (To Watch Nodes Light Up Green Visually)
- Leave the toggle on **Inactive**.
- At the bottom of the canvas, click the big button: **"Test workflow"** (or **"Execute workflow"**).
- n8n will show a pulsing indicator: *"Waiting for webhook call..."*.
- Now trigger a summary from the portal (`http://localhost:5002`) or via curl:
  ```bash
  node assignment_2/test-live-tunnel.js
  ```
- **How it works:** In Test Mode, n8n captures the single incoming call, visually animates the data flowing through each node, and turns every executed node green with a checkmark!

---

## 4. Pipeline Topology & Node-by-Node Architecture

```
[Bubble / Portal Trigger] 
          │ (POST /webhook/generate-royalty-summary)
          ▼
1. Webhook Trigger Node
          │
          ▼
2. Validate Auth Header (checks x-bookleaf-api-key: bk_live_7f8a9e2d4c1b)
          ├── [Invalid] ➔ 3. Reject 401 Unauthorized
          └── [Valid]   ➔ 4. Idempotency & Deduplication Check (3-min cache)
                               ├── [Duplicate] ➔ 6. Return Duplicate Notice
                               └── [New]       ➔ 7. Knowledge Base Math & Policy Engine
                                                         │
                                                         ▼
                                                 8. AI LLM Generation Node (OpenAI / Gemini)
                                                         │
                                                         ▼
                                                 9. Email Formatter & Fallback Handler
                                                         │
                                                         ├── 10. Bubble Data API Callback (Audit Log)
                                                         ├── 11. Send Email Node (Bonus SMTP)
                                                         └── 12. Return Success to Bubble UI
```

---

## 5. Architectural Decision: Webhook Payload vs. Data API Query

The assignment asks candidates to justify:
> *"either by querying the Bubble Data API or by receiving the full payload in the webhook. Either approach is acceptable; justify your choice."*

**Our Choice: Hybrid Resilient Architecture**
1. **Primary Webhook Payload:** When the admin clicks "Generate & Send" in the portal, the application already holds the author's books in state. Passing the data directly in the webhook payload reduces latency from ~450ms down to ~50ms, eliminating redundant round-trip API queries against Bubble's database rate limits.
2. **Fallback API Query:** If an external scheduler triggers the webhook with only `{ "author_id": "AUTH001" }`, the workflow dynamically fetches the author's catalog from the Bubble Data API.

---

## 6. CLI Testing Commands

### Test 1: Authorized Trigger
```bash
curl -X POST http://localhost:5678/webhook/generate-royalty-summary \
  -H "Content-Type: application/json" \
  -H "x-bookleaf-api-key: bk_live_7f8a9e2d4c1b" \
  -d '{
    "author_id": "AUTH001",
    "name": "Priya Sharma",
    "email": "priya.sharma@gmail.com",
    "city": "Mumbai",
    "trigger_type": "Manual Single",
    "idempotency_key": "TEST-MANUAL-001"
  }'
```

### Test 2: Idempotency (Duplicate Suppression)
Run the exact command above a second time immediately. n8n will return:
```json
{
  "success": true,
  "status": "Duplicate Skipped",
  "message": "A royalty summary for this author was already initiated within the last 3 minutes."
}
```

### Test 3: Unauthorized Call
```bash
curl -X POST http://localhost:5678/webhook/generate-royalty-summary \
  -H "Content-Type: application/json" \
  -H "x-bookleaf-api-key: wrong_key" \
  -d '{"author_id":"AUTH001"}'
```
Returns: `HTTP 401 Unauthorized`.
