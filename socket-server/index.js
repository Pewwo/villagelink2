// app.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

const FRONTEND_URL = process.env.CORS_ORIGIN || "*";
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

io.on('error', (error) => {
  console.error('Socket.IO server error:', error);
});

import dotenv from 'dotenv';
dotenv.config();

// MySQL config
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Track connected clients
const connectedClients = new Map();

// ------------------ API ROUTES ------------------ //
app.post('/initialize', async (req, res) => {
  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: 'Client ID is required' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    connectedClients.set(clientId, { connection, socketId: null });
    console.log(`Client ${clientId} initialized successfully`);
    res.json({ success: true, message: 'Client initialized successfully', clientId });
  } catch (error) {
    console.error('Error initializing client:', error);
    res.status(500).json({ error: 'Failed to initialize client' });s
  }
});

app.post('/emit', async (req, res) => {
  const { table, action, data } = req.body;
  if (!table || !action || !data) return res.status(400).json({ error: 'Missing table, action, or data' });

  const eventName = `${action}_${table}`;
  io.emit(eventName, data);

  // Immediately emit refreshData event with updated data to all clients
  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM ${table} ORDER BY updated_at DESC`;
    const [rows] = await connection.execute(query);
    io.emit('refreshData', { table, data: rows });
    await connection.end();
  } catch (error) {
    console.error('Error emitting refreshData:', error);
  }

  if (table === 'comreqs' && action === 'new') {
    const category = data.category?.toLowerCase();
    if (category === 'complaint') io.emit('new_complaint', data);
    if (category === 'request') io.emit('new_request', data);
  }

  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    version: '1.0.0',
    services: { websocket: 'running', database: 'connected', api: 'running' }
  });
});

// ------------------ SOCKET HANDLING ------------------ //
async function fetchNewData(data) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const query = `SELECT * FROM ${data.table || 'villagelink_users'} ORDER BY updated_at DESC`;
    const [rows] = await connection.execute(query);
    io.emit('newData', { table: data.table || 'villagelink_users', data: rows, timestamp: new Date() });
    await connection.end();
  } catch (error) {
    console.error('Error fetching new data:', error);
  }
}

io.on("connection", (socket) => {
  console.log("Socket client connected:", socket.id);

  socket.on('register', (clientId) => {
    if (connectedClients.has(clientId)) {
      connectedClients.get(clientId).socketId = socket.id;
    }
  });

  socket.on('newData', (data) => fetchNewData(data));

  // New event listener for add_user (example)
  socket.on('add_user', async (userData) => {
    try {
      const connection = await mysql.createConnection(dbConfig);
      // Insert user data into database (adjust table and fields as needed)
      const query = 'INSERT INTO villagelink_users (name, email) VALUES (?, ?)';
      await connection.execute(query, [userData.name, userData.email]);
      // Fetch fresh user list
      const [rows] = await connection.execute('SELECT * FROM villagelink_users ORDER BY updated_at DESC');
      // Broadcast updated user list to all clients
      io.emit('users_updated', rows);
      await connection.end();
    } catch (error) {
      console.error('Error handling add_user event:', error);
    }
  });

  socket.on("disconnect", () => {
    for (const [clientId, client] of connectedClients.entries()) {
      if (client.socketId === socket.id) {
        if (client.connection) client.connection.end();
        connectedClients.delete(clientId);
        break;
      }
    }
  });
});
 
// ------------------ POLLING (from server.js) ------------------ //
const POLL_INTERVAL = 3000;
let lastCheckTimes = {
  villagelink_users: new Date(0),
  villagelink_announcements: new Date(0),
  villagelink_comreqs: new Date(0),
  villagelink_emergencies: new Date(0),
  villagelink_faqs: new Date(0),
  villagelink_feedback: new Date(0),
  villagelink_officials: new Date(0),
  villagelink_visitorlogs: new Date(0),
};
const TABLES = Object.keys(lastCheckTimes);

async function fetchAllRows(connection, table) {
  const query = `SELECT * FROM ${table} ORDER BY updated_at DESC`;
  const [rows] = await connection.execute(query);
  return rows;
}
async function fetchNewRows(connection, table, since) {
  const query = `SELECT * FROM ${table} WHERE updated_at > ? ORDER BY updated_at DESC`;
  const [rows] = await connection.execute(query, [since]);
  return rows;
}

async function startPolling() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Connected to MySQL database for polling');

  setInterval(async () => {
    try {
      for (const table of TABLES) {
        const lastCheckTime = lastCheckTimes[table];
        const newRows = await fetchNewRows(connection, table, lastCheckTime);
        if (newRows.length > 0) {
          console.log(`Detected ${newRows.length} new/updated rows in ${table}`);
          const allRows = await fetchAllRows(connection, table);
          io.emit('refreshData', { table, data: allRows });
          lastCheckTimes[table] = new Date();
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, POLL_INTERVAL);
}

// ------------------ START SERVER ------------------ //
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startPolling().catch((err) => {
    console.error('Failed to start polling:', err);
  });
});
