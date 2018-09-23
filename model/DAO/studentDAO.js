var db = require('../../config/mongodb').init(),
    mongoose = require('mongoose'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    conversion = require("phantom-html-to-pdf")(),
    QRCode = require('qrcode');

var isInTest = typeof global.it === 'function';

var Schema = mongoose.Schema;
var StudentSchema = new Schema({
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    dateofbirth: { type: String, required: true },
    gender: { type: String, required: true },
    parentname: { type: String, required: true },
    address: { type: String, required: true },
    tshirtsize: { type: String },
    photo: { type: String },
    birthcertificate: { type: String },
    dateCreated: { type: Date, required: true },
    dateModified: { type: Date },
    programmename: { type: String, required: true },
    centername: { type: String, required: true },
    centercode: { type: String, required: true },
    sstatename: { type: String, required: true },
    status: { type: String, required: true },
    admissioncardno: { type: String },
    group: { type: String },
    category: { type: String },
    level: { type: String },
    feesdetails: { type: Array },
    lastyearlevel: { type: Object },
    paymentdate: { type: String },
    transactionno: { type: String },
    paymentmode: { type: String },
    bankname: { type: String },
    examdate: { type: String },
    mfapproved: { type: Boolean, default: false},
    examdate: { type: String },
    entrytime: { type: String },
    competitiontime: { type: String },
    venue: { type: String }
});

StudentSchema.pre('save', function (next) {
    now = new Date();
    this.dateModified = now;
    if (!this.dateCreated) {
        this.dateCreated = now;
    }
    next();
});
var StudentModel = db.model('Student', StudentSchema);

//CREATE new student
function createStudent(student, callbacks) {
    var f = new StudentModel({
        phone: student.phone,
        email: student.email,
        name: student.name,
        dateofbirth: student.dateofbirth,
        gender: student.gender,
        parentname: student.parentname,
        address: student.address,
        tshirtsize: student.tshirtsize,
        photo: student.photo,
        birthcertificate: student.birthcertificate,
        programmename: student.programmename,
        centername: student.centername,
        centercode: student.centercode,
        schoolname: student.schoolname,
        sstatename: student.sstatename,
        status: 'open',
        dateCreated: new Date()
    });
    f.save(function (err) {
        if (!err) {
            if (!isInTest) console.log("Student created with id: " + f._id);
            callbacks.success(f);
        } else {
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//READ all Students
function readStudents(skip, count, callbacks) {
    return StudentModel.find()
        .sort('-dateCreated').skip(skip).limit(count).exec('find', function (err, students) {
            if (!err) {
                if (!isInTest) console.log('[GET]   Get students: ' + students.length);
                callbacks.success(students);
            } else {
                if (!isInTest) console.log(err);
                callbacks.error(err);
            }
        });
}

//READ student by id
function readStudentById(id, callbacks) {
    return StudentModel.findById(id, function (err, student) {
        if (!err) {
            if (!isInTest) console.log('[GET]   Get student: ' + student._id);
            callbacks.success(student);
        } else {
            if (!isInTest) console.log(err);
            callbacks.error(err);
        }
    });
}

//UPDATE student
function updateStudent(id, student, callbacks) {
    return StudentModel.findById(id, function (err, f) {
        if (!err) {
            f.paymentapproved = student.paymentapproved;
            f.phone = student.phone;
            f.email = student.email;
            f.name = student.name;
            f.dateofbirth = student.dateofbirth;
            f.gender = student.gender;
            f.parentname = student.parentname;
            f.address = student.address;
            f.tshirtsize = student.tshirtsize;
            f.photo = student.photo;
            f.birthcertificate = student.birthcertificate;
            f.dateCreated = student.dateCreated;
            f.dateModified = student.dateModified;
            f.programmename = student.programmename;
            f.centername = student.centername;
            f.centercode = student.centercode;
            f.sstatename = student.sstatename;
            f.status = student.status;
            f.admissioncardno = student.admissioncardno;
            f.group = student.group;
            f.category = student.category;
            f.level = student.level;
            f.feesdetails = student.feesdetails;
            f.lastyearlevel = student.lastyearlevel;
            f.paymentdate = student.paymentdate;
            f.transactionno = student.transactionno;
            f.paymentmode = student.paymentmode;
            f.bankname = student.bankname;
            f.examdate = student.examdate;
            f.mfapproved = student.mfapproved;
            f.examdate = student.examdate;
            f.entrytime = student.entrytime;
            f.competitiontime = student.competitiontime;
            f.venue = student.venue;
            f.dateCreated = student.dateCreated;
            f.dateModified = new Date();

            return f.save(function (err) {
                if (!err) {
                    if (!isInTest) console.log("[UDP]   Updated student: " + f._id);
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

//DELETE student
function deleteStudent(id, callbacks) {
    return StudentModel.findById(id, function (err, f) {
        if (!err) {
            return f.remove(function (err) {
                if (!err) {
                    if (!isInTest) console.log("[DEL]    Deleted student: " + f._id);
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

function downloadReceipt(username, callbacks) {
    StudentModel.find({ phone: username.username }, function (err, student) {
        if (!err) {
            student = student[0];
            var stringTemplate = fs.readFileSync(path.join(__dirname, '../../helpers') + '/receipt.html', "utf8");
            stringTemplate = stringTemplate.replace('{{centerOrSchoolName}}', ((student.centername != undefined) ? student.centername : "") + (student.schoolname != undefined) ? student.schoolname : "");
            stringTemplate = stringTemplate.replace('{{parentName}}', (student.parentname) ? student.parentname : "");
            stringTemplate = stringTemplate.replace('{{tShirtDetails}}', (student.tshirtrequired) ? "and <b> Rs.250/- </b> &nbsp; for T-Shirt, &nbsp; <b>Total of Rs.800/- </b> &nbsp;" : "");
            stringTemplate = stringTemplate.replace('{{studentName}}', (student.name) ? student.name : "");

            conversion({ html: stringTemplate }, function (err, pdf) {
                callbacks.success(pdf);
            });

        } else {
            callbacks.error(err);
        }
    });
}

// GENERATING Hall ticket
function generateHallTicket(username, callbacks) {
    StudentModel.find({ phone: username.username }, function (err, student) {
        if (!err) {
            student = student[0];
            var text = "Student Name: " + student.name + "\n \n";
            text += "Roll No: " + student.admissioncardno + "\n \n";
            text += "Competition Time: " + student.competitiontime + "\n \n";
            text += "School / Center: " + ((student.centername != undefined) ? student.centername : "") + ((student.schoolname != undefined) ? student.schoolname : "") + "  /  " + ((student.centercode != undefined) ? student.centercode : "")+ "\n \n";
            text += (student.photo != undefined) ? ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + student.photo) : '';

            QRCode.toDataURL(text, function (err, body) {
                var qrImage = "";
                if (!err) qrImage = body;
                var stringTemplate = fs.readFileSync(path.join(__dirname, '../../helpers') + '/hallticket.html', "utf8");
                stringTemplate = stringTemplate.replace('{{CenterOrSchoolName}}', ((student.centername != undefined) ? student.centername : "") + (student.schoolname != undefined) ? student.schoolname : "");
                stringTemplate = stringTemplate.replace('{{StudentName}}', (student.name != undefined) ? student.name : "");
                stringTemplate = stringTemplate.replace('{{EntryTime}}', (student.entrytime != undefined) ? student.entrytime : "");
                stringTemplate = stringTemplate.replace('{{CompetitionTime}}', (student.competitiontime != undefined) ? student.competitiontime : "");
                console.log(student.photo);
                stringTemplate = stringTemplate.replace('{{StudentImage}}', (student.photo != undefined) ? ("https://s3.ap-south-1.amazonaws.com/alohanlc/" + student.photo) : "");
                stringTemplate = stringTemplate.replace('{{StudentRollNumber}}', (student.admissioncardno != undefined) ? student.admissioncardno : "");
                stringTemplate = stringTemplate.replace('{{StudentQRCode}}', (qrImage != undefined) ? qrImage : "");

                conversion({ html: stringTemplate }, function (err, pdf) {
                    callbacks.success(pdf);
                });
            });
        } else {
            callbacks.error(err);
        }
    });
}

module.exports.createStudent = createStudent;
module.exports.readStudents = readStudents;
module.exports.readStudentById = readStudentById;
module.exports.updateStudent = updateStudent;
module.exports.deleteStudent = deleteStudent;
module.exports.downloadReceipt = downloadReceipt;
module.exports.generateHallTicket = generateHallTicket;
