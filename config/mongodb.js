var mongoose = require('mongoose');

//Set up MongoDb connection
function _init(){
    try{
        // Local
        // return mongoose.createConnection('mongodb://localhost:27017/nlc');
        
        // Stag
        return mongoose.createConnection('mongodb://admin:Abcd123$0@ds111963.mlab.com:11963/heroku_8xd7kgcn');

        // Live
        // return mongoose.createConnection('mongodb://admin:Abcd123$0@ds145072.mlab.com:45072/heroku_8t0b2wbr');
    }catch(err){
        console.log("No internet connection :(");
    }
};

module.exports.init = _init;
