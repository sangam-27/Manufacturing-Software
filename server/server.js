const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const mongoSanitize= require('express-mongo-sanitize');
const rateLimit    = require('express-rate-limit');
require('dotenv').config();

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');

const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/users');
const productRoutes    = require('./routes/products');
const productionRoutes = require('./routes/production');
const taskRoutes       = require('./routes/tasks');
const billingRoutes    = require('./routes/billing');
const dashboardRoutes  = require('./routes/dashboard');
const supplierRoutes      = require('./routes/suppliers');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const bomRoutes           = require('./routes/bom');
const machineRoutes       = require('./routes/machines');
const shiftRoutes         = require('./routes/shifts');
const notificationRoutes  = require('./routes/notifications');
const reportRoutes        = require('./routes/reports');

connectDB();
const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET','POST'] },
});
io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);
  socket.on('join-order', (id)   => socket.join('order:' + id));
  socket.on('join-room',  (room) => socket.join(room));
  socket.on('disconnect', ()     => console.log('❌ Disconnected:', socket.id));
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15*60*1000, max: 500 }));
app.use((req,_res,next) => { req.io = io; next(); });

app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/products',        productRoutes);
app.use('/api/production',      productionRoutes);
app.use('/api/tasks',           taskRoutes);
app.use('/api/billing',         billingRoutes);
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/suppliers',       supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/bom',             bomRoutes);
app.use('/api/machines',        machineRoutes);
app.use('/api/shifts',          shiftRoutes);
app.use('/api/notifications',   notificationRoutes);
app.use('/api/reports',         reportRoutes);

app.get('/api/health', (_,res) => res.json({ status:'OK', modules:14, time: new Date() }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('🚀 ManufactureOS API → http://localhost:' + PORT);
  console.log('📦 14 modules active');
});
module.exports = { app, io };
