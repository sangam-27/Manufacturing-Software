const BOM     = require('../models/BOM');
const Product = require('../models/Product');

const populate = [
  { path: 'product',             select: 'name sku category price' },
  { path: 'components.material', select: 'name sku price stock unit' },
  { path: 'createdBy',           select: 'name' },
];

// GET /api/bom
exports.getBOMs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const [boms, total] = await Promise.all([
      BOM.find(query).populate(populate).sort('-createdAt')
        .skip((page - 1) * Number(limit)).limit(Number(limit)),
      BOM.countDocuments(query),
    ]);
    res.json({ success: true, data: boms, total });
  } catch (err) { next(err); }
};

// GET /api/bom/:id
exports.getBOM = async (req, res, next) => {
  try {
    const bom = await BOM.findById(req.params.id).populate(populate);
    if (!bom) return res.status(404).json({ success: false, message: 'BOM not found.' });
    res.json({ success: true, data: bom });
  } catch (err) { next(err); }
};

// GET /api/bom/product/:productId
exports.getBOMByProduct = async (req, res, next) => {
  try {
    const bom = await BOM.findOne({ product: req.params.productId }).populate(populate);
    if (!bom) return res.status(404).json({ success: false, message: 'No BOM for this product.' });
    res.json({ success: true, data: bom });
  } catch (err) { next(err); }
};

// POST /api/bom
exports.createBOM = async (req, res, next) => {
  try {
    // Snapshot material names/SKUs + calculate cost
    const componentsWithCost = await Promise.all(
      req.body.components.map(async (comp) => {
        const product = await Product.findById(comp.material);
        return {
          ...comp,
          name: product?.name || '',
          sku:  product?.sku  || '',
        };
      })
    );

    const body = { ...req.body, components: componentsWithCost, createdBy: req.user._id };
    const bom  = await BOM.create(body);

    // Calculate total material cost
    await recalcBOMCost(bom._id);

    await bom.populate(populate);
    res.status(201).json({ success: true, data: bom });
  } catch (err) { next(err); }
};

// PUT /api/bom/:id
exports.updateBOM = async (req, res, next) => {
  try {
    const bom = await BOM.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(populate);
    if (!bom) return res.status(404).json({ success: false, message: 'BOM not found.' });
    await recalcBOMCost(bom._id);
    await bom.populate(populate);
    res.json({ success: true, data: bom });
  } catch (err) { next(err); }
};

// DELETE /api/bom/:id
exports.deleteBOM = async (req, res, next) => {
  try {
    await BOM.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'BOM deleted.' });
  } catch (err) { next(err); }
};

// POST /api/bom/:id/check-availability   check if stock is enough for production qty
exports.checkAvailability = async (req, res, next) => {
  try {
    const { quantity = 1 } = req.body;
    const bom = await BOM.findById(req.params.id).populate('components.material', 'name stock unit');
    if (!bom) return res.status(404).json({ success: false, message: 'BOM not found.' });

    const result = bom.components.map(comp => {
      const needed      = comp.quantity * quantity * (1 + comp.scrapFactor / 100);
      const available   = comp.material?.stock || 0;
      const shortage    = Math.max(0, needed - available);
      return {
        material:   comp.material?.name || comp.name,
        needed:     parseFloat(needed.toFixed(3)),
        available,
        shortage:   parseFloat(shortage.toFixed(3)),
        sufficient: shortage === 0,
      };
    });

    const canProduce = result.every(r => r.sufficient);
    res.json({ success: true, canProduce, components: result });
  } catch (err) { next(err); }
};

// ── Helper: recalculate BOM total cost ──────────────────────────────────────
async function recalcBOMCost(bomId) {
  const bom = await BOM.findById(bomId).populate('components.material', 'price');
  if (!bom) return;

  let materialCost = 0;
  for (const comp of bom.components) {
    const price = comp.material?.price || 0;
    materialCost += comp.quantity * price * (1 + comp.scrapFactor / 100);
  }

  const labor    = bom.laborCost || 0;
  const overhead = ((materialCost + labor) * (bom.overheadPct || 0)) / 100;
  bom.totalMaterialCost = parseFloat(materialCost.toFixed(2));
  bom.totalCost         = parseFloat((materialCost + labor + overhead).toFixed(2));
  await bom.save();
}
