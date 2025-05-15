const Comment = require('../models/commentModel');

module.exports = {
    listByPhoto: function (req, res) {
        Comment.find({ photo: req.params.photoId })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .exec(function (err, comments) {
            if (err) return res.status(500).json({ message: 'Error retrieving comments', error: err });
            return res.json(comments);
        });
    },

    create: function (req, res) {
        // Verify that user is logged in
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const comment = new Comment({
            photo: req.body.photoId,
            author: req.session.userId, // Use session userId instead of req.userId
            message: req.body.message
        });

        comment.save(function (err, savedComment) {
            if (err) return res.status(500).json({ message: 'Error saving comment', error: err });
            
            // Populate the author information before sending response
            Comment.populate(savedComment, { path: 'author', select: 'username' }, function(err, populatedComment) {
                if (err) return res.status(500).json({ message: 'Error populating comment', error: err });
                return res.status(201).json(populatedComment);
            });
        });
    }
};