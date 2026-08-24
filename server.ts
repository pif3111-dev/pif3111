import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'orders.json');

// Ensure db file exists
async function initDb() {
  try {
    await fs.access(DB_FILE);
  } catch (err) {
    await fs.writeFile(DB_FILE, JSON.stringify([]), 'utf-8');
  }
}

async function startServer() {
  await initDb();
  const app = express();
  
  app.use(express.json());

  // --- API Routes ---
  
  // Get all orders
  app.get('/api/orders', async (req, res) => {
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const orders = JSON.parse(data);
      res.json(orders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to read orders' });
    }
  });

  // Create new order
  app.post('/api/orders', async (req, res) => {
    try {
      const newOrder = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...req.body,
        status: '未對帳'
      };
      
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const orders = JSON.parse(data);
      orders.push(newOrder);
      
      await fs.writeFile(DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
      res.status(201).json(newOrder);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Update order completely (edit order)
  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const orders = JSON.parse(data);
      
      const orderIndex = orders.findIndex((o: any) => o.id === id);
      if (orderIndex === -1) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      // Merge updated fields while keeping the original id and createdAt
      orders[orderIndex] = {
        ...orders[orderIndex],
        ...req.body,
        id: orders[orderIndex].id,
        createdAt: orders[orderIndex].createdAt
      };
      
      await fs.writeFile(DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
      res.json(orders[orderIndex]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // Update order status
  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const orders = JSON.parse(data);
      
      const orderIndex = orders.findIndex((o: any) => o.id === id);
      if (orderIndex === -1) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      orders[orderIndex].status = status;
      
      await fs.writeFile(DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
      res.json(orders[orderIndex]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // Delete order
  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const data = await fs.readFile(DB_FILE, 'utf-8');
      let orders = JSON.parse(data);
      
      const initialLength = orders.length;
      orders = orders.filter((o: any) => o.id !== id);
      
      if (orders.length === initialLength) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      
      await fs.writeFile(DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
      res.status(200).json({ message: 'Order deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  // --- Vite Middleware (Development) / Static Files (Production) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
