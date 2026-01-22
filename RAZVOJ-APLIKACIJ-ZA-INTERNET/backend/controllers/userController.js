var UserModel = require('../models/userModel.js');
const fetch = require('node-fetch'); //za klice na Python API: npm install node-fetch
const FormData = require('form-data'); //dodaj v includes  TODO!
const { Readable } = require('stream'); //pretvorba base64 v stream

const PYTHON_API_URL = "http://localhost:8080"; //kasneje prilagodim TODO
/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    /**
     * userController.list()
     */
    list: function (req, res) {
        UserModel.find(function (err, users) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            return res.json(users);
        });
    },

    /**
     * userController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            return res.json(user);
        });
    },

    /**
     * userController.create()
     */
    create: async function (req, res) {
        try {
            // Check if username already exists
            const existingUser = await UserModel.findOne({ 
                $or: [
                    { username: req.body.username },
                    { email: req.body.email }
                ]
            });

            if (existingUser) {
                if (existingUser.username === req.body.username) {
                    return res.status(400).json({
                        message: 'Username already taken'
                    });
                }
                if (existingUser.email === req.body.email) {
                    return res.status(400).json({
                        message: 'Email already registered'
                    });
                }
            }

            var user = new UserModel({
                username: req.body.username,
                password: req.body.password,
                email: req.body.email
            });

            const savedUser = await user.save();
            return res.status(201).json(savedUser);
        } catch (err) {
            if (err.code === 11000) {
                // Duplicate key error
                const field = Object.keys(err.keyPattern)[0];
                return res.status(400).json({
                    message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
                });
            }
            return res.status(500).json({
                message: 'Error when creating user',
                error: err.message
            });
        }
    },

    /**
     * userController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            user.username = req.body.username ? req.body.username : user.username;
			user.password = req.body.password ? req.body.password : user.password;
			user.email = req.body.email ? req.body.email : user.email;
			
            user.save(function (err, user) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating user.',
                        error: err
                    });
                }

                return res.json(user);
            });
        });
    },

    /**
     * userController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        UserModel.findByIdAndRemove(id, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the user.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    },

    showRegister: function(req, res){
        res.render('user/register');
    },

    showLogin: function(req, res){
        res.render('user/login');
    },

    login: function(req, res, next){
        UserModel.authenticate(req.body.username, req.body.password, function(err, user){
            if(err || !user){
                var err = new Error('Wrong username or password');
                err.status = 401;
                return next(err);
            }
            req.session.userId = user._id;
            //res.redirect('/users/profile');
            return res.json(user);
        });
    },

    profile: function(req, res,next){
        UserModel.findById(req.session.userId)
        .exec(function(error, user){
            if(error){
                return next(error);
            } else{
                if(user===null){
                    var err = new Error('Not authorized, go back!');
                    err.status = 400;
                    return next(err);
                } else{
                    //return res.render('user/profile', user);
                    return res.json(user);
                }
            }
        });  
    },

    logout: function(req, res, next){
        if(req.session){
            req.session.destroy(function(err){
                if(err){
                    return next(err);
                } else{
                    //return res.redirect('/');
                    return res.status(201).json({});
                }
            });
        }
    },

    loginWithFace: function(req, res, next) {
        if (!req.body.faceData) {
            return res.status(400).json({
                message: 'Face data is required'
            });
        }

        UserModel.find({}, function(err, users) {
            if (err) {
                return res.status(500).json({
                    message: 'Error finding users',
                    error: err
                });
            }

            // Find user with matching face data
            // In a real application, you would use a proper face recognition library 
            // to compare face embeddings. This is just a simplified example.
            const user = users.find(u => u.faceData && u.faceData === req.body.faceData);

            if (!user) {
                var err = new Error('Face not recognized');
                err.status = 401;
                return next(err);
            }

            req.session.userId = user._id;
            return res.json(user);
        });
    },

    updateFaceData: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        if (!req.body.faceData) {
            return res.status(400).json({
                message: 'Face data is required'
            });
        }

        UserModel.findById(req.session.userId, function(err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error finding user',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            user.faceData = req.body.faceData;

            user.save(function(err, updatedUser) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error updating face data',
                        error: err
                    });
                }
                return res.json(updatedUser);
            });
        });
    },

    requestPhone2FASetup: async function(req, res) {
        const userIdFromSession = req.session.userId;
        if (!userIdFromSession) {
            return res.status(401).json({ message: "Niste prijavljeni." });
        }

        try {
            const user = await UserModel.findById(userIdFromSession);
            if (!user) {
                return res.status(404).json({ message: "Uporabnik ni najden." });
            }

            // Klic na Python API za začetek 2FA (kot da bi to bila mobilna naprava)
            const apiResponse = await fetch(`${PYTHON_API_URL}/initiate_2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.username }) // Uporabi username ali _id Python API
            });

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                return res.status(apiResponse.status).json({ message: "Napaka pri komunikaciji s Python API: " + (data.detail || apiResponse.statusText) });
            }
            
            // challenge_id lahko shranim v sejo ali uporabniški model kasneje
            // req.session.faceChallengeId = data.challenge_id; 

            console.log(`[NodeJS] Initiated 2FA for ${user.username}, challenge_id: ${data.challenge_id}`);
            return res.status(200).json({ 
                message: "Zahteva za nastavitev 2FA preko telefona je bila uspešno posredovana. Challenge ID: " + data.challenge_id + ". Sledite navodilom na mobilni napravi (simulirano).",
                challenge_id: data.challenge_id 
            });

        } catch (error) {
            console.error("[NodeJS] Error in requestPhone2FASetup:", error);
            return res.status(500).json({ message: "Interna napaka strežnika pri zahtevi za telefon." });
        }
    },
     loginFaceWebcam: async function(req, res, next) {
        const { username, imageDataB64 } = req.body; // imageDataB64 bo base64 string slike

        if (!username || !imageDataB64) {
            return res.status(400).json({ message: "Manjkata uporabniško ime ali podatki slike." });
        }

        try {
            // 1. Klic na Python API za initiate_2fa
            const initiateResponse = await fetch(`${PYTHON_API_URL}/initiate_2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: username })
            });
            const initiateData = await initiateResponse.json();

            if (!initiateResponse.ok) {
                return res.status(initiateResponse.status).json({ message: "Python API /initiate_2fa error: " + (initiateData.detail || initiateResponse.statusText) });
            }
            const challengeId = initiateData.challenge_id;
            console.log(`[NodeJS] loginFaceWebcam: Got challenge_id ${challengeId} for user ${username}`);

            // 2. Priprava slike za pošiljanje na /verify_face
            // Pretvorba base64 v Buffer in nato v FormData
            const imageBuffer = Buffer.from(imageDataB64.split(',')[1], 'base64'); // Odstrani 'data:image/jpeg;base64,' del
            
            const formData = new FormData();
            // Ustvari stream iz bufferja, da lahko določi ime datoteke in tip
            const imageStream = Readable.from(imageBuffer);
            formData.append('file', imageStream, {
                filename: `${username}_verify.jpg`,
                contentType: 'image/jpeg', // Ali 'image/png' odvisno od zajema
            });
            
            // 3.klic na Python API za /verify_face
            const verifyResponse = await fetch(`${PYTHON_API_URL}/verify_face/${challengeId}`, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders() // To je potrebno za node-fetch s form-data
            });
            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
                 return res.status(verifyResponse.status).json({ message: "Python API /verify_face error: " + (verifyData.message || verifyData.detail || verifyResponse.statusText), pythonResponse: verifyData });
            }

            // 4. Preverjanje odgovora in prijava uporabnika
            if (verifyData.verified_user === username && verifyData.message.includes("successfully")) { // Prilagodit TODO 
                console.log(`[NodeJS] loginFaceWebcam: Face verified for ${username}`);
                // Najdi uporabnika v bazi in ustvari sejo (podobno kot v navadni login funkciji)
                UserModel.findOne({ username: username }).exec(function(err, user) {
                    if (err || !user) {
                        var authError = new Error('Uporabnik po obrazni prijavi ni najden.');
                        authError.status = 401;
                        return next(authError);
                    }
                    req.session.userId = user._id;
                    return res.json(user); // Vrni podatke o uporabniku
                });
            } else {
                console.log(`[NodeJS] loginFaceWebcam: Face verification failed for ${username}. API response:`, verifyData);
                var authFailedError = new Error('Neuspešna prijava z obrazom. Obraz ni prepoznan ali se ne ujema.');
                authFailedError.status = 401;
                return next(authFailedError);
            }

        } catch (error) {
            console.error("[NodeJS] Error in loginFaceWebcam:", error);
            return res.status(500).json({ message: "Interna napaka strežnika pri prijavi z obrazom." });
        }
    },


};
