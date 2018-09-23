var db = require('../../config/mongodb').init(),
    mongoose = require('mongoose'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    conversion = require("phantom-html-to-pdf")(),
    QRCode = require('qrcode');

var isInTest = typeof global.it === 'function';

var Schema = mongoose.Schema;
var CenterSchema = new Schema({
    phone: { type: String },
    email: { type: String },
    sstatename: { type: String, required: true },
    centername: { type: String, required: true },
    centercode: { type: String, required: true },
    programmename: { type: String, required: true },
    dateCreated: { type: Date, required: true },
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
            if (!isInTest) console.log("Center created with id: " + f._id);
            callbacks.success(f);
        } else {
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
                if (!isInTest) console.log('[GET]   Get centers: ' + centers.length);
                callbacks.success(centers);
            } else {
                if (!isInTest) console.log(err);
                callbacks.error(err);
            }
        });
}

//READ center by id
function readCenterById(id, callbacks) {
    return CenterModel.findById(id, function (err, center) {
        if (!err) {
            if (!isInTest) console.log('[GET]   Get center: ' + center._id);
            callbacks.success(center);
        } else {
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
            if (!isInTest) console.log("[UDP]   Updated center: " + f._id);
            callbacks.success(f);
        } else {
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
} else {
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
                    if (!isInTest) console.log("[DEL]    Deleted center: " + f._id);
                    callbacks.success(f);
                } else {
                    if (!isInTest) console.log(err);
                    callbacks.error(err);
                }
            });
        } else {
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
