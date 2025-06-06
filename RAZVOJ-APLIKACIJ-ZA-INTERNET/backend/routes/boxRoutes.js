var express = require('express');
var router = express.Router();
var boxController = require('../controllers/boxController.js');
var { requireAdmin } = require('../middleware/adminAuth.js');

// Box CRUD operations
router.get('/', boxController.list);
router.get('/:id', boxController.show);
router.post('/', requireAdmin, boxController.create);
router.put('/:id', requireAdmin, boxController.update);
router.delete('/:id', requireAdmin, boxController.remove);

// Box unlock operations
router.post('/:id/unlock', boxController.logUnlock);
router.get('/:id/history', boxController.getUnlockHistory);

module.exports = router;