import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { db } from './database/db.js';
import { seedDatabase } from './database/seed.js';
import { sseService } from './services/sseService.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure uploads folder exists and serve statically
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Middlewares with 50mb limit for high-resolution images & PDFs
app.use(cors({
  origin: '*', // Allow Next.js frontend
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initial database seeding if empty
try {
  seedDatabase();
} catch (err) {
  console.warn('Seeder warning:', err.message);
}

// Server-Sent Events (SSE) Route for real-time ticket updates
app.get('/api/realtime/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const authorId = req.query.authorId || null;
  const role = req.query.role || 'guest';

  sseService.addClient(clientId, res, { author_id: authorId, role });

  // Heartbeat every 25 seconds to keep SSE connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseService.removeClient(clientId);
  });
});

// Database Reset Endpoint (Clears all tickets, messages, notes for a clean state)
app.post('/api/database/reset', (req, res) => {
  try {
    db.exec('DELETE FROM internal_notes; DELETE FROM ticket_messages; DELETE FROM tickets;');
    seedDatabase();
    sseService.broadcast('database_reset', {});
    return res.json({ message: 'Database reset: all tickets cleared, clean real-time state.' });
  } catch (err) {
    return res.status(500).json({ error: 'ResetFailed', message: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'healthy',
    service: 'BookLeaf Author Support Portal API',
    timestamp: new Date().toISOString(),
    aiModel: config.geminiModel,
    aiAvailable: !!config.geminiApiKey
  });
});

// Swagger OpenAPI documentation spec
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BookLeaf Publishing - Author Support & Communication Portal API',
    version: '1.0.0',
    description: 'RESTful API powering author-facing and admin-facing portals with AI-assisted response generation and real-time updates.'
  },
  servers: [{ url: `http://localhost:${config.port}`, description: 'Local Development Server' }],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Log in with email/password',
        description: 'Authenticates author or admin and returns JWT token',
        responses: { 200: { description: 'Authenticated with JWT' }, 401: { description: 'Invalid credentials' } }
      }
    },
    '/api/auth/test-accounts': {
      get: {
        summary: 'Get test accounts for 1-click evaluation',
        responses: { 200: { description: 'List of 10 authors and 2 admins' } }
      }
    },
    '/api/books/my-books': {
      get: {
        summary: 'Get author books with royalties and production status',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of published and in-production books with royalty metrics' } }
      }
    },
    '/api/tickets': {
      post: {
        summary: 'Submit a support query (triggers AI auto-classification)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Ticket created with AI category, priority, and draft response' } }
      }
    },
    '/api/tickets/my-tickets': {
      get: {
        summary: 'Get author tickets with messages and statuses',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Author tickets list' } }
      }
    },
    '/api/tickets/{id}/messages': {
      post: {
        summary: 'Send reply in ticket thread (real-time live broadcast to author & admin)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Message sent' } }
      }
    },
    '/api/admin/tickets': {
      get: {
        summary: 'Admin ticket queue with filters (status, category, priority, search, urgency)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Filtered ticket queue' } }
      }
    },
    '/api/admin/tickets/{id}/classification': {
      patch: {
        summary: 'Override AI category and priority score',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Classification updated' } }
      }
    },
    '/api/admin/tickets/{id}/internal-notes': {
      post: {
        summary: 'Add internal note (strictly hidden from author)',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Note saved' } }
      }
    },
    '/api/realtime/stream': {
      get: {
        summary: 'Server-Sent Events (SSE) real-time stream for instant ticket updates without refreshing',
        responses: { 200: { description: 'Event stream established' } }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

// Serve OpenAPI specification
app.get('/api/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

// Serve interactive Swagger UI documentation
app.get('/api-docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BookLeaf API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://bookleafpub.in/favicon.ico" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none !important; }
    .swagger-ui .info .title { color: #eb586f; font-family: sans-serif; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred. Please contact support.'
  });
});

app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`  BookLeaf Backend API running on port ${config.port}`);
  console.log(`  Swagger API Docs: http://localhost:${config.port}/api-docs`);
  console.log(`  Health Check:    http://localhost:${config.port}/api/health`);
  console.log(`=======================================================`);
});
