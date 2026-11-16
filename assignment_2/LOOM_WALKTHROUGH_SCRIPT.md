# BookLeaf Publishing — Assignment 2 Loom Walkthrough Script (3–5 Minutes)

Use this structured script to record your 3–5 minute Loom demonstration for the BookLeaf review committee.

---

### Timing & Sequence Overview

| Timestamp | Visual Screen | Topic & Narrative Cues |
| :--- | :--- | :--- |
| **0:00 – 0:45** | System Architecture & Intro | Welcome, role, tech stack overview (Bubble.io + n8n + AI). |
| **0:45 – 1:45** | Author Portal Walkthrough | Author login, metrics, "My Books", Green/Yellow/Red status badges. |
| **1:45 – 2:45** | Admin Portal & Filtering | City filter, status filter, search, KPI counters, author detail modal. |
| **2:45 – 3:45** | Triggering n8n AI Summary | Click "Generate & Send", webhook execution, prompt grounding, AI email preview. |
| **3:45 – 4:30** | Error Handling & Idempotency | De-duplication test (double-click prevention), simulated timeout logging. |
| **4:30 – 5:00** | Conclusion & Hand-off | Architecture recap, export files checklist, thank you. |

---

### Word-for-Word Narration Script

#### Part 1: Introduction (0:00 – 0:45)
> *"Hello BookLeaf team! My name is [Your Name], and this is my walkthrough of Assignment 2 for the Full-Stack Developer position: the **Author Royalty Dashboard & Automated Notification System**.*  
> *BookLeaf's current operations rely heavily on Bubble.io for author-facing experiences and n8n for enterprise workflow automation. For this assessment, I built a relational architecture in Bubble, paired it with a robust n8n automation pipeline with webhook security and idempotency, and integrated an AI generation engine grounded strictly in BookLeaf's Knowledge Base.*  
> *Let's start by looking at the Author Portal."*

#### Part 2: Author Portal (0:45 – 1:45)
*(Action: Navigate to Author Portal tab. Select Priya Sharma).*  
> *"Here on the Author Portal, each author is greeted with a personalized view. Bubble privacy rules ensure that an author can only access their own records.*  
> *At the top, we see consolidated lifetime metrics across their catalog: Total Royalty Earned (₹19,908), Royalty Already Disbursed (₹16,338), and their Current Pending Balance of ₹3,570.*  
> *Looking at the books table, notice the dynamic visual badges:*  
> *• Whispers of the Ganges has a Yellow badge: it has a pending balance, but its last payout on October 15 was within the normal 90-day quarterly window.*  
> *• The Saffron Diaries has a Green badge: royalties are fully paid up.*  
> *(Action: Switch role dropdown to AUTH003 - Ananya Reddy)*  
> *Now let's switch to Ananya Reddy. Notice her book Between Two Temples displays a Red Overdue Badge. Why? Because the book was published in July 2024, has ₹2,546 pending, and has never had a payout recorded—well beyond our 90-day SLA.*  
> *(Action: Switch role to Sneha Kulkarni)*  
> *And for Sneha Kulkarni, her thriller Midnight in Mysore clearly displays an 'In Production - Cover Design' badge, reassuring the author of its current pipeline stage."*

#### Part 3: Admin Operations Portal (1:45 – 2:45)
*(Action: Switch tab to Admin Portal).*  
> *"Now let's switch to the Admin Portal used by the BookLeaf operations desk.*  
> *Across the top, operations staff have real-time KPI metrics: 10 authors, 18 books, over ₹2.33 lakhs disbursed, ₹40,830 pending, and 2 accounts flagged overdue.*  
> *The ledger is filterable:*  
> *(Action: Change City filter to 'Mumbai')*  
> *Filtering by city immediately narrows the roster to Mumbai authors.*  
> *(Action: Change Payout Status filter to 'Overdue')*  
> *Filtering by 'Overdue' instantly surfaces the two authors requiring immediate operational intervention: Ananya Reddy and Arjun Malhotra.*  
> *Admins can also search in real time by name or author ID."*

#### Part 4: Triggering n8n AI Summary (2:45 – 3:45)
*(Action: Reset filter, click 'Inspect & Trigger' on Priya Sharma).*  
> *"Now let's inspect Priya Sharma's account and trigger an AI royalty summary.*  
> *When I click 'Generate & Send Royalty Summary', the frontend enters a loading state to prevent double-clicks, and dispatches a secured POST webhook to n8n containing the author ID and an idempotency token.*  
> *(Action: Click button, wait for modal preview).*  
> *And here is the AI-generated email preview:*  
> *Notice how it satisfies every BookLeaf Knowledge Base requirement:*  
> *1. Personalized greeting to Priya Sharma in Mumbai.*  
> *2. Detailed breakdown of both her published titles, copies sold, and earnings.*  
> *3. Consolidated totals.*  
> *4. Explicit payout timeline: explaining that her ₹3,570 pending balance will be paid within the quarterly 45-day window.*  
> *5. Warm BookLeaf sign-off.*  
> *Simultaneously, the audit table below updates with a Success status and exact timestamp."*

#### Part 5: Error Handling & Idempotency (3:45 – 4:30)
> *"In production, resilience is critical.*  
> *If an admin clicks 'Generate & Send' twice in quick succession, our n8n idempotency node checks the token against a sliding window and skips duplicate runs, preventing authors from receiving repeated emails.*  
> *(Action: Check 'Simulate AI Timeout' toggle and trigger).*  
> *Furthermore, if the downstream AI API fails or times out, our error branch captures the incident, writes a 'Failed' entry to the Notification Log with the failure reason, and gracefully informs the admin without breaking the UI."*

#### Part 6: Wrap-Up & Submission (4:30 – 5:00)
*(Action: Click n8n Workflow tab).*  
> *"All deliverables are ready for review: the complete `bookleaf_royalty_notification_workflow.json` export file, the Bubble schema and CSV files, the test suite, and the step-by-step documentation.*  
> *Thank you for your time, and I look forward to discussing both Assignment 1 and Assignment 2 with the founders!"*
