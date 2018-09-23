var db = require('../../config/mongodb').init(),
    mongoose = require('mongoose');
var otpGenerator = require('otp-generator');
var curl = require('curlrequest');

var smsUrl = "https://smsapp.mx9.in/smpp/?username=alohaindia&password=9790944889&from=ALOHAS&to=91";
var senderID = "LILWON";

var isInTest = typeof global.it === 'function';

var Schema = mongoose.Schema;
var UserSchema = new Schema({
    username:       { type: String, required: true, unique: true},
    password:       { type: String, required: true },
    role:           { type: String, required: true },
    center:         { type: String },
    sstate:         { type: String },
    dateCreated:    { type: Date},
    dateModified:   { type: Date}
});

UserSchema.pre('save', function(next){
    now = new Date();
    this.dateModified = now;
    if ( !this.dateCreated ) {
        this.dateCreated = now;
    }
    next();
});

//Set up schema
var UserModel = db.model('User', UserSchema);

//READ all users
function readUsers(skip, count, callbacks){
    return UserModel.find()
    .sort('-dateCreated').skip(skip).limit(count).exec('find', function (err, users) {
        if (!err) {
            if(!isInTest) console.log("[GET]   Get all users: " + JSON.stringify(users));
            callbacks.success(users);
        } else {
            if(!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//READ user by id
function readUserById(id, callbacks){
    return UserModel.findById(id, function (err, user) {
        if (!err) {
            if(!isInTest) console.log("[GET]   Get user: " + JSON.stringify(user));
            callbacks.success(user);
        } else {
            if(!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//CREATE user function
function createUser(user, callbacks){
    var u = new UserModel({
        username:   user.username,
        password:   user.password,
        role:       user.role,
        center:     user.center,
        sstate:     user.sstate 
    });

    u.save(function (err) {
        if (!err) {
            if(!isInTest) console.log("[ADD]   User created with username: " + user.username);
            callbacks.success(u);
        } else {
            if(!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//UPDATE user
function updateUser(id, user, callbacks){
    return UserModel.findById(id, function (err, u) {
        if (!err) {
            u.username = user.username;
            u.password = user.password;
            u.role     = user.role;
            u.center   = user.center;
            u.sstate   = user.sstate;
            return u.save(function (err) {
                if (!err) {
                    if(!isInTest) console.log("[UDP]   Updated user: " + JSON.stringify(u));
                    callbacks.success(u);
                } else {
                    if(!isInTest) console.log(err);
                    callbacks.error(err);
                }
            });
        } else {
            if(!isInTest) console.log(err);
            callbacks.error(err);
        }

    });
}

//DELETE user
function deleteUser(id, callbacks){
    return UserModel.findById(id, function (err, user) {
        return user.remove(function (err) {
            if (!err) {
                if(!isInTest) console.log("[DEL]    Deleted user: " + id);
                callbacks.success(user);
            } else {
                if(!isInTest) console.log(err);
                callbacks.error(err);
            }
        });
    });
}

//Login user
function loginUser(user, callbacks){
    return UserModel.find({'username': user.username }, function (err, u) {
        if (!err) {
            if(u[0]){
                if (u[0].password == user.password){
                    //Login ok
                    callbacks.success(u[0]);
                }else{
                    //Password mismatch
                    callbacks.error({msg: 'Invalid login parameters', data: user});
                }
            }else{
                //User does not exist
                callbacks.error({msg: 'Invalid login parameters', data: user});
            }
        } else {
            callbacks.error(err);
        }
    });
}

function sendOTPSMS(username, password) {
    console.log("Sending OTP SMS to login");
    var messageData = "Greetings from Aloha. Your One Time Password (OTP) is " + password + " This is valid for 15 minutes only. Do not share this OTP with anyone for security reasons.";
    var formData = smsUrl + username + "&text=" + encodeURIComponent(messageData);
    curl.request(formData, function optionalCallback(err, body) {
        if (err) {
            return console.error('Sending SMS to parent failed: ', err);
        }
        console.log('Successfully sent SMS to parent');
    });
}

//Generate OTP
function generateOTP(user, callbacks){
    console.log("Generating OTP function is called");
    var users = user;
    var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });
    return UserModel.find({'username': user.username }, function (err, u) {
        if (!err) {
            console.log(u);
            if(u[0]){
                console.log(u[0]);
                var user = u[0];
                user.password = otp;
                return user.save(function (err) {
                    if (!err) {
                        sendOTPSMS(user.username, user.password);
                        if(!isInTest) console.log("[UDP]   Updated user: " + JSON.stringify(user));
                        callbacks.success(user);
                    } else {
                        if(!isInTest) console.log(err);
                        callbacks.error(err);
                    }
                });                
            }else{
                var u = new UserModel({});
                u.username = users.username;
                u.password = otp;
                u.role = 'student';
                u.save(function (err) {
                    if (!err) {
                        console.log(u);
                        sendOTPSMS(u.username, u.password);
                        if(!isInTest) console.log("[ADD]   User created with username: " + u.username);
                        callbacks.success(u);
                    } else {
                        console.log(err);
                        if(!isInTest) console.log(err);
                        callbacks.error({msg: 'There is no student registered with this phone number. Please Register!', data: null});
                    }
                });
            }
        } else {
            console.log(err);
            callbacks.error(err);
        }
    });
}

module.exports.createUser = createUser;
module.exports.readUsers = readUsers;
module.exports.readUserById = readUserById;
module.exports.updateUser = updateUser;
module.exports.deleteUser = deleteUser;
module.exports.loginUser = loginUser;
module.exports.generateOTP = generateOTP;
