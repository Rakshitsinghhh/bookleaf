# BookLeaf Publishing — Author Support & Communication Portal

BookLeaf is a full-stack author support portal created for the BookLeaf Full-Stack
Developer Technical Assessment. It gives authors a place to view their books and
royalty information, submit support queries, upload evidence, and follow ticket
updates. It also gives operations staff a ticket queue with filtering, AI-assisted
classification, response drafts, assignment, internal notes, and real-time updates.

The application has three parts:

- **Frontend:** Next.js and React author and operations portals.
- **Backend:** Express REST API with JWT authentication, SQLite persistence, file
  uploads, Swagger documentation, and Server-Sent Events (SSE).
- **AI support:** Gemini-powered ticket analysis with a local knowledge-grounded
  fallback so the application can still be demonstrated without an API key.

## Features

### Author portal

- Sign in using one of the seeded author accounts.
- View published and in-production books, ISBNs, publication status, sales, and
  royalty summaries.
- See production stages for books that are not yet published.
- Submit a query about a selected book or a general account question.
- Attach an image or PDF to a ticket, for example evidence of a printing defect.
- View ticket status and the complete conversation thread.
- Receive ticket messages and status changes through the live SSE connection without
  refreshing the page.

### Operations portal

- Sign in as an operations administrator.
- Search and filter tickets by status, category, priority, date, author, book, or
  ticket ID.
- Review AI-generated category, priority, explanation, recommended action, and
  author-facing reply draft.
- Edit or regenerate a draft before sending it.
- Override the category and priority when the AI classification is not appropriate.
- Assign tickets to operations team members.
- Add private internal notes that are never shown to authors.
- Monitor ticket and message updates in real time.

### Assignment policies represented in the application

- Royalties are calculated quarterly and paid within 45 days after the quarter ends.
- The minimum payout is INR 1,000; smaller balances roll over.
- Printing normally takes 5–7 business days. Verified printing defects qualify for
  a free reprint.
- New listings generally appear within 7–10 business days after publication.
- Stock synchronisation issues may take 24–48 hours after re-sync.
- Metadata changes normally take 3–5 business days.
- ISBN-related tickets are treated as high-priority production escalations.

## Technology

- Node.js 24 or later
- Express 4
- Next.js 16 and React 19
- SQLite through Node's built-in `node:sqlite` API
- JWT and bcryptjs authentication
- Gemini API through `@google/genai` (optional for local demonstration)
- Server-Sent Events for real-time updates

## Prerequisites

Install the following before starting:

1. **Node.js 24 or later.** This is required because the backend imports
   `DatabaseSync` from `node:sqlite`. Node 20 is not sufficient for this project.
2. **npm**, which is included with Node.js.
3. A modern browser such as Chrome, Edge, or Firefox.
4. A Gemini API key only if you want to use live Gemini classification and draft
   generation. The local fallback works without one.

Verify the installed versions:

```bash
node --version
npm --version
```

## Installation

### 1. Open the project directory

Clone or copy the repository, then change into its root directory:

```bash
cd /path/to/bookleaf
```

The root directory is the directory containing `package.json`, `backend/`, and
`frontend/`.

### 2. Install root dependencies

The root package contains the development launcher, database utilities, and AI test
script:

```bash
npm install
```

### 3. Install backend dependencies

The backend has its own `package.json`, including Express, file-upload, and Swagger
packages:

```bash
cd backend
npm install
cd ..
```

### 4. Install frontend dependencies

The frontend is a separate Next.js package:

```bash
cd frontend
npm install
cd ..
```

### 5. Configure optional environment variables

The main application uses one global environment file at the project root:
`/path/to/bookleaf/.env`. Create this file beside the root `package.json`, not
inside `backend/` or `frontend/`. The backend loads this root file when the
application starts.

Create a file named `.env` in the project root if you want to customise the local
configuration or enable Gemini:

```dotenv
# Optional: enable live Gemini analysis. Leave blank to use the local fallback.
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Optional local overrides
PORT=5001
CLIENT_URL=http://localhost:3000
JWT_SECRET=replace-this-with-a-local-development-secret
DB_PATH=./database/bookleaf.db
```

Do not commit a real API key or production secret to the repository. If no `.env`
file is created, the backend uses port `5001`, the checked-in SQLite database path,
and the local fallback AI configuration.

#### Separate environment file for `aiml/`

If you run the standalone AI test script from the `aiml/` directory, the
environment file must be created inside that directory:
`/path/to/bookleaf/aiml/.env`.

Use the same Gemini variables in `aiml/.env`:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

This `aiml/.env` file is separate from the global project-root `.env`. To use
`aiml/.env`, run the standalone AI test from inside the `aiml/` directory:

```bash
cd aiml
node test-cases.js
```

Do not commit either `.env` file or any API key.

## Running the application

### Recommended method: start the complete application

From the project root, run:

```bash
npm run dev
```

This command starts both services:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:5001>
- Swagger API documentation: <http://localhost:5001/api-docs>
- Health check: <http://localhost:5001/api/health>

Keep this terminal open while using the application. Press `Ctrl+C` to stop both
development servers.

### Alternative method: start services separately

Use two terminals when you want to see each service's logs independently.

**Terminal 1 — backend:**

```bash
cd /path/to/bookleaf
npm run dev:backend
```

**Terminal 2 — frontend:**

```bash
cd /path/to/bookleaf
npm run dev:frontend
```

The equivalent commands from inside each package are:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

### Start the production-style frontend

Build the Next.js application first, then serve the build:

```bash
cd frontend
npm run build
npm run start
```

The backend still needs to be running separately with `npm run dev:backend` or
`npm start` from `backend/`.

## Database and seed data

SQLite is stored in `database/bookleaf.db`. When the backend starts, it creates the
schema if necessary and seeds the authors, books, and administrator accounts. The
seed operation is safe to run again for restoring the baseline accounts and catalog:

```bash
npm run seed
```

The seed operation does not create sample tickets, messages, or internal notes.
Tickets are created when an author submits a query through the application.

To inspect the database using the project helper:

```bash
npm run db
```

The application also exposes a database reset action in the operations interface.
Resetting removes tickets, messages, and notes, then restores the baseline catalog.
Use it only when you want to clear demonstration data.

## How to demonstrate the application

### Author workflow

1. Start the backend and frontend with `npm run dev`.
2. Open <http://localhost:3000>.
3. Leave the portal set to **Author**, or select **Author Portal** in the navbar.
4. Choose an author from the account selector, or enter an email from the credentials
   table below.
5. Enter the author's name as the password.
6. Open **My Books & Royalties** to review the catalog, production progress, and
   royalty edge cases.
7. Open **Submit Support Query**.
8. Select a book, enter a subject and detailed description, and optionally attach a
   JPG, PNG, or PDF file.
9. Submit the query. The backend stores the ticket and generates its category,
   priority, explanation, recommended action, and reply draft.
10. Open **My Tickets** to see the new ticket and its live conversation.

### Operations workflow

1. Select **Admin Portal** in the navbar.
2. Sign in with an administrator account.
3. Review the ticket queue and use the filters or search box.
4. Open a ticket to inspect the AI analysis and draft response.
5. Edit or regenerate the draft when necessary.
6. Override classification, assign the ticket, add an internal note, or send a
   response.
7. Keep the author portal open in another browser tab to observe SSE updates without
   manually refreshing.

## Test credentials

The database seeder creates these administrator accounts:

| Name | Email | Password |
| --- | --- | --- |
| Ankit Verma (Operations Lead) | `admin@bookleafpub.in` | `admin123` |
| Pooja Iyer (Author Relations) | `support@bookleafpub.in` | `admin123` |

The ten author accounts come from `database/bookleaf_sample_data.json`. For every
author, the password is the author's full name. Full author email/password list:

| Email | Password (author name) |
| --- | --- |
| `priya.sharma@gmail.com` | `Priya Sharma` |
| `rohit.kapoor@gmail.com` | `Rohit Kapoor` |
| `ananya.reddy@gmail.com` | `Ananya Reddy` |
| `vikram.joshi@gmail.com` | `Vikram Joshi` |
| `meera.nair@gmail.com` | `Meera Nair` |
| `arjun.malhotra@gmail.com` | `Arjun Malhotra` |
| `sneha.kulkarni@gmail.com` | `Sneha Kulkarni` |
| `farhan.sheikh@gmail.com` | `Farhan Sheikh` |
| `kavita.deshmukh@gmail.com` | `Kavita Deshmukh` |
| `diya.chatterjee@gmail.com` | `Diya Chatterjee` |

The application also provides an account selector and a public test-account endpoint:

```text
GET http://localhost:5001/api/auth/test-accounts
```

Other accepted demonstration passwords include `author123` for authors and
`admin` for administrators. Use the named passwords above for the clearest
assignment demonstration.

## API reference

Interactive documentation is available at <http://localhost:5001/api-docs>.
The OpenAPI JSON document is available at
<http://localhost:5001/api/openapi.json>.

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Unified login | Public |
| `POST` | `/api/auth/author/login` | Author login | Public |
| `POST` | `/api/auth/admin/login` | Administrator login | Public |
| `GET` | `/api/auth/test-accounts` | List seeded demonstration accounts | Public |
| `GET` | `/api/auth/me` | Read the current authenticated user | Authenticated |
| `GET` | `/api/books/my-books` | Read an author's books and royalties | Author/admin |
| `POST` | `/api/tickets` | Create a support ticket | Author |
| `GET` | `/api/tickets/my-tickets` | Read an author's tickets | Author |
| `GET` | `/api/tickets/:id` | Read a ticket and messages | Author/admin |
| `POST` | `/api/tickets/:id/messages` | Send a ticket reply | Author/admin |
| `PATCH` | `/api/tickets/:id/status` | Update ticket status | Author/admin |
| `GET` | `/api/tickets/:id/attachment` | View or download an attachment | Author/admin |
| `GET` | `/api/admin/tickets` | Read and filter the operations queue | Admin |
| `PATCH` | `/api/admin/tickets/:id/classification` | Override category or priority | Admin |
| `POST` | `/api/admin/tickets/:id/regenerate-draft` | Generate a new reply draft | Admin |
| `POST` | `/api/admin/tickets/:id/assign` | Assign a ticket | Admin |
| `POST` | `/api/admin/tickets/:id/internal-notes` | Add a private internal note | Admin |
| `GET` | `/api/admin/analytics` | Read queue metrics | Admin |
| `GET` | `/api/realtime/stream` | Open the SSE update stream | Authenticated |
| `GET` | `/api/health` | Check API and AI availability | Public |

## Environment and frontend API URL

By default, the frontend sends API requests to
`http://localhost:5001/api`. To run the backend on another host or port, create
`frontend/.env.local` before starting Next.js:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

`NEXT_PUBLIC_API_URL` must include the `/api` suffix. The real-time client derives
the backend origin from the same value.

## Useful npm commands

Run these commands from the project root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start backend and frontend together |
| `npm run dev:backend` | Start only the backend |
| `npm run dev:frontend` | Start only the frontend |
| `npm run seed` | Initialise schema and restore seeded users/books |
| `npm run db` | Run the database inspection helper |
| `npm run test:ai` | Run the AI test cases |

Run these commands from `frontend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production frontend build |
| `npm run start` | Serve the production frontend build |

## Troubleshooting

### `node:sqlite` or `DatabaseSync` is unavailable

Confirm that Node.js is version 24 or newer:

```bash
node --version
```

Install a current Node.js 24 release and run the installation steps again.

### The frontend cannot connect to the API

1. Confirm that the backend terminal is running.
2. Open <http://localhost:5001/api/health> directly.
3. Check that `NEXT_PUBLIC_API_URL` is either unset or exactly
   `http://localhost:5001/api`.
4. Restart the frontend after changing `.env.local`, because Next.js reads public
   environment variables when it starts.

### Gemini analysis is unavailable

This is expected when `GEMINI_API_KEY` is not configured. The backend uses the
local knowledge-grounded fallback for ticket classification and draft generation.
For live Gemini analysis, set both `GEMINI_API_KEY` and `GEMINI_MODEL` in the root
`.env` file and restart the backend.

### Login fails or the database is in an unexpected state

Run the seed command from the project root and restart the backend:

```bash
npm run seed
```

### Port 3000 or 5001 is already in use

Stop the process using the port, or set `PORT` in the root `.env` for the backend.
If the backend port changes, update `NEXT_PUBLIC_API_URL` in
`frontend/.env.local` to match.

## Project structure

```text
bookleaf/
├── aiml/                         # AI test cases and knowledge base experiments
├── backend/
│   ├── src/
│   │   ├── config/               # Environment and server configuration
│   │   ├── database/             # SQLite connection, schema initialisation, seeder
│   │   ├── middleware/           # JWT authentication and role checks
│   │   ├── routes/               # Auth, books, tickets, and admin API routes
│   │   ├── services/             # AI, knowledge-base, and SSE services
│   │   └── server.js             # Express application entry point
│   └── package.json
├── database/
│   ├── bookleaf.db               # Local SQLite database
│   ├── bookleaf_sample_data.json # Seed authors and books
│   └── schema.sql                # Relational schema
├── frontend/
│   ├── src/app/                  # Next.js app entry point and global styles
│   ├── src/components/           # Author and admin portal components
│   ├── src/context/              # Authentication, theme, and SSE state
│   ├── src/services/             # Frontend API client
│   └── package.json
├── scripts/dev.js                # Starts both development services
├── package.json                  # Root scripts and dependencies
└── WRITEUP.md                    # Engineering approach and production roadmap
```

## Submission notes

- Start with `npm run dev` and verify both `http://localhost:3000` and
  `http://localhost:5001/api/health` before demonstrating the project.
- Use an author account to create a ticket, then use an administrator account to
  process it. This demonstrates the complete end-to-end workflow.
- Do not commit `.env`, API keys, or other secrets.
- `WRITEUP.md` contains the design decisions, trade-offs, and production roadmap
  that complement this README.
