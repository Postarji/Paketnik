var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');

function needsLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else {
        var err = new Error("You must be logged in to view this page.");
        err.status = 401;
        return next(err);
    }
}

router.get('/', userController.list);
//router.get('/register', userController.showRegister);
//router.get('/login', userController.showLogin);
router.get('/profile', userController.profile);
router.get('/logout', userController.logout);
router.get('/:id', userController.show);

router.post('/', userController.create);
router.post('/login', userController.login);
router.post('/login/face', userController.loginWithFace);
router.post('/face-data', userController.updateFaceData);
// NOVA POT za zahtevo nastavitve 2FA preko telefona
router.post('/request-phone-2fa-setup', needsLogin, userController.requestPhone2FASetup);
// NOVA POT za prijavo z obrazom preko spletne kamere
router.post('/login-face-webcam', userController.loginFaceWebcam);

router.put('/:id', userController.update);

router.delete('/:id', userController.remove);

module.exports = router;
