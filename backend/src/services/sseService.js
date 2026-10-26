// Real-time Event Streaming via Server-Sent Events (SSE)

class SSEService {
  constructor() {
    this.clients = new Map(); // clientId -> { res, authorId, role }
  }

  addClient(clientId, res, user = {}) {
    this.clients.set(clientId, {
      res,
      authorId: user.author_id || null,
      role: user.role || 'guest'
    });

    // Send connection established event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

    // Clean up on disconnect
    res.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  broadcast(eventType, payload, targetAuthorId = null) {
    const data = JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() });
    const message = `event: ${eventType}\ndata: ${data}\n\n`;

    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.res.write(message);
      } catch (err) {
        console.error(`Failed to send SSE to client ${clientId}:`, err.message);
        this.clients.delete(clientId);
      }
    }
  }
}

export const sseService = new SSEService();
