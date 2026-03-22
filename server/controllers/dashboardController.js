const Product         = require('../models/Product');
const ProductionOrder = require('../models/ProductionOrder');
const Sale            = require('../models/Sale');
const Task            = require('../models/Task');
const User            = require('../models/User');
const InventoryLog    = require('../models/InventoryLog');

// ── GET /api/dashboard ────────────────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const now       = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd    = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalProducts, lowStockCount, outOfStockCount,
      activeOrders, completedOrders, pendingOrders,
      totalUsers, activeUsers,
      revenueThisMonth, revenuePrevMonth, revenueTotal,
      paidInvoices, pendingInvoices, overdueInvoices,
      monthlySales, weeklyProduction, categoryDistribution,
      recentOrders, recentInvoices, recentLogs,
      myTasks,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'low_stock' }),
      Product.countDocuments({ status: 'out_of_stock' }),

      ProductionOrder.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
      ProductionOrder.countDocuments({ status: 'completed' }),
      ProductionOrder.countDocuments({ status: 'pending' }),

      User.countDocuments(),
      User.countDocuments({ status: 'active' }),

      Sale.aggregate([{ $match: { status: 'paid', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$total' } } }]),
      Sale.aggregate([{ $match: { status: 'paid', createdAt: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: '$total' } } }]),
      Sale.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),

      Sale.countDocuments({ status: 'paid' }),
      Sale.countDocuments({ status: 'pending' }),
      Sale.countDocuments({ status: 'overdue' }),

      // Last 6 months revenue
      Sale.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Last 7 days production
      ProductionOrder.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dayOfWeek: '$createdAt' }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, planned: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),

      // Product category distribution
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: { $multiply: ['$stock', '$price'] } } } }, { $sort: { count: -1 } }]),

      // Recent orders
      ProductionOrder.find().populate('product', 'name').populate('assignedTo', 'name avatar').sort('-createdAt').limit(5),
      Sale.find().sort('-createdAt').limit(5),

      // Recent inventory logs
      InventoryLog.find().populate('product', 'name').populate('performedBy', 'name').sort('-createdAt').limit(10),

      // Current user tasks (for worker dashboard)
      Task.find({ assignedTo: req.user._id, status: { $ne: 'done' } }).populate('order', 'orderId').sort('dueDate').limit(5),
    ]);

    const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
    const prevMonthRevenue = revenuePrevMonth[0]?.total || 0;
    const revenueGrowth    = prevMonthRevenue > 0
      ? (((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          totalRevenue:    revenueTotal[0]?.total || 0,
          revenueThisMonth: thisMonthRevenue,
          revenueGrowth:   Number(revenueGrowth),
          activeOrders, completedOrders, pendingOrders,
          totalProducts, lowStockCount, outOfStockCount,
          totalUsers, activeUsers,
          paidInvoices, pendingInvoices, overdueInvoices,
        },
        charts: { monthlySales, weeklyProduction, categoryDistribution },
        recent: { orders: recentOrders, invoices: recentInvoices, logs: recentLogs },
        myTasks,
      },
    });
  } catch (err) { next(err); }
};
