const Box = require('../models/boxModel.js');
const UnlockEvent = require('../models/unlockEventModel.js');

module.exports = {
    // List all boxes for current user (owned or allowed)
    list: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        Box.find({
            $or: [
                { owner: req.session.userId },
                { allowedUsers: req.session.userId }
            ]
        })
        .populate('owner', 'username')
        .populate('allowedUsers', 'username')
        .exec(function(err, boxes) {
            if (err) {
                return res.status(500).json({
                    message: 'Error retrieving boxes',
                    error: err
                });
            }
            return res.json(boxes);
        });
    },

    // Get specific box details
    show: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        Box.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.session.userId },
                { allowedUsers: req.session.userId }
            ]
        })
        .populate('owner', 'username')
        .populate('allowedUsers', 'username')
        .exec(function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error retrieving box',
                    error: err
                });
            }
            if (!box) {
                return res.status(404).json({
                    message: 'Box not found or access denied'
                });
            }
            return res.json(box);
        });
    },

    // Create new box
    create: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const box = new Box({
            name: req.body.name,
            owner: req.session.userId,
            allowedUsers: req.body.allowedUsers || [],
            location: req.body.location
        });

        box.save(function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error creating box',
                    error: err
                });
            }
            return res.status(201).json(box);
        });
    },

    // Update box
    update: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        Box.findOne({
            _id: req.params.id,
            owner: req.session.userId
        }, function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error retrieving box',
                    error: err
                });
            }
            if (!box) {
                return res.status(404).json({
                    message: 'Box not found or access denied'
                });
            }

            box.name = req.body.name || box.name;
            box.location = req.body.location || box.location;
            box.allowedUsers = req.body.allowedUsers || box.allowedUsers;

            box.save(function(err, box) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error updating box',
                        error: err
                    });
                }
                return res.json(box);
            });
        });
    },

    // Delete box
    remove: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        Box.findOneAndRemove({
            _id: req.params.id,
            owner: req.session.userId
        }, function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error deleting box',
                    error: err
                });
            }
            if (!box) {
                return res.status(404).json({
                    message: 'Box not found or access denied'
                });
            }
            return res.status(204).json();
        });
    },

    // Log unlock event
    logUnlock: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        // First check if user has access to the box
        Box.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.session.userId },
                { allowedUsers: req.session.userId }
            ]
        }, function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error checking box access',
                    error: err
                });
            }
            if (!box) {
                return res.status(404).json({
                    message: 'Box not found or access denied'
                });
            }

            // Create unlock event
            const unlockEvent = new UnlockEvent({
                box: req.params.id,
                user: req.session.userId,
                unlockMethod: req.body.unlockMethod,
                success: true
            });

            unlockEvent.save(function(err, event) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error logging unlock event',
                        error: err
                    });
                }
                return res.status(201).json(event);
            });
        });
    },

    // Get unlock history for a box
    getUnlockHistory: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        // First check if user has access to the box
        Box.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.session.userId },
                { allowedUsers: req.session.userId }
            ]
        }, function(err, box) {
            if (err || !box) {
                return res.status(404).json({
                    message: 'Box not found or access denied'
                });
            }

            // Get unlock events
            UnlockEvent.find({
                box: req.params.id
            })
            .populate('user', 'username')
            .sort('-timestamp')
            .exec(function(err, events) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error retrieving unlock history',
                        error: err
                    });
                }
                return res.json(events);
            });
        });
    }
};
