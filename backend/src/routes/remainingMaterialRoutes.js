const express = require('express');
const router = express.Router();
const remainingMaterialController = require('../controllers/remainingMaterialController');

router.post('/', remainingMaterialController.createRemainingMaterial);
router.get('/', remainingMaterialController.getRemainingMaterials);
router.put('/:id', remainingMaterialController.updateRemainingMaterial);
router.delete('/:id', remainingMaterialController.deleteRemainingMaterial);

module.exports = router;
