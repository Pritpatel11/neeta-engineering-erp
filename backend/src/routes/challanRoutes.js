const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');

router.post('/', challanController.createChallan);
router.get('/', challanController.getChallans);
router.put('/:id', challanController.updateChallan);
router.delete('/:id', challanController.deleteChallan);

module.exports = router;
