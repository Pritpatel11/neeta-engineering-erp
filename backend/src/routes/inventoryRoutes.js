const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAllBalances);
router.get('/balances', inventoryController.getAllBalances);
router.get('/:divisionName', inventoryController.getDivisionBalance);
router.post('/update', inventoryController.updateDivisionBalance);

module.exports = router;
