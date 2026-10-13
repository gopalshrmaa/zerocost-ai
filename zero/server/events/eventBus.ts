import { Response } from 'express';

export interface FinOpsEvent {
  id: string;
  type: 
    | 'cost_updated'
    | 'resource_updated'
    | 'utilization_updated'
    | 'anomaly_detected'
    | 'optimization_found'
    | 'optimization_applied'
    | 'prediction_updated'
    | 'alert_created'
    | 'heartbeat';
  timestamp: string;
  provider?: string;
  payload: Record<string, any>;
}

class EventBus {
  private clients: Set<Response> = new Set();

  addClient(res: Response) {
    this.clients.add(res);

    // Send initial handshake
    this.sendToClient(res, {
      id: `handshake_${Date.now()}`,
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      payload: { status: 'connected', clientsCount: this.clients.size }
    });

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(event: FinOpsEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  private sendToClient(res: Response, event: FinOpsEvent) {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (e) {
      this.clients.delete(res);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const eventBus = new EventBus();
