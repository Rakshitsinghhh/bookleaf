# BookLeaf Publishing — n8n Automation Workflow Guide

This guide explains the architecture, deployment, and testing of the **n8n Royalty Notification & AI Summary Pipeline**.

---

## 1. Quick Import Instructions

1. Open your **n8n** instance (n8n Cloud free trial or local `npx n8n`).
2. Go to **Workflows > Import from File**.
3. Select [`n8n/bookleaf_royalty_notification_workflow.json`](file:///home/rakshit/bookleaf/assignment_2/n8n/bookleaf_royalty_notification_workflow.json).
4. Click **Save** and toggle the workflow to **Active**.

---

## 2. Environment Variables & Credentials

Set the following variables in n8n (`Settings > Variables` or `.env`):

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `N8N_WEBHOOK_SECRET` | `bk_live_7f8a9e2d4c1b` | Secret token expected in `x-bookleaf-api-key` header. |
| `OPENAI_API_KEY` | `sk-...` | API key for OpenAI LLM (`gpt-4o-mini`). |
| `GEMINI_API_KEY` | `AIza...` | Optional Gemini API key if using Gemini node. |
| `BUBBLE_APP_URL` | `https://your-bubble-app.bubbleapps.io` | Base URL of your Bubble application. |
| `BUBBLE_API_TOKEN` | `bubble_sec_token_...` | API Token generated in Bubble Settings > API. |

---

## 3. Webhook Architecture Decision: Payload vs. Data API Query

The assignment prompt asks:
> *"n8n pulls the author’s complete data — either by querying the Bubble Data API or by receiving the full payload in the webhook. Either approach is acceptable; justify your choice."*

### Architectural Justification:
We designed a **Hybrid Resilient Pattern**:
1. **Primary Pattern (Full Webhook Payload):**
   - **Rationale:** Minimizes latency and eliminates unnecessary HTTP round-trips against Bubble's Data API rate limits. Bubble already holds the author's books and sales in memory when the admin clicks "Generate & Send", making payload passing near-instant (~50ms execution vs ~450ms multi-query latency).
2. **Fallback Pattern (Bubble Data API Query):**
   - **Rationale:** If only `{ "author_id": "AUTH001" }` is transmitted (e.g. from a bulk scheduled cron or external trigger), the workflow dynamically fetches the author and books via `GET /api/1.1/obj/book?constraints=[{"key":"author","constraint_type":"equals","value":"AUTH001"}]`.
   - **Trade-off Evaluation:** This hybrid pattern provides the speed of direct payload passing with the decoupling flexibility of an API query.

---

## 4. Testing the Workflow via cURL

### 4.1 Valid Authorized Single Trigger (Priya Sharma)
```bash
curl -X POST http://localhost:5002/webhook/generate-royalty-summary \
  -H "Content-Type: application/json" \
  -H "x-bookleaf-api-key: bk_live_7f8a9e2d4c1b" \
  -d '{
    "author_id": "AUTH001",
    "trigger_type": "Manual Single",
    "idempotency_key": "AUTH001-TEST-01"
  }'
```
**Expected Response:** HTTP 200 with `{ "status": "Success", "author_id": "AUTH001", "email_content": "..." }`.

### 4.2 Security Test: Missing or Invalid API Key
```bash
curl -X POST http://localhost:5002/webhook/generate-royalty-summary \
  -H "Content-Type: application/json" \
  -H "x-bookleaf-api-key: wrong_token" \
  -d '{ "author_id": "AUTH001" }'
```
**Expected Response:** HTTP 401 Unauthorized.

### 4.3 Idempotency Test: Duplicate Trigger
Run the command from 4.1 twice within 3 minutes with the same `idempotency_key`.  
**Expected Response on 2nd Run:**
```json
{
  "success": true,
  "status": "Duplicate Skipped",
  "message": "A royalty summary for this author was already initiated within the last 3 minutes."
}
```

### 4.4 Error Handling & Fallback Test
```bash
curl -X POST http://localhost:5002/webhook/generate-royalty-summary \
  -H "Content-Type: application/json" \
  -H "x-bookleaf-api-key: bk_live_7f8a9e2d4c1b" \
  -d '{
    "author_id": "AUTH001",
    "simulate_error": true
  }'
```
**Expected Behavior:** Returns HTTP 500 with failure reason and writes a `Failed` entry into the Bubble Notification Log without crashing.
