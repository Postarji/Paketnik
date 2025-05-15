const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    photo: { type: Schema.Types.ObjectId, ref: 'photo', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('comment', commentSchema);