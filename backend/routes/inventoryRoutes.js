const express = require('express')
const router = express.Router()
const Material = require('../models/Material')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// @desc    Get all materials
// @route   GET /api/inventory
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const materials = await Material.find().sort('-updatedAt')
        res.json(materials)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// @desc    Create/Update material
// @route   POST /api/inventory
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { name, category, currentStock, unit, minLevel } = req.body
        const material = await Material.findOneAndUpdate(
            { name },
            { category, currentStock, unit, minLevel, lastRestockDate: Date.now() },
            { upsert: true, new: true }
        )
        res.status(201).json(material)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

// @desc    Update stock level
// @route   PATCH /api/inventory/:id
router.patch('/:id', protect, adminOnly, async (req, res) => {
    try {
        const { adjustment } = req.body // Can be negative for usage
        const material = await Material.findById(req.params.id)
        if (!material) return res.status(404).json({ message: 'Not found' })
        material.currentStock += adjustment
        await material.save()
        res.json(material)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

module.exports = router
