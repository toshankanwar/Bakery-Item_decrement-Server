// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch'; // If using Node >= 18, can omit this and use global fetch
import confirmOrderRouter from './api/confirmOrder.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (default)
app.use(cors());

app.use(bodyParser.json());
app.use('/api', confirmOrderRouter);

app.get('/', (req, res) => res.send('API is running'));

// Self-ping function to keep server awake on free tier
function selfPing() {
  const publicUrl = 'https://bakery-item-decrement-server.onrender.com/';
  fetch(publicUrl)
    .then(res => {
      if (res.ok) {
        console.log(`[KEEP-ALIVE] Self-ping successful at ${new Date().toLocaleString()}`);
      } else {
        console.warn(`[KEEP-ALIVE] Self-ping responded with status ${res.status}`);
      }
    })
    .catch(err => {
      console.error('[KEEP-ALIVE] Self-ping failed:', err);
    });
}

// Schedule self-ping every 9 minutes, start after 10 seconds
setInterval(selfPing, 9 * 60 * 1000); // 9 minutes
setTimeout(selfPing, 10 * 1000); // initial call after 10 seconds

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
