const Sale    = require('../models/Sale');
const PO      = require('../models/PurchaseOrder');

// GET /api/reports/gst?month=3&year=2026
exports.getGSTReport = async (req, res, next) => {
  try {
    const month = Number(req.query.month || new Date().getMonth() + 1);
    const year  = Number(req.query.year  || new Date().getFullYear());
    const from  = new Date(year, month - 1, 1);
    const to    = new Date(year, month, 0, 23, 59, 59);

    const [sales, purchases] = await Promise.all([
      Sale.find({ status: { $in: ['paid', 'pending'] }, createdAt: { $gte: from, $lte: to } })
        .populate('items.product', 'name sku category')
        .sort('createdAt'),
      PO.find({ status: { $in: ['received', 'partial'] }, createdAt: { $gte: from, $lte: to } })
        .populate('supplier', 'name gstNumber')
        .sort('createdAt'),
    ]);

    // Output tax (sales)
    const outputTax = sales.reduce((s, inv) => s + (inv.gstAmount || 0), 0);
    const outputTaxable = sales.reduce((s, inv) => s + (inv.subtotal || 0), 0);

    // Input tax credit (purchases)
    const inputTax = purchases.reduce((s, po) => s + (po.gstAmount || 0), 0);
    const inputTaxable = purchases.reduce((s, po) => s + (po.subtotal || 0), 0);

    // Net GST payable
    const netGST = outputTax - inputTax;

    // Group sales by GST rate for GSTR-1 style breakdown
    const salesByRate = {};
    for (const inv of sales) {
      const rate = inv.gstRate || 18;
      if (!salesByRate[rate]) salesByRate[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 };
      salesByRate[rate].taxable += inv.subtotal || 0;
      salesByRate[rate].cgst    += (inv.gstAmount || 0) / 2;
      salesByRate[rate].sgst    += (inv.gstAmount || 0) / 2;
      salesByRate[rate].total   += inv.total || 0;
      salesByRate[rate].count   += 1;
    }

    // B2B invoice list (GSTR-1 B2B)
    const b2bInvoices = sales.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate:   inv.createdAt,
      client:        inv.client,
      clientGST:     inv.clientGST || '',
      taxable:       inv.subtotal,
      gstRate:       inv.gstRate,
      cgst:          (inv.gstAmount || 0) / 2,
      sgst:          (inv.gstAmount || 0) / 2,
      igst:          0,
      total:         inv.total,
      status:        inv.status,
    }));

    // Monthly trend (last 6 months)
    const trendFrom = new Date(year, month - 7, 1);
    const monthlySales = await Sale.aggregate([
      { $match: { status: { $in: ['paid', 'pending'] }, createdAt: { $gte: trendFrom, $lte: to } } },
      {
        $group: {
          _id:       { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue:   { $sum: '$subtotal' },
          gst:       { $sum: '$gstAmount' },
          total:     { $sum: '$total' },
          invoices:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        period: { month, year, from, to },
        summary: {
          outputTaxable: parseFloat(outputTaxable.toFixed(2)),
          outputTax:     parseFloat(outputTax.toFixed(2)),
          inputTaxable:  parseFloat(inputTaxable.toFixed(2)),
          inputTax:      parseFloat(inputTax.toFixed(2)),
          netGSTPayable: parseFloat(netGST.toFixed(2)),
          totalInvoices: sales.length,
          totalPOs:      purchases.length,
        },
        salesByRate:  Object.values(salesByRate),
        b2bInvoices,
        monthlyTrend: monthlySales,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/reports/financial?year=2026  — full year P&L
exports.getFinancialReport = async (req, res, next) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const from = new Date(year, 0, 1);
    const to   = new Date(year, 11, 31, 23, 59, 59);

    const [monthlySales, monthlyPurchases, topProducts, topClients] = await Promise.all([
      Sale.aggregate([
        { $match: { status: { $in: ['paid', 'pending'] }, createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$subtotal' }, gst: { $sum: '$gstAmount' }, total: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),
      PO.aggregate([
        { $match: { status: { $in: ['received', 'partial'] }, createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $month: '$createdAt' }, cost: { $sum: '$subtotal' }, gst: { $sum: '$gstAmount' }, total: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),
      Sale.aggregate([
        { $match: { status: { $in: ['paid', 'pending'] }, createdAt: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }, qty: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      Sale.aggregate([
        { $match: { status: { $in: ['paid', 'pending'] }, createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$client', revenue: { $sum: '$total' }, invoices: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Build full 12-month array
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = MONTHS.map((name, i) => {
      const s = monthlySales.find(x => x._id === i + 1)    || { revenue: 0, gst: 0, total: 0, count: 0 };
      const p = monthlyPurchases.find(x => x._id === i + 1) || { cost: 0, gst: 0, total: 0, count: 0 };
      const grossProfit = s.revenue - p.cost;
      return {
        month: name, monthNum: i + 1,
        revenue: s.revenue, salesGST: s.gst, salesTotal: s.total, invoiceCount: s.count,
        purchases: p.cost, purchaseGST: p.gst, purchaseTotal: p.total, poCount: p.count,
        grossProfit, grossMargin: s.revenue > 0 ? parseFloat(((grossProfit / s.revenue) * 100).toFixed(1)) : 0,
      };
    });

    const totalRevenue  = monthly.reduce((s, m) => s + m.revenue, 0);
    const totalPurchase = monthly.reduce((s, m) => s + m.purchases, 0);
    const totalProfit   = totalRevenue - totalPurchase;

    res.json({
      success: true,
      data: {
        year,
        annual: {
          revenue:     parseFloat(totalRevenue.toFixed(2)),
          purchases:   parseFloat(totalPurchase.toFixed(2)),
          grossProfit: parseFloat(totalProfit.toFixed(2)),
          grossMargin: totalRevenue > 0 ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0,
        },
        monthly,
        topProducts,
        topClients,
      },
    });
  } catch (err) { next(err); }
};
