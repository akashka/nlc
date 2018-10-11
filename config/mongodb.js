var mongoose = require('mongoose');

//Set up MongoDb connection
function _init(){
    try{
        // Local
        return mongoose.createConnection('mongodb://localhost:27017/nlc');
        
        // Stag
        // return mongoose.createConnection('mongodb://admin:Abcd123$0@ds111963.mlab.com:11963/heroku_8xd7kgcn');

        // Live
        // return mongoose.createConnection('mongodb://myUserAdmin:abc123@132.148.16.3:27017/nlc');
    }catch(err){
        console.log("No internet connection :(");
    }
};

module.exports.init = _init;
