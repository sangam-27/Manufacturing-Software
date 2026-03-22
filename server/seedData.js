require('dotenv').config();
const mongoose = require('mongoose');
const User             = require('./models/User');
const Product          = require('./models/Product');
const ProductionOrder  = require('./models/ProductionOrder');
const Task             = require('./models/Task');
const Sale             = require('./models/Sale');
const Counter          = require('./models/Counter');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear all collections
  await Promise.all([User, Product, ProductionOrder, Task, Sale, Counter].map(M => M.deleteMany({})));
  console.log('🧹 Cleared existing data');

  // ── Users ───────────────────────────────────────────────────────────────────
  const users = await User.create([
    { name: 'Arjun Mehta',   email: 'admin@manufos.com',      password: 'admin123',    role: 'admin',      department: 'Management' },
    { name: 'Priya Sharma',  email: 'priya@manufos.com',      password: 'super123',    role: 'supervisor', department: 'Production' },
    { name: 'Vikram Singh',  email: 'vikram@manufos.com',     password: 'super123',    role: 'supervisor', department: 'Quality' },
    { name: 'Rahul Verma',   email: 'rahul@manufos.com',      password: 'user123',     role: 'user',       department: 'Production' },
    { name: 'Deepa Nair',    email: 'deepa@manufos.com',      password: 'user123',     role: 'user',       department: 'Production' },
    { name: 'Sunita Patel',  email: 'sunita@manufos.com',     password: 'user123',     role: 'user',       department: 'Inventory', status: 'inactive' },
  ]);
  console.log(`👥 Created ${users.length} users`);

  const [admin, sup1, sup2, worker1, worker2] = users;

  // ── Products ─────────────────────────────────────────────────────────────────
  const products = await Product.create([
    { name: 'Steel Bracket A12',     sku: 'SBA-012', category: 'Brackets',  stock: 450, minStock: 100, price: 285,  unit: 'pcs',  createdBy: admin._id },
    { name: 'Aluminum Shaft 200mm',  sku: 'ALS-200', category: 'Shafts',    stock: 38,  minStock: 50,  price: 1240, unit: 'pcs',  createdBy: admin._id },
    { name: 'Gear Assembly G5',      sku: 'GAG-005', category: 'Gears',     stock: 0,   minStock: 20,  price: 3200, unit: 'sets', createdBy: admin._id },
    { name: 'Bearing Kit BK10',      sku: 'BKK-010', category: 'Bearings',  stock: 220, minStock: 80,  price: 890,  unit: 'kits', createdBy: admin._id },
    { name: 'Hydraulic Valve HV3',   sku: 'HVH-003', category: 'Valves',    stock: 67,  minStock: 30,  price: 5600, unit: 'pcs',  createdBy: admin._id },
    { name: 'Drive Belt DB-L',       sku: 'DBD-L01', category: 'Belts',     stock: 310, minStock: 100, price: 420,  unit: 'pcs',  createdBy: admin._id },
    { name: 'Coupling Rigid CR8',    sku: 'CRC-008', category: 'Couplings', stock: 12,  minStock: 25,  price: 1850, unit: 'pcs',  createdBy: admin._id },
    { name: 'Motor Mount MM5',       sku: 'MMM-005', category: 'Mounts',    stock: 180, minStock: 50,  price: 2100, unit: 'pcs',  createdBy: admin._id },
  ]);
  console.log(`📦 Created ${products.length} products`);

  // ── Production Orders ─────────────────────────────────────────────────────────
  const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
  const daysAgo     = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

  const orders = await ProductionOrder.create([
    {
      product: products[0]._id, quantity: 200, assignedTo: worker1._id, supervisor: sup1._id,
      status: 'in_progress', priority: 'high', progress: 65, dueDate: daysFromNow(6),
      createdBy: sup1._id,
      timeline: [
        { stage: 'Order created', completedBy: sup1._id, createdAt: daysAgo(7) },
        { stage: 'Raw material allocated', completedBy: sup1._id, createdAt: daysAgo(5) },
        { stage: 'Production started', completedBy: worker1._id, createdAt: daysAgo(3) },
      ],
    },
    {
      product: products[1]._id, quantity: 50, assignedTo: worker2._id, supervisor: sup2._id,
      status: 'pending', priority: 'medium', progress: 0, dueDate: daysFromNow(14),
      createdBy: sup2._id,
    },
    {
      product: products[3]._id, quantity: 100, assignedTo: worker1._id, supervisor: sup1._id,
      status: 'completed', priority: 'low', progress: 100, dueDate: daysAgo(2),
      createdBy: sup1._id,
      timeline: [{ stage: 'Completed and dispatched', completedBy: sup1._id }],
    },
    {
      product: products[5]._id, quantity: 150, assignedTo: worker2._id, supervisor: sup2._id,
      status: 'in_progress', priority: 'high', progress: 40, dueDate: daysFromNow(8),
      createdBy: admin._id,
    },
    {
      product: products[4]._id, quantity: 20, assignedTo: worker1._id, supervisor: sup1._id,
      status: 'on_hold', priority: 'medium', progress: 25, dueDate: daysFromNow(19),
      createdBy: sup1._id,
      timeline: [{ stage: 'Placed on hold - raw material shortage', completedBy: sup1._id }],
    },
  ]);
  console.log(`🏭 Created ${orders.length} production orders`);

  // ── Tasks ─────────────────────────────────────────────────────────────────────
  await Task.create([
    { title: 'Machine setup for PO-0001',        order: orders[0]._id, assignedTo: worker1._id, priority: 'high',   status: 'in_progress', progress: 70,  dueDate: daysFromNow(2),  createdBy: sup1._id },
    { title: 'Quality check - Bearing Kit batch', order: orders[2]._id, assignedTo: worker2._id, priority: 'medium', status: 'done',        progress: 100, dueDate: daysAgo(2),      createdBy: sup1._id },
    { title: 'Raw material inspection',            order: orders[1]._id, assignedTo: worker1._id, priority: 'high',   status: 'todo',        progress: 0,   dueDate: daysFromNow(4),  createdBy: sup2._id },
    { title: 'Belt assembly line calibration',     order: orders[3]._id, assignedTo: worker2._id, priority: 'medium', status: 'in_progress', progress: 45,  dueDate: daysFromNow(3),  createdBy: sup2._id },
    { title: 'Valve pressure test',                order: orders[4]._id, assignedTo: worker1._id, priority: 'low',    status: 'todo',        progress: 0,   dueDate: daysFromNow(11), createdBy: sup1._id },
    { title: 'Inventory reconciliation',           order: null,           assignedTo: worker2._id, priority: 'low',    status: 'done',        progress: 100, dueDate: daysAgo(1),      createdBy: admin._id },
  ]);
  console.log('✅ Created tasks');

  // ── Invoices / Sales ──────────────────────────────────────────────────────────
  await Sale.create([
    {
      client: 'Tata Autocomp', status: 'paid', dueDate: daysAgo(5), createdBy: admin._id,
      items: [
        { product: products[0]._id, name: products[0].name, sku: products[0].sku, quantity: 50, unitPrice: 285 },
        { product: products[3]._id, name: products[3].name, sku: products[3].sku, quantity: 20, unitPrice: 890 },
      ],
    },
    {
      client: 'Mahindra Parts', status: 'pending', dueDate: daysFromNow(7), createdBy: admin._id,
      items: [{ product: products[5]._id, name: products[5].name, sku: products[5].sku, quantity: 100, unitPrice: 420 }],
    },
    {
      client: 'Bosch India', status: 'overdue', dueDate: daysAgo(7), createdBy: admin._id,
      items: [
        { product: products[4]._id, name: products[4].name, sku: products[4].sku, quantity: 10, unitPrice: 5600 },
        { product: products[2]._id, name: products[2].name, sku: products[2].sku, quantity: 5,  unitPrice: 3200 },
      ],
    },
    {
      client: 'Hero MotoCorp', status: 'paid', dueDate: daysFromNow(11), createdBy: admin._id,
      items: [{ product: products[1]._id, name: products[1].name, sku: products[1].sku, quantity: 30, unitPrice: 1240 }],
    },
    {
      client: 'Bajaj Auto', status: 'draft', dueDate: daysFromNow(14), createdBy: admin._id,
      items: [
        { product: products[6]._id, name: products[6].name, sku: products[6].sku, quantity: 25, unitPrice: 1850 },
        { product: products[7]._id, name: products[7].name, sku: products[7].sku, quantity: 15, unitPrice: 2100 },
      ],
    },
  ]);
  console.log('🧾 Created invoices');

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin      → admin@manufos.com   / admin123');
  console.log('  Supervisor → priya@manufos.com   / super123');
  console.log('  Worker     → rahul@manufos.com   / user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
