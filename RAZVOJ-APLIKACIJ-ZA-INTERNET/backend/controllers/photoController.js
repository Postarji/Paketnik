var PhotoModel = require('../models/photoModel.js');

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
            return res.json(photos);
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
    create: function (req, res) {
        var photo = new PhotoModel({
            name : req.body.name,
            message: req.body.message,
            path : "/images/"+req.file.filename,
            postedBy : req.session.userId,
            views : 0,
            likes : [],
            dislikes : []
        });

        photo.save(function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating photo',
                    error: err
                });
            }

            photo.populate('postedBy', 'username', function(err, populatedPhoto) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error populating photo data',
                        error: err
                    });
                }
                return res.status(201).json(populatedPhoto);
            });
        });
    },

    /**
     * photoController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        PhotoModel.findOne({_id: id}, function (err, photo) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting photo',
                    error: err
                });
            }

            if (!photo) {
                return res.status(404).json({
                    message: 'No such photo'
                });
            }

            photo.name = req.body.name ? req.body.name : photo.name;
			photo.path = req.body.path ? req.body.path : photo.path;
			photo.postedBy = req.body.postedBy ? req.body.postedBy : photo.postedBy;
			photo.views = req.body.views ? req.body.views : photo.views;
			photo.likes = req.body.likes ? req.body.likes : photo.likes;
			
            photo.save(function (err, photo) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating photo.',
                        error: err
                    });
                }

                return res.json(photo);
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
            return res.json(photos);
        });
    }
};
