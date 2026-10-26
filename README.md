# BookLeaf Publishing — Author Support & Communication Portal

A full-stack, enterprise-grade Author Support & Communication Portal designed for **BookLeaf Publishing**. Powered by AI-assisted response generation, real-time ticket streaming, and operations management.

Built for the **BookLeaf Full-Stack Developer Technical Assessment**.

---

## 🌟 Key Features

### 1. Author-Facing Portal
- **Email Authentication & 1-Click Role Switcher:** Pre-loaded with 10 authors and 2 operations admins from the official assessment dataset.
- **My Books & Royalty Intelligence:**
  - Complete catalog breakdown: Title, ISBN, Genre, Publication Date, Status, MRP, Total Copies Sold, Lifetime Royalty Earned (80% net profit), Royalty Paid, and Pending Royalty.
  - **Graceful Handling of Edge Cases:**
    - Titles in production (*Midnight in Mysore*, *Raising Roots*) with visual step-by-step pipeline tracking (Manuscript → Editing → Cover Design → Typesetting → Proofreading → ISBN → Printing → Distribution → Published).
    - Rollover alerts for balances below the ₹1,000 minimum payout threshold.
    - Zero payout and pending status badges.
- **Submit a Support Query:**
  - Dropdown selecting specific published title or General/Account level.
  - Subject and detailed description with real-time AI auto-classification.
  - File attachment support for printing defect photos and verification receipts.
- **My Tickets & Real-Time Sync:**
  - Live ticket status tracking (Open, In Progress, Resolved, Closed).
  - Real-time conversation thread: admin responses stream instantly to the author viewport without requiring a page refresh.

### 2. Admin Operations Portal
- **Triage Ticket Queue:**
  - Multi-faceted filtering by Status, Category, Priority, and Date sorting.
  - Urgency indicators prioritizing Critical and oldest unresolved SLA items.
  - Full-text search across author names, book titles, ticket IDs, and subjects.
- **AI-Powered Auto-Classification:**
  - Automatically categorizes tickets into the 6 official BookLeaf categories:
    1. *Royalty & Payments*
    2. *ISBN & Metadata Issues*
    3. *Printing & Quality*
    4. *Distribution & Availability*
    5. *Book Status & Production Updates*
    6. *General Inquiry*
  - **Admin Override:** Admins can instantly re-classify tickets if needed.
- **AI-Generated Priority Score:**
  - Evaluates urgency (Critical, High, Medium, Low) based on query context (e.g. 6-month royalty delay = Critical, ISBN mismatch = High).
  - **Admin Override:** Admins can override priority score with 1 click.
- **AI-Drafted Responses Grounded in Knowledge Base:**
  - Pre-drafts empathetic, policy-accurate responses adhering to BookLeaf tone guidelines (acknowledges concern, includes verified dates and numbers, provides 48-hour resolution targets, avoids corporate deflection).
  - Admin can inspect, freely edit, or regenerate the draft before dispatching to the author.
- **Confidential Internal Notes:**
  - Operations team can document private notes, bank verification checks, and printer escalations strictly hidden from the author.
- **Ticket Assignment:**
  - Assign tickets across operations leads (*Ankit Verma*, *Pooja Iyer*).

---

## 🎨 Theme & Brand Aesthetics

Matching BookLeaf Publishing (`bookleafpub.in`):
- **Signature Palette:** Warm Coral / Rose Red (`#eb586f`, `#f47285`), blush rose accents (`#fff1f3`, `#fecdd3`), and slate darks (`#1e293b`).
- **Dark & Light Mode Support:** 1-click animated toggle (Sun / Moon) in the top navbar. Features a bespoke obsidian navy (`#0a0e17`) dark palette, deep slate glassmorphism surfaces (`#121826`), glowing coral highlights, and saved localStorage theme persistence.
- **Brand Mark:** Iconic BookLeaf Coral square with white `/` brand typography.
- **Typography:** `Outfit` for geometric headings and `Inter` for clean data legibility.
- **UI Elements:** Smooth elevation cards, pulsing live sync badges, and interactive feedback toasts.

---

## 🏗️ Architecture & Project Structure

```
bookleaf/
├── backend/                        # Express REST API Server
│   ├── src/
│   │   ├── config/index.js         # Environment & server config
│   │   ├── database/
│   │   │   ├── db.js               # Node 24 native node:sqlite database engine
│   │   │   └── seed.js             # Seeder for sample authors, books & tickets
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication & RBAC middleware
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # Login, profile, and test accounts
│   │   │   ├── bookRoutes.js       # Author catalog and royalty summaries
│   │   │   ├── ticketRoutes.js     # Ticket CRUD, replies, and status updates
│   │   │   └── adminRoutes.js      # Ticket queue, overrides, draft regeneration
│   │   ├── services/
│   │   │   ├── aiService.js        # Gemini AI integration with fallback engine
│   │   │   ├── knowledgeBase.js    # BookLeaf knowledge base & context retriever
│   │   │   └── sseService.js       # Server-Sent Events real-time sync
│   │   └── server.js               # Express application entrypoint
│   └── package.json
├── frontend/                       # Next.js 15 (React 19) Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js           # Root layout with fonts & metadata
│   │   │   ├── globals.css         # BookLeaf design system & brand tokens
│   │   │   └── page.js             # Dynamic portal container
│   │   ├── components/
│   │   │   ├── Navbar.js           # Brand header, role switcher & sync status
│   │   │   ├── AuthorPortal/
│   │   │   │   ├── MyBooks.js      # Catalog & royalty financials
│   │   │   │   ├── SubmitTicket.js # Support ticket query form
│   │   │   │   └── MyTickets.js    # Ticket tracking & real-time thread
│   │   │   └── AdminPortal/
│   │   │       ├── TicketQueue.js  # Filterable queue & analytics
│   │   │       └── TicketWorkbench.js # AI draft editor & internal notes
│   │   ├── context/
│   │   │   ├── AuthContext.js      # User session & 1-click test switcher
│   │   │   └── RealtimeContext.js  # Server-Sent Events client listener
│   │   └── services/api.js         # REST API client
│   └── package.json
├── database/                       # Database Resources
│   ├── schema.sql                  # Relational database schema
│   ├── bookleaf_sample_data.json   # Assessment dataset (10 authors, 18 books)
│   └── bookleaf.db                 # SQLite database file
├── package.json                    # Root package with concurrently runner
├── WRITEUP.md                      # Engineering approach & production roadmap
└── README.md                       # Comprehensive project documentation
```

---

## 🚀 Setup & Local Execution

### Prerequisites
- **Node.js**: v20 or v24 (Tested and verified on Node v24.19.0)
- **npm** or **yarn**

### Quick Start (Single Command)

From the project root directory:

```bash
# 1. Install root dependencies
npm install

# 2. Run both Backend API and Frontend concurrently
npm run dev
```

The application will be live at:
- **Frontend Portal:** `http://localhost:3000`
- **Backend API Server:** `http://localhost:5001`
- **Interactive Swagger Docs:** `http://localhost:5001/api-docs`
- **API Health Check:** `http://localhost:5001/api/health`

*(Alternatively, you can run them in separate terminals)*:
```bash
# Terminal 1: Backend
cd backend && node src/server.js

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 🤖 AI Integration & Production Considerations

### 1. Model Choice: Gemini 2.5 Flash
- **Justification:** Fast inference latency (~500ms), exceptional adherence to structured JSON schemas, and highly economical token pricing, making it ideal for high-volume support triage.

### 2. Prompt Engineering & Knowledge Base Grounding
Prompts are grounded with the official BookLeaf policies:
- 80/20 royalty split, net profit formula, 45-day quarterly payout cycle, ₹1,000 threshold.
- In-house Delhi printing, 5–7 day turnaround, free reprints for verified defects.
- Unique ISBN imprint rules, 48-hour escalation timeline for ISBN errors.
- 24–48 hour stock sync for Amazon/Flipkart availability issues.
- Empathetic tone acknowledging frustration before offering transparent solutions.

### 3. Graceful Degradation & Error Handling (Crucial)
If the Gemini API key is missing, unauthorized, rate-limited, or network fails:
- **Zero Downtime:** Ticket creation and admin drafting **never crash**.
- The system automatically activates a knowledge-grounded semantic fallback classifier that evaluates the query and generates accurate, policy-aligned BookLeaf draft responses.

### 4. Cost Awareness & Token Optimization
- Rather than resending the entire knowledge base on every query, the context retriever selectively injects only relevant policy sections based on query keywords (e.g. royalty keywords only retrieve royalty policies).
- Compact JSON schemas minimize output token consumption.

---

## 🔑 Test Credentials (1-Click Switcher Available in UI)

You can switch between any account with **1 click** using the account dropdown in the top navbar, or log in manually with the credentials below:

### Operations Admin Accounts
| Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Ankit Verma** | Operations Lead | `admin@bookleafpub.in` | `admin123` |
| **Pooja Iyer** | Author Relations | `support@bookleafpub.in` | `admin123` |

### Sample Authors (From Assessment Dataset)
| Author ID | Name | City | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| `AUTH001` | Priya Sharma | Mumbai | `priya.sharma@gmail.com` | `Priya Sharma` |
| `AUTH002` | Rohit Kapoor | Delhi | `rohit.kapoor@gmail.com` | `Rohit Kapoor` |
| `AUTH003` | Ananya Reddy | Hyderabad | `ananya.reddy@gmail.com` | `Ananya Reddy` |
| `AUTH004` | Vikram Joshi | Pune | `vikram.joshi@gmail.com` | `Vikram Joshi` |
| `AUTH005` | Meera Nair | Kochi | `meera.nair@gmail.com` | `Meera Nair` |
| `AUTH006` | Arjun Malhotra | Chandigarh | `arjun.malhotra@gmail.com` | `Arjun Malhotra` |
| `AUTH007` | Sneha Kulkarni | Bangalore | `sneha.kulkarni@gmail.com` | `Sneha Kulkarni` |
| `AUTH008` | Farhan Sheikh | Lucknow | `farhan.sheikh@gmail.com` | `Farhan Sheikh` |
| `AUTH009` | Kavita Deshmukh | Nagpur | `kavita.deshmukh@gmail.com` | `Kavita Deshmukh` |
| `AUTH010` | Diya Chatterjee | Kolkata | `diya.chatterjee@gmail.com` | `Diya Chatterjee` |

---

## 📡 REST API Reference

Interactive Swagger documentation is available at `http://localhost:5001/api-docs`.

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Email/password login, returns JWT | Public |
| `POST` | `/api/auth/author/login` | Dedicated author login (`<name>@gmail.com` / Author Name) | Public |
| `POST` | `/api/auth/admin/login` | Operations admin login (`admin` / `admin`) | Public |
| `GET` | `/api/auth/test-accounts` | Returns all 10 authors and 2 admins | Public |
| `GET` | `/api/auth/me` | Current authenticated session | Authenticated |
| `GET` | `/api/books/my-books` | Author books with royalty metrics | Author / Admin |
| `GET` | `/api/books/:id` | Single book details | Author / Admin |
| `POST` | `/api/tickets` | Submit query with optional file attachment (triggers AI triage) | Author |
| `GET` | `/api/tickets/:id/attachment` | View or download file attached by author | Author / Admin |
| `GET` | `/api/tickets/my-tickets` | Author submitted tickets | Author |
| `GET` | `/api/tickets/:id` | Ticket detail with message thread | Author / Admin |
| `POST` | `/api/tickets/:id/messages` | Reply in thread (emits live SSE) | Author / Admin |
| `PATCH` | `/api/tickets/:id/status` | Update ticket status | Author / Admin |
| `GET` | `/api/admin/tickets` | Ticket queue with multi-filters | Admin |
| `PATCH` | `/api/admin/tickets/:id/classification` | Override AI category & priority | Admin |
| `POST` | `/api/admin/tickets/:id/regenerate-draft` | Re-run AI response generation | Admin |
| `POST` | `/api/admin/tickets/:id/assign` | Assign ticket to team member | Admin |
| `POST` | `/api/admin/tickets/:id/internal-notes`| Add private note (hidden from author) | Admin |
| `GET` | `/api/admin/analytics` | High-level operations queue metrics | Admin |
| `GET` | `/api/realtime/stream` | Server-Sent Events (SSE) live stream | Authenticated |
| `POST` | `/api/database/reset` | Resets DB to initial sample dataset | Admin / Public |
