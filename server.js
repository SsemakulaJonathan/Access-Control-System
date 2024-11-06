import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';

const app = express();
const port = 3001;

// Set up lowdb
const adapter = new JSONFile('db.json');
const defaultData = { users: [] }
const db = new Low(adapter, defaultData);
await db.read();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Access Control System API');
});

// Register a new user
app.post('/api/users', async (req, res) => {
  const { name, contact, carPlate, imageUrl } = req.body;
  const newUser = {
    id: uuidv4(),
    name,
    contact,
    carPlate,
    imageUrl,
    createdAt: new Date().toISOString()
  };
  db.data.users.push(newUser);
  await db.write();
  res.status(201).json(newUser);
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(db.data.users);
});

// Get available cameras
app.get('/api/cameras', (req, res) => {
  exec('ffmpeg -list_devices true -f dshow -i dummy', (error, stdout, stderr) => {
    const cameras = [];
    const lines = stderr.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('DirectShow video devices')) {
        i++;
        while (i < lines.length && lines[i].includes('"')) {
          const match = lines[i].match(/"([^"]+)"/);
          if (match) {
            cameras.push({
              id: match[1],
              label: match[1]
            });
          }
          i++;
        }
        break;
      }
    }
    res.json(cameras);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});