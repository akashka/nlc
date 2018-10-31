var db = require('../../config/mongodb').init(),
    mongoose = require('mongoose'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    conversion = require("phantom-html-to-pdf")(),
    QRCode = require('qrcode');
var sgMail = require('@sendgrid/mail');

var isInTest = false;

var apiKey = "SG";
apiKey += ".41G";
apiKey += "-EH6mS";
apiKey += "-WT7ZWg_5bH";
apiKey += "-g";
apiKey += ".gEep1FU0lKjI8";
apiKey += "D4gd4zpY7a5HR7";
apiKey += "Up9jmE0AENHKO09A";
sgMail.setApiKey(apiKey);

var Schema = mongoose.Schema;
var CenterSchema = new Schema({
    phone: { type: String },
    email: { type: String },
    sstatename: { type: String, required: true },
    centername: { type: String, required: true },
    centercode: { type: String, required: true },
    programmename: { type: String, required: true },
    dateCreated: { type: Date },
    dateModified: { type: Date },
});

CenterSchema.pre('save', function (next) {
    now = new Date();
    this.dateModified = now;
    if (!this.dateCreated) {
        this.dateCreated = now;
    }
    next();
});
var CenterModel = db.model('Center', CenterSchema);

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

//CREATE new center
function createCenter(center, callbacks) {
    var f = new CenterModel({
        phone: center.phone,
        email: center.email,
        centername: center.centername,
        centercode: center.centercode,
        programmename: center.programmename,
        sstatename: center.sstatename,
        dateCreated: new Date()
    });
    f.save(function (err) {
        if (!err) {
            sendInfoMail('New Center Created', f);
            callbacks.success(f);
        } else {
            sendInfoMail('Center creation failed', err + f);
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//READ all centers
function readCenters(skip, count, callbacks) {
    return CenterModel.find()
        .sort('-sstatename').skip(skip).limit(count).exec('find', function (err, centers) {
            if (!err) {
                callbacks.success(centers);
            } else {
                sendInfoMail('Center read failed', err);
                if (!isInTest) console.log(err);
                callbacks.error(err);
            }
        });
}

//READ center by id
function readCenterById(id, callbacks) {
    return CenterModel.findById(id, function (err, center) {
        if (!err) {
            callbacks.success(center);
        } else {
            sendInfoMail('Single Center read failed', err);
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//UPDATE center
function updateCenter(id, center, callbacks) {
    return CenterModel.findById(id, function (err, f) {
        if (!err) {
            f.phone = center.phone;
            f.email = center.email;
            f.sstatename = center.sstatename;
            f.centername = center.centername;
            f.centercode = center.centercode;
            f.programmename = center.programmename;
            f.dateCreated = center.dateCreated;
            f.dateModified = center.dateModified;
            return f.save(function (err) {
                if (!err) {
                    sendInfoMail('Center update failed', f);
                    callbacks.success(f);
                } else {
                    sendInfoMail('Center Update failed', err + f);
                    if (!isInTest) console.log(err);
                    callbacks.error(err);
                }
            });
        } else {
            sendInfoMail('Center Update at Basic Level failed', err + center);
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//DELETE center
function deleteCenter(id, callbacks) {
    return CenterModel.findById(id, function (err, f) {
        if (!err) {
            return f.remove(function (err) {
                if (!err) {
                    sendInfoMail('Center deleted successfully', f);
                    callbacks.success(f);
                } else {
                    sendInfoMail('Center deleted failed', err + f);
                    if (!isInTest) console.log(err);
                    callbacks.error(err);
                }
            });
        } else {
            sendInfoMail('Center delete failed at basic level', err + id);
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

module.exports.createCenter = createCenter;
module.exports.readCenters = readCenters;
module.exports.readCenterById = readCenterById;
module.exports.updateCenter = updateCenter;
module.exports.deleteCenter = deleteCenter;
