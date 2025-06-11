var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var boxSchema = new Schema({
    'name': String,
    'owner': {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    'allowedUsers': [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    'location': String,
    'status': {
        type: String,
        enum: ['available', 'occupied', 'maintenance'],
        default: 'available'
    },
    'currentBooks': [{
        postId: {
            type: Schema.Types.ObjectId,
            ref: 'photo'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    'capacity': {
        type: Number,
        default: 5
    },
    'createdAt': {
        type: Date,
        default: Date.now
    }
});

var Box = mongoose.model('box', boxSchema);
module.exports = Box;
