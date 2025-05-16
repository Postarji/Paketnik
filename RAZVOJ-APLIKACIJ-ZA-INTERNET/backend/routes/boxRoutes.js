var express = require('express');
var router = express.Router();
var boxController = require('../controllers/boxController.js');

// Box CRUD operations
router.get('/', boxController.list);
router.get('/:id', boxController.show);
router.post('/', boxController.create);
router.put('/:id', boxController.update);
router.delete('/:id', boxController.remove);

// Box unlock operations
router.post('/:id/unlock', boxController.logUnlock);
router.get('/:id/history', boxController.getUnlockHistory);

module.exports = router;
