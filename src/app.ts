import express from 'express';
import { json, urlencoded } from 'body-parser';
import { connectToDatabase } from './db';
import authRoutes from './routes/auth.routes';
import timeAccountRoutes from './routes/timeaccount.routes';
import adminRoutes from './routes/admin.routes';
import { passwordProtect } from './middlewares/password-protect.middleware';

const app = express();

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(passwordProtect);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timeaccounts', timeAccountRoutes);
app.use('/api/admin', adminRoutes);

// Database connection
connectToDatabase()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

export default app;