var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var unlockEventSchema = new Schema({
    'box': {
        type: Schema.Types.ObjectId,
        ref: 'box',
        required: true
    },
    'user': {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    'unlockMethod': {
        type: String,
        enum: ['password', 'facial', 'mobile'],
        required: true
    },
    'timestamp': {
        type: Date,
        default: Date.now
    },
    'success': {
        type: Boolean,
        required: true
    }
});

var UnlockEvent = mongoose.model('unlockEvent', unlockEventSchema);
module.exports = UnlockEvent;
