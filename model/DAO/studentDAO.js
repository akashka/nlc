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

var ProgramSchema = new Schema({
    programmename:      { type: String, required: true },
    group:              { type: String },
    category:           { type: String },
    level:              { type: String },
    feesdetails:        { type: Array },
    lastyearlevel:      { type: Object },
    examdate:           { type: String },
    entrytime:          { type: String },
    competitiontime:    { type: String },
    venue:              { type: String },
    admissioncardno:    { type: String }
});

var StudentSchema = new Schema({
    phone:              { type: String, required: true, unique: true },
    email:              { type: String, required: true },
    name:               { type: String, required: true },
    dateofbirth:        { type: String, required: true },
    gender:             { type: String, required: true },
    parentname:         { type: String, required: true },
    address:            { type: String, required: true },
    tshirtsize:         { type: String },
    photo:              { type: String },
    birthcertificate:   { type: String },
    dateCreated:        { type: Date, required: true },
    dateModified:       { type: Date },
    centername:         { type: String, required: true },
    centercode:         { type: String, required: true },
    sstatename:         { type: String, required: true },
    status:             { type: String, required: true },
    mfapproved:         { type: Boolean, default: false},
    paymentdate:        { type: String },
    transactionno:      { type: String },
    paymentmode:        { type: String },
    bankname:           { type: String },
    paymentapproved:    { type: Boolean, default: false },
    programmes:         [ProgramSchema]
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

//CREATE new student
function createStudent(student, callbacks) {
    var f = new StudentModel({
        phone: student.phone,
        email: student.email,
        name: student.name.toUpperCase(),
        dateofbirth: student.dateofbirth,
        gender: student.gender,
        parentname: student.parentname.toUpperCase(),
        address: student.address,
        tshirtsize: student.tshirtsize,
        photo: student.photo,
        birthcertificate: student.birthcertificate,
        // programmename: student.programmename,
        centername: student.centername,
        centercode: student.centercode,
        sstatename: student.sstatename,
        programmes: student.programmes,
        status: 'open',
        dateCreated: new Date()
    });
    f.save(function (err) {
        if (!err) {
            sendInfoMail('Student created with id: ' + f._id, f);
            callbacks.success(f);
        } else {
            sendInfoMail('Error in Creating Student', err + f);            
            callbacks.error(err);
        }
    });
}

//READ all Students
function readStudents(skip, count, callbacks) {
    return StudentModel.find()
        .sort('-dateCreated').skip(skip).limit(count).exec('find', function (err, students) {
            if (!err) {
                callbacks.success(students);
            } else {
                sendInfoMail('Student read failed', err);
                callbacks.error(err);
            }
        });
}

//READ student by id
function readStudentById(id, callbacks) {
    return StudentModel.findById(id, function (err, student) {
        if (!err) {
            callbacks.success(student);
        } else {
            sendInfoMail('Student read with id failed: ' + id, err);
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
            f.name = student.name.toUpperCase();
            f.dateofbirth = student.dateofbirth;
            f.gender = student.gender;
            f.parentname = student.parentname.toUpperCase();
            f.address = student.address;
            f.tshirtsize = student.tshirtsize;
            f.photo = student.photo;
            f.birthcertificate = student.birthcertificate;
            f.centername = student.centername;
            f.centercode = student.centercode;
            f.sstatename = student.sstatename;
            f.status = student.status;
            f.paymentdate = student.paymentdate;
            f.transactionno = student.transactionno;
            f.paymentmode = student.paymentmode;
            f.bankname = student.bankname;
            f.mfapproved = student.mfapproved;
            f.programmes = student.programmes;
            f.dateCreated = student.dateCreated;
            f.dateModified = new Date();

            return f.save(function (err) {
                if (!err) {
                    sendInfoMail('Student updated: ' + id, f);
                    callbacks.success(f);
                } else {
                    sendInfoMail('Student update failed: ' + id, err + f);
                    callbacks.error(err);
                }
            });
        } else {
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
                    sendInfoMail('Student removed: ' + id, f);                    
                    callbacks.success(f);
                } else {
                    sendInfoMail('Student remove failed: ' + id, err + f);
                    callbacks.error(err);
                }
            });
        } else {
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
            sendInfoMail('Student receipt download failed: ' + username, err);
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
            sendInfoMail('Student hall ticket generation failed: ' + username, err);            
            callbacks.error(err);
        }
    });
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [day, month, year].join('/');
}

// Generating Form Copy
function downloadCopy(username, callbacks) {
    StudentModel.find({ phone: username.username }, function (err, student) {
        if (!err) {
            student = student[0];
            var programmes = "";
            for(var i=0; i<student.programmes.length; i++) {
                if(i != 0) programmes += ", ";
                programmes += student.programmes[i].programmename;
            }
            var stringTemplate = fs.readFileSync(path.join(__dirname, '../../helpers') + '/copy.html', "utf8");
            stringTemplate = stringTemplate.replace('{{sstateName}}', (student.sstatename) ? student.sstatename : "");
            stringTemplate = stringTemplate.replace('{{centerName}}', (student.centername) ? student.centername : "");
            stringTemplate = stringTemplate.replace('{{programmes}}', programmes);
            stringTemplate = stringTemplate.replace('{{phoneNo}}', (student.phone) ? student.phone : "");
            stringTemplate = stringTemplate.replace('{{emailId}}', (student.email) ? student.email : "");
            stringTemplate = stringTemplate.replace('{{studentName}}', (student.name) ? student.name : "");
            stringTemplate = stringTemplate.replace('{{gender}}', (student.gender) ? student.gender : "");
            stringTemplate = stringTemplate.replace('{{parentName}}', (student.parentname) ? student.parentname : "");
            stringTemplate = stringTemplate.replace('{{address}}', (student.address) ? student.address : "");
            stringTemplate = stringTemplate.replace('{{dateOfBirth}}', (student.dateofbirth) ? formatDate(student.dateofbirth) : "");
            stringTemplate = stringTemplate.replace('{{tShirtSize}}', (student.tshirtsize) ? student.tshirtsize : "");
            stringTemplate = stringTemplate.replace('{{photo}}', (student.photo != undefined) ? ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + student.photo) : '');
            stringTemplate = stringTemplate.replace('{{birthCertificate}}', (student.birthcertificate != undefined) ? ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + student.birthcertificate) : '');

            conversion({ html: stringTemplate }, function (err, pdf) {
                callbacks.success(stringTemplate);
            }); 
        } else {
            sendInfoMail('Student form copy download failed: ' + username, err);
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
module.exports.downloadCopy = downloadCopy;
