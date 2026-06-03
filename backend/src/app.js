import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import memberRoutes from './modules/members/member.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import expenseRoutes from './modules/expenses/expense.routes.js';
import noticeRoutes from './modules/notices/notice.routes.js';
import complaintRoutes from './modules/complaints/complaint.routes.js';
import visitorRoutes from './modules/visitors/visitor.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import invoiceRoutes from './modules/invoices/invoice.routes.js';
import facilityRoutes from './modules/facilities/facility.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import operationsRoutes from './modules/operations/operations.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import governanceRoutes from './modules/governance/governance.routes.js';
import productRoutes from './modules/product/product.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import portalRoutes from './modules/portal/portal.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { attachSocietyContext } from './middlewares/society.js';
import { auditLogger } from './middlewares/auditLogger.js';
import { sanitizeMongo } from './middlewares/sanitize.js';
import { rateLimit } from './middlewares/rateLimit.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeMongo);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(attachSocietyContext);
app.use(auditLogger);

// Global per-IP throttle as a baseline DoS guard (login has its own tighter limiter).
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'clave-society-backend' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/visitors', visitorRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/facilities', facilityRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/operations', operationsRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/governance', governanceRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
