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
    'createdAt': {
        type: Date,
        default: Date.now
    }
});

var Box = mongoose.model('box', boxSchema);
module.exports = Box;
