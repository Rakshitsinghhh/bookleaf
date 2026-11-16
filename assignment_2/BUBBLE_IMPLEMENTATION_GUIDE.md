# BookLeaf Publishing — Bubble.io Step-by-Step Implementation Guide

This guide details how to build and configure the **Author Royalty Dashboard & Automated Notification System** in Bubble.io using the free tier.

---

## 1. Database Setup & CSV Data Import

### Step 1.1: Create Data Types & Fields
In your Bubble Editor, navigate to **Data > Data Types**:

1. **User (Built-in)**
   - Add field: `user_type` (text) — Default: `"Author"`
   - Add field: `author_id` (text)

2. **Author**
   - `author_id` (text)
   - `name` (text)
   - `email` (text)
   - `phone` (text)
   - `city` (text)
   - `joined_date` (date)
   - `books` (List of Books)

3. **Book**
   - `book_id` (text)
   - `author` (Author)
   - `title` (text)
   - `isbn` (text)
   - `genre` (text)
   - `publication_date` (date)
   - `status` (text)
   - `mrp` (number)
   - `author_royalty_per_copy` (number)
   - `total_copies_sold` (number)
   - `total_royalty_earned` (number)
   - `royalty_paid` (number)
   - `royalty_pending` (number)
   - `last_royalty_payout_date` (date)
   - `print_partner` (text)
   - `available_on` (List of texts)

4. **Notification_Log**
   - `log_id` (text)
   - `author` (Author)
   - `author_id` (text)
   - `author_name` (text)
   - `author_email` (text)
   - `trigger_type` (text)
   - `status` (text)
   - `generated_email_content` (text)
   - `sent_timestamp` (date)
   - `error_message` (text)
   - `idempotency_key` (text)

### Step 1.2: Import Sample Data via CSV
In Bubble, navigate to **Data > App Data**:
1. Select the **Author** data type.
2. Click **Upload** and select [`data/Bubble_Authors.csv`](file:///home/rakshit/bookleaf/assignment_2/data/Bubble_Authors.csv).
3. Map CSV headers to Bubble fields.
4. Select the **Book** data type.
5. Click **Upload** and select [`data/Bubble_Books.csv`](file:///home/rakshit/bookleaf/assignment_2/data/Bubble_Books.csv).

---

## 2. Privacy Rules Configuration

In Bubble, navigate to **Data > Privacy Rules**:

### Rule 2.1: Author Type
- **Rule Name:** `Current User is Admin`
  - When: `Current User's user_type is "Admin"`
  - Permissions: Check all (View all fields, Find this in searches, View attached files).
- **Rule Name:** `This Author is Current User`
  - When: `This Author's email is Current User's email`
  - Permissions: Check all.
- **Everyone else (default):**
  - Uncheck all permissions.

### Rule 2.2: Book Type
- **Rule Name:** `Current User is Admin`
  - When: `Current User's user_type is "Admin"`
  - Permissions: Check all.
- **Rule Name:** `This Book belongs to Current User`
  - When: `This Book's author's email is Current User's email`
  - Permissions: Check all.
- **Everyone else (default):**
  - Uncheck all permissions.

---

## 3. UI Construction & Repeating Groups

### 3.1 Author Portal Page (`author-dashboard`)
1. **Consolidated Metric Cards (Top Banner):**
   - Card 1: `Search for Books:sum of total_royalty_earned` (formatted as Currency ₹)
   - Card 2: `Search for Books:sum of royalty_paid`
   - Card 3: `Search for Books:sum of royalty_pending`
2. **Repeating Group: My Books**
   - Type of content: `Book`
   - Data source: `Search for Books` (Constraint: `author = Current User's Author`)
   - Cells: Title, ISBN, Genre, MRP, Sold, Earned, Paid, Pending, Last Payout.
3. **Status Badge Conditionals:**
   - Add a Group or Text element inside the cell for the Status Badge:
     - **Default:** Background Green, Text: "Fully Paid"
     - **Conditional 1 (Yellow):** `Current cell's Book's royalty_pending > 0 and (Current date/time - Current cell's Book's last_royalty_payout_date):days < 90` -> Background Yellow (`#fffbeb`), Text Color `#92400e`, Text: "Pending (In Cycle)".
     - **Conditional 2 (Red):** `Current cell's Book's royalty_pending > 0 and ((Current date/time - Current cell's Book's last_royalty_payout_date):days >= 90 or (Current cell's Book's last_royalty_payout_date is empty and (Current date/time - Current cell's Book's publication_date):days > 90))` -> Background Red (`#fef2f2`), Text Color `#991b1b`, Text: "Overdue Payout".
     - **Conditional 3 (Purple):** `Current cell's Book's status contains "In Production"` -> Background Purple (`#f5f3ff`), Text Color `#5b21b6`, Text: `Current cell's Book's status`.

---

## 4. Bubble API Connector Configuration (n8n Webhook)

Install the **API Connector** plugin from the Bubble plugin marketplace.

### API Definition: `n8n_Automation`
- **Name:** `n8n_Automation`
- **Authentication:** `None or self-handled`
- **Call Name:** `Trigger_Royalty_Summary`
- **Use as:** `Action`
- **Data type:** `JSON`
- **Method:** `POST`
- **URL:** `https://your-n8n-instance.com/webhook/generate-royalty-summary` (or `http://localhost:5002/webhook/generate-royalty-summary`)
- **Headers:**
  - `Content-Type: application/json`
  - `x-bookleaf-api-key: bk_live_7f8a9e2d4c1b`
- **Body:**
```json
{
  "author_id": "<author_id>",
  "trigger_type": "<trigger_type>",
  "idempotency_key": "<idempotency_key>"
}
```
- Parameters:
  - `author_id`: `AUTH001` (Uncheck private)
  - `trigger_type`: `Manual Single` (Uncheck private)
  - `idempotency_key`: `AUTH001-TEST` (Uncheck private)

Click **Initialize call** to verify connection.

---

## 5. Workflows

### Workflow 5.1: "Generate & Send Royalty Summary" Button (Admin Detail Page)
1. **Event:** `When Button "Generate & Send" is clicked`
2. **Action 1:** `Set custom state isLoading = yes` (Disables button and shows spinner to prevent duplicate clicks).
3. **Action 2:** `n8n_Automation - Trigger_Royalty_Summary`
   - `author_id` = `Current Page Author's author_id`
   - `trigger_type` = `"Manual Single"`
   - `idempotency_key` = `Current Page Author's author_id & "-" & Current date/time:extract Unix`
4. **Action 3:** `Create a new Notification_Log` (or wait for n8n callback).
5. **Action 4:** `Show Toast / Alert: "Royalty summary dispatched successfully!"`
6. **Action 5:** `Set custom state isLoading = no`

### Workflow 5.2: "Bulk Trigger All Pending" Button (Admin Main Page)
1. **Event:** `When Button "Bulk Trigger" is clicked`
2. **Action 1:** `Schedule API Workflow on a list` (or loop over `Search for Authors with pending royalties > 0`).
3. **Action 2:** Call the `n8n_Automation - Trigger_Royalty_Summary` action for each eligible author.
