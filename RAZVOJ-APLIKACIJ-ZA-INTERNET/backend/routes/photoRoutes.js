var express = require('express');
// Vključimo multer za file upload
var multer = require('multer');
var upload = multer({dest: 'public/images/'});

var router = express.Router();
var photoController = require('../controllers/photoController.js');

function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        console.log('Session userId:', req.session.userId); // Debugging log
        return next();
    } else{
        var err = new Error("You must be logged in to view this page");
        err.status = 401;
        return next(err);
    }
}

router.get('/', photoController.list);
router.get('/sorted', photoController.listSortedByDate);
router.get('/:id', photoController.show);

router.post('/', requiresLogin, upload.single('image'), photoController.create);

router.put('/:id', photoController.update);

router.delete('/:id', photoController.remove);

router.post('/:id/like', requiresLogin, photoController.like);
router.post('/:id/dislike', requiresLogin, photoController.dislike);
router.post('/:id/flag', requiresLogin, photoController.flag);

module.exports = router;