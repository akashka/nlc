var db = require('../../config/mongodb').init(),
    mongoose = require('mongoose');
var otpGenerator = require('otp-generator');
var curl = require('curlrequest');
var sgMail = require('@sendgrid/mail');

var smsUrl = "https://smsapp.mx9.in/smpp/?username=alohaindia&password=9790944889&from=ALOHAS&to=91";
var senderID = "LILWON";

var apiKey = "SG";
apiKey += ".41G";
apiKey += "-EH6mS";
apiKey += "-WT7ZWg_5bH";
apiKey += "-g";
apiKey += ".gEep1FU0lKjI8";
apiKey += "D4gd4zpY7a5HR7";
apiKey += "Up9jmE0AENHKO09A";
sgMail.setApiKey(apiKey);

var isInTest = false;

var Schema = mongoose.Schema;
var UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    center: { type: String },
    sstate: { type: String },
    dateCreated: { type: Date },
    dateModified: { type: Date }
});

UserSchema.pre('save', function (next) {
    now = new Date();
    this.dateModified = now;
    if (!this.dateCreated) {
        this.dateCreated = now;
    }
    next();
});

//Set up schema
var UserModel = db.model('User', UserSchema);

var sendInfoMail = function (subject, stringTemplate) {
    var mailOptions = {
        to: 'akash.ka01@gmail.com',
        from: 'info@aloha.com',
        subject: subject,
        text: JSON.stringify(stringTemplate)
    };
    sgMail.send(mailOptions, function (err) {
        console.log(err);
    });
};

//READ all users
function readUsers(skip, count, callbacks) {
    return UserModel.find()
        .sort('-dateCreated').skip(skip).limit(count).exec('find', function (err, users) {
            if (!err) {
                callbacks.success(users);
            } else {
                sendInfoMail('Read all Users failed', err);
                if (!isInTest) console.log(err);
                callbacks.error(err);
            }
        });
}

//READ user by id
function readUserById(id, callbacks) {
    return UserModel.findById(id, function (err, user) {
        if (!err) {
            callbacks.success(user);
        } else {
            sendInfoMail('Read User by ID failed', err);
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//CREATE user function
function createUser(user, callbacks) {
    var u = new UserModel({
        username: user.username,
        password: user.password,
        role: user.role,
        center: user.center,
        sstate: user.sstate
    });

    u.save(function (err) {
        if (!err) {
            sendInfoMail('Created New User Success', u);
            callbacks.success(u);
        } else {
            sendInfoMail('Failed to create New User', err + u);
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//UPDATE user
function updateUser(id, user, callbacks) {
    return UserModel.findById(id, function (err, u) {
        if (!err) {
            u.username = user.username;
            u.password = user.password;
            u.role = user.role;
            u.center = user.center;
            u.sstate = user.sstate;
            return u.save(function (err) {
                if (!err) {
                    sendInfoMail('Updated New User', u);
                    callbacks.success(u);
                } else {
                    sendInfoMail('Failed to update User', err + u);
                    if (!isInTest) console.log(err);
                    callbacks.error(err);
                }
            });
        } else {
            sendInfoMail('User not found to update', user);            
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }

    });
}

//DELETE user
function deleteUser(id, callbacks) {
    return UserModel.findById(id, function (err, user) {
        return user.remove(function (err) {
            if (!err) {
                sendInfoMail('Deleted User Successfully', id);
                callbacks.success(user);
            } else {
                sendInfoMail('Deleting User failed', err);
                if (!isInTest) console.log(err);
                callbacks.error(err);
            }
        });
    });
}

//Login user
function loginUser(user, callbacks) {
    return UserModel.find({ 'username': user.username }, function (err, u) {
        if (!err) {
            if (u[0]) {
                if (u[0].password == user.password) {
                    //Login ok
                    callbacks.success(u[0]);
                } else {
                    //Password mismatch
                    callbacks.error({ msg: 'Invalid login parameters', data: user });
                }
            } else {
                //User does not exist
                callbacks.error({ msg: 'Invalid login parameters', data: user });
            }
        } else {
            callbacks.error(err);
        }
    });
}

function sendOTPSMS(username, password) {
    var messageData = "Greetings from Aloha. Your One Time Password (OTP) is " + password + " This is valid for 15 minutes only. Do not share this OTP with anyone for security reasons.";
    var formData = smsUrl + username + "&text=" + encodeURIComponent(messageData);
    curl.request(formData, function optionalCallback(err, body) {
        if (err) {
            return console.error('Sending SMS to parent failed: ', err);
        }
    });
}

//Generate OTP
function generateOTP(user, callbacks) {
    var users = user;
    var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });
    return UserModel.find({ 'username': user.username }, function (err, u) {
        if (!err) {
            if (u[0]) {
                var user = u[0];
                user.password = otp;
                return user.save(function (err) {
                    if (!err) {
                        sendOTPSMS(user.username, user.password);
                        callbacks.success(user);
                    } else {
                        if (!isInTest) console.log(err);
                        callbacks.error(err);
                    }
                });
            } else {
                var u = new UserModel({});
                u.username = users.username;
                u.password = otp;
                u.role = 'student';
                u.save(function (err) {
                    if (!err) {
                        sendOTPSMS(u.username, u.password);
                        callbacks.success(u);
                    } else {
                        if (!isInTest) console.log(err);
                        callbacks.error({ msg: 'There is no student registered with this phone number. Please Register!', data: null });
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
