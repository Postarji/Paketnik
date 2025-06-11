var express = require('express');
var router = express.Router();
var boxController = require('../controllers/boxController.js');
var { requireAdmin } = require('../middleware/adminAuth.js');

// Box CRUD operations
router.get('/', boxController.list);
router.get('/available-boxes', boxController.getAvailableBoxes); // Must come before /:id
router.get('/:id', boxController.show);
router.post('/', requireAdmin, boxController.create);
router.put('/:id', requireAdmin, boxController.update);
router.delete('/:id', requireAdmin, boxController.remove);

// Box unlock operations
router.post('/:id/unlock', boxController.logUnlock);
router.get('/:id/unlock-history', boxController.getUnlockHistory);

// Box book management
router.post('/:id/books', boxController.addBooksToBox);
router.delete('/:id/books', boxController.removeBooksFromBox);

module.exports = router;