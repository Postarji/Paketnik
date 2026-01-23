var PhotoModel = require('../models/photoModel.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { compressImage, decompressImage } = require('../ImageCompressor');

/**
 * photoController.js
 *
 * @description :: Server-side logic for managing photos.
 */
module.exports = {

    /**
     * photoController.list()
     */
    list: function (req, res) {
        PhotoModel.find()
        .populate('postedBy', 'username') // Include username of the author
        .sort({ createdAt: -1 }) // Sort by creation date (descending)
        .exec(function (err, photos) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting photo.',
                    error: err
                });
            }
            // Filter out photos that have 10 or more flags, except for owners viewing their own posts
            const filteredPhotos = photos.filter(photo => {
                const flagCount = (photo.flags || []).length;
                return flagCount < 10 || (req.session.userId && photo.postedBy._id.toString() === req.session.userId);
            });
            return res.json(filteredPhotos);
        });
    },

    /**
     * photoController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        PhotoModel.findOne({_id: id})
        .populate('postedBy', 'username')
        .exec(function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting photo.',
                    error: err
                });
            }

            if (!photo) {
                return res.status(404).json({
                    message: 'No such photo'
                });
            }

            return res.json(photo);
        });
    },

    /**
     * photoController.create()
     */
    create: async function (req, res) {
        console.log(req.file)

        if (!req.file) {
            return res.status(400).json({message: 'No image uploaded'});
        }

        const compressedImage = await compressImage(req.file.buffer);

        const filename = crypto.randomBytes(16).toString("hex");
        const uploadDir = path.join(__dirname, '../public/images');
        const targetPath = path.join(uploadDir, filename);

        fs.writeFile(targetPath, compressedImage, function (err) {
            if (err) {
                return res.status(500).json({
                    message: 'Error saving file',
                    error: err
                });
            }

            var photo = new PhotoModel({
                name: req.body.name,
                message: req.body.message,
                path: `images/${filename}`,
                postedBy: req.session.userId,
                views: 0,
                likes: [],
                dislikes: [],
                flags: [],
                createdAt: new Date()
            });

            photo.save(function (err, photo) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when creating photo',
                        error: err
                    });
                }

                photo.populate('postedBy', 'username', function (err, populatedPhoto) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error populating photo data',
                            error: err
                        });
                    }
                    return res.status(201).json(populatedPhoto);
                });
            });
        });
    },

    /**
     * photoController.update()
     * Updates a photo if the user is the owner
     */
    update: function(req, res) {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        var id = req.params.id;

        PhotoModel.findOne({
            _id: id,
            postedBy: req.session.userId // Ensure user is the owner
        }, function(err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting photo',
                    error: err
                });
            }

            if (!photo) {
                return res.status(404).json({
                    message: 'No such photo or not authorized'
                });
            }

            // Update only allowed fields
            photo.name = req.body.name || photo.name;
            photo.message = req.body.message || photo.message;
            photo.updatedAt = new Date(); // Add timestamp for update

            photo.save(function(err, updatedPhoto) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating photo.',
                        error: err
                    });
                }

                return res.json(updatedPhoto);
            });
        });
    },

    /**
     * photoController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        PhotoModel.findByIdAndRemove(id, function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the photo.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    },

    like: function(req, res) {
        const photoId = req.params.id;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        PhotoModel.findById(photoId, function(err, photo) {
            if (err || !photo) {
                console.error('Error finding photo:', err);
                return res.status(404).json({ message: 'Photo not found' });
            }

            if (!photo.likes) photo.likes = [];
            if (!photo.dislikes) photo.dislikes = [];

            if (!photo.likes.includes(userId)) {
                photo.likes.push(userId);
                photo.dislikes = photo.dislikes.filter(u => u.toString() !== userId);
            }

            photo.save(function(err, updated) {
                if (err) {
                    console.error('Error saving photo:', err);
                    return res.status(500).json({ message: 'Error liking photo' });
                }

                updated.populate('postedBy', 'username', function(err, populatedPhoto) {
                    if (err) {
                        return res.status(500).json({ message: 'Error populating photo data' });
                    }
                    return res.json(populatedPhoto);
                });
            });
        });
    },

    dislike: function(req, res) {
        const photoId = req.params.id;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        PhotoModel.findById(photoId, function(err, photo) {
            if (err || !photo) {
                console.error('Error finding photo:', err);
                return res.status(404).json({ message: 'Photo not found' });
            }

            if (!photo.likes) photo.likes = [];
            if (!photo.dislikes) photo.dislikes = [];

            if (!photo.dislikes.includes(userId)) {
                photo.dislikes.push(userId);
                photo.likes = photo.likes.filter(u => u.toString() !== userId);
            }

            photo.save(function(err, updated) {
                if (err) {
                    console.error('Error saving photo:', err);
                    return res.status(500).json({ message: 'Error disliking photo' });
                }

                updated.populate('postedBy', 'username', function(err, populatedPhoto) {
                    if (err) {
                        return res.status(500).json({ message: 'Error populating photo data' });
                    }
                    return res.json(populatedPhoto);
                });
            });
        });
    },

    flag: function(req, res) {
        const photoId = req.params.id;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        PhotoModel.findById(photoId, function(err, photo) {
            if (err || !photo) {
                console.error('Error finding photo:', err);
                return res.status(404).json({ message: 'Photo not found' });
            }

            if (!photo.flags) photo.flags = [];

            // Check if user hasn't already flagged this photo using string comparison
            const hasUserFlagged = photo.flags.some(id => id.toString() === userId.toString());
            if (!hasUserFlagged) {
                photo.flags.push(userId);
            }

            photo.save(function(err, updated) {
                if (err) {
                    console.error('Error saving photo:', err);
                    return res.status(500).json({ message: 'Error flagging photo' });
                }

                updated.populate('postedBy', 'username', function(err, populatedPhoto) {
                    if (err) {
                        return res.status(500).json({ message: 'Error populating photo data' });
                    }
                    return res.json(populatedPhoto);
                });
            });
        });
    },

    publish: function(req, res){
        return res.render('photo/publish');
    },

    /**
     * photoController.listSortedByDate()
     */
    listSortedByDate: function (req, res) {
        PhotoModel.find()
        .populate('postedBy', 'username')
        .sort({ createdAt: -1 })
        .exec(function (err, photos) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting photos.',
                    error: err
                });
            }
            // Filter out photos that have 10 or more flags, except for owners viewing their own posts
            const filteredPhotos = photos.filter(photo => {
                const flagCount = (photo.flags || []).length;
                return flagCount < 10 || (req.session.userId && photo.postedBy._id.toString() === req.session.userId);
            });
            return res.json(filteredPhotos);
        });
    },

    serveImage: function(req, res) {
        const filename = req.params.filename;
        const imagePath = path.join(__dirname, '../public/images', filename);

        if (!fs.existsSync(imagePath)) {
            // This handles the 404 errors you see in your logs
            return res.status(404).send('Image not found');
        }

        fs.readFile(imagePath, async function(err, data) {
            if (err) return res.status(500).send('Error reading file');

            try {
                // Try to decompress assuming it's our custom format
                const pngBuffer = await decompressImage(data);
                res.setHeader('Content-Type', 'image/png');
                res.send(pngBuffer);
            } catch (decodeErr) {
                // FALLBACK: If decompression fails (e.g. invalid dimensions),
                // assume it's a standard JPEG/PNG file and send it raw.
                console.warn(`Serving raw file for ${filename}:`, decodeErr.message);

                res.setHeader('Content-Type', 'image/jpeg'); // Default to JPEG
                res.send(data);
            }
        });
    }
};
