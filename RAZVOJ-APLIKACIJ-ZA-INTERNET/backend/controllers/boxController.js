const Box = require('../models/boxModel.js');
const UnlockEvent = require('../models/unlockEventModel.js');

module.exports = {    // List all boxes for current user (owned, allowed, or admin-created public boxes)
    list: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        // First get user info to check if current user is admin
        const User = require('../models/userModel.js');
        User.findById(req.session.userId, function(err, currentUser) {
            if (err) {
                return res.status(500).json({
                    message: 'Error retrieving user info',
                    error: err
                });
            }
            if (!currentUser) {
                return res.status(401).json({ message: 'User not found' });
            }

            let query;
            if (currentUser.role === 'admin') {
                // Admins can see all boxes
                query = {};
            } else {
                // Regular users see: their own boxes, boxes they're allowed to use, and admin-created public boxes
                query = {
                    $or: [
                        { owner: req.session.userId },
                        { allowedUsers: req.session.userId }
                    ]
                };
            }

            Box.find(query)
            .populate('owner', 'username role')
            .populate('allowedUsers', 'username')
            .exec(function(err, boxes) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error retrieving boxes',
                        error: err
                    });
                }

                // For non-admin users, also add admin-created boxes that are public
                if (currentUser.role !== 'admin') {
                    Box.find({})
                    .populate('owner', 'username role')
                    .populate('allowedUsers', 'username')
                    .exec(function(err, allBoxes) {
                        if (err) {
                            return res.json(boxes); // Return what we have if error
                        }

                        // Filter admin-created boxes and add them if not already included
                        const adminBoxes = allBoxes.filter(box => 
                            box.owner && box.owner.role === 'admin' && 
                            !boxes.some(userBox => userBox._id.toString() === box._id.toString())
                        );

                        const combinedBoxes = [...boxes, ...adminBoxes];
                        return res.json(combinedBoxes);
                    });
                } else {
                    return res.json(boxes);
                }
            });
        });
    },    // Get specific box details
    show: function(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        // First try to find the box with user access
        Box.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.session.userId },
                { allowedUsers: req.session.userId }
            ]
        })
        .populate('owner', 'username role')
        .populate('allowedUsers', 'username')
        .exec(function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error retrieving box',
                    error: err
                });
            }
            
            if (box) {
                return res.json(box);
            }
            
            // If not found with user access, check if it's an admin-created public box
            Box.findById(req.params.id)
            .populate('owner', 'username role')
            .populate('allowedUsers', 'username')
            .exec(function(err, adminBox) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error retrieving box',
                        error: err
                    });
                }
                
                if (!adminBox) {
                    return res.status(404).json({
                        message: 'Box not found'
                    });
                }
                
                // Check if the box owner is an admin (making it public)
                if (adminBox.owner && adminBox.owner.role === 'admin') {
                    return res.json(adminBox);
                } else {
                    return res.status(404).json({
                        message: 'Box not found or access denied'
                    });
                }
            });
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
    },    // Log unlock event
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
        })
        .populate('owner', 'username role')
        .exec(function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error checking box access',
                    error: err
                });
            }
            
            if (box) {
                // User has direct access, create unlock event
                createUnlockEvent();
                return;
            }
            
            // If not found with user access, check if it's an admin-created public box
            Box.findById(req.params.id)
            .populate('owner', 'username role')
            .exec(function(err, adminBox) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error checking box access',
                        error: err
                    });
                }
                
                if (!adminBox) {
                    return res.status(404).json({
                        message: 'Box not found'
                    });
                }
                
                // Check if the box owner is an admin (making it public)
                if (adminBox.owner && adminBox.owner.role === 'admin') {
                    createUnlockEvent();
                } else {
                    return res.status(404).json({
                        message: 'Box not found or access denied'
                    });
                }
            });
            
            function createUnlockEvent() {
                // Create unlock event
                const unlockEvent = new UnlockEvent({
                    box: req.params.id,
                    user: req.session.userId,
                    unlockMethod: req.body.unlockMethod,
                    success: true
                });                unlockEvent.save(function(err, event) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error logging unlock event',
                            error: err
                        });
                    }
                    return res.status(201).json(event);
                });
            }
        });
    },// Get unlock history for a box
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
        })
        .populate('owner', 'username role')
        .exec(function(err, box) {
            if (err) {
                return res.status(500).json({
                    message: 'Error checking box access',
                    error: err
                });
            }
            
            if (box) {
                // User has direct access, show unlock events
                getUnlockEvents();
                return;
            }
            
            // If not found with user access, check if it's an admin-created public box
            Box.findById(req.params.id)
            .populate('owner', 'username role')
            .exec(function(err, adminBox) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error checking box access',
                        error: err
                    });
                }
                
                if (!adminBox) {
                    return res.status(404).json({
                        message: 'Box not found'
                    });
                }
                
                // Check if the box owner is an admin (making it public)
                if (adminBox.owner && adminBox.owner.role === 'admin') {
                    getUnlockEvents();
                } else {
                    return res.status(404).json({
                        message: 'Box not found or access denied'
                    });
                }
            });
            
            function getUnlockEvents() {
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
            }
        });
    }
};
