const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Middleware to verify user token/session
function verifyToken(req, res, next) {
    if (req.session && req.session.userId) {
        req.userId = req.session.userId;
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
}

router.get('/photo/:photoId', commentController.listByPhoto);
router.post('/', verifyToken, commentController.create);

module.exports = router;