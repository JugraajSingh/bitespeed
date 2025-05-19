import express from 'express';
import dotenv from 'dotenv';
import contactRoutes from './routes/contact.route';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3000;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

app.use(express.json());

app.use('/identify', contactRoutes);

app.listen(port, () => {
  console.log(`Server running at ${baseUrl}`);
  console.log(`Contact identify endpoint: ${baseUrl}/identify`);
});