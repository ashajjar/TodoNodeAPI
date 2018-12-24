var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://todo-app:todo2019@ahmad-hajjar-shard-00-00-7gcm6.mongodb.net:27017,ahmad-hajjar-shard-00-01-7gcm6.mongodb.net:27017,ahmad-hajjar-shard-00-02-7gcm6.mongodb.net:27017/todo?ssl=true&replicaSet=ahmad-hajjar-shard-0&authSource=admin&retryWrites=true');

module.exports = {mongoose};
