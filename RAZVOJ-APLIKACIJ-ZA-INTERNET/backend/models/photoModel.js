var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var photoSchema = new Schema({
	'name' : String,
	'path' : String,
	'message': String,
	'postedBy' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},
	'views' : Number,
	'likes': [{ type: Schema.Types.ObjectId, ref: 'user' }],
	'dislikes': [{ type: Schema.Types.ObjectId, ref: 'user' }],
	'flags': [{ type: Schema.Types.ObjectId, ref: 'user' }],
	'createdAt': { type: Date, default: Date.now }
});

module.exports = mongoose.model('photo', photoSchema);
