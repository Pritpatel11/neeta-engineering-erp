const express = require('express');
const router = express.Router();
const statementController = require('../controllers/statementController');

router.post('/', statementController.createStatement);
router.get('/', statementController.getStatements);
router.put('/:id', statementController.updateStatement);
router.delete('/:id', statementController.deleteStatement);

module.exports = router;
