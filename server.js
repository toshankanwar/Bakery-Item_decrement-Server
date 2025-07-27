// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // <--- add this line
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

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
