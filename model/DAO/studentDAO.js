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
    programmename: { type: String, required: true },
    group: { type: String },
    category: { type: String },
    level: { type: String },
    feesdetails: { type: Array },
    lastyearlevel: { type: Object },
    examdate: { type: String },
    entrytime: { type: String },
    competitiontime: { type: String },
    venue: { type: String },
    admissioncardno: { type: String }
});

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
    centername: { type: String, required: true },
    centercode: { type: String, required: true },
    sstatename: { type: String, required: true },
    status: { type: String, required: true },
    mfapproved: { type: Boolean, default: false },
    paymentdate: { type: String },
    transactionno: { type: String },
    paymentmode: { type: String },
    bankname: { type: String },
    paymentapproved: { type: Boolean, default: false },
    programmes: [ProgramSchema]
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
            var programmes = "";
            var amount = 0;
            for (var i = 0; i < student.programmes.length; i++) {
                if (i != 0) programmes += ", ";
                programmes += student.programmes[i].programmename;
            }
            if (student.programmes.length == 1) amount = 1000;
            if (student.programmes.length == 2) amount = 1600;
            if (student.programmes.length == 3) amount = 2600;
            if (student.programmes.length == 4) amount = 3200;

            var stringTemplate = fs.readFileSync(path.join(__dirname, '../../helpers') + '/receipt.html', "utf8");
            stringTemplate = stringTemplate.replace('{{stateName}}', ((student.sstatename != undefined) ? student.sstatename : ""));
            stringTemplate = stringTemplate.replace('{{centerName}}', ((student.centername != undefined) ? student.centername : ""));
            stringTemplate = stringTemplate.replace('{{parentName}}', ((student.parentname != undefined) ? student.parentname : ""));
            stringTemplate = stringTemplate.replace('{{amount}}', amount);
            stringTemplate = stringTemplate.replace('{{studentName}}', ((student.name != undefined) ? student.name : ""));
            stringTemplate = stringTemplate.replace('{{coursesName}}', programmes);

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
    console.log(username);
    StudentModel.find({ phone: username.username }, function (err, student) {
        if (!err) {
            student = student[0];
            for (var p = 0; p < student.programmes.length; p++) {
                if(student.programmes[p]._id == username.program) {
                    var program = student.programmes[p];
                    var text = "Student Name: " + student.name + "\n \n";
                    text += "Roll No: " + student.programmes[p].admissioncardno + "\n \n";
                    text += "Reporting Time: " + student.programmes[p].entrytime + "\n \n";
                    text += "Center: " + student.centername;
                    QRCode.toDataURL(text, function (err, body) {
                        var qrImage = "";
                        if (!err) qrImage = body;
                        var stringTemplate = fs.readFileSync(path.join(__dirname, '../../helpers') + '/hallticket.html', "utf8");

                        stringTemplate = stringTemplate.replace('{{headingName}}', ((program.programmename.indexOf("State") != -1) ? "15th State Level Competition 2018" : "15th National Level Competition 2018"));
                        stringTemplate = stringTemplate.replace('{{StudentRollNumber}}', (program.admissioncardno != undefined) ? program.admissioncardno : "");
                        stringTemplate = stringTemplate.replace('{{StudentName}}', (student.name));
                        stringTemplate = stringTemplate.replace('{{StateName}}', student.sstatename);
                        stringTemplate = stringTemplate.replace('{{CenterName}}', student.centername);
                        stringTemplate = stringTemplate.replace('{{CenterCode}}', student.centercode);
                        stringTemplate = stringTemplate.replace('{{ReportingTime}}', (program.entrytime != undefined) ? program.entrytime : "");
                        stringTemplate = stringTemplate.replace('{{StudentImage}}', (student.photo != undefined) ? ("https://s3.ap-south-1.amazonaws.com/alohanlc/" + student.photo) : "https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png");
                        stringTemplate = stringTemplate.replace('{{StudentQRCode}}', (qrImage != undefined) ? qrImage : "https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png");

                        conversion({ html: stringTemplate }, function (err, pdf) {
                            callbacks.success(pdf);
                        });
                    });
                }
            }
        } else {
            sendInfoMail('Student hall ticket generation failed: ' + username, err);
            callbacks.error(err);
        }
    });
}

function formatDate(date) {
    var d = new Date(date);
    d.setDate(d.getDate());
    var month = '' + (d.getMonth() + 1),
        day = '' + (d.getDate() + 1),
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
            for (var i = 0; i < student.programmes.length; i++) {
                if (i != 0) programmes += ", ";
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
            stringTemplate = stringTemplate.replace('{{photo}}', (student.photo != undefined && student.photo != '') ? ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + student.photo) : 'https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png');
            stringTemplate = stringTemplate.replace('{{birthCertificate}}', (student.birthcertificate != undefined && student.birthcertificate != '') ? ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + student.birthcertificate) : 'https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png');

            conversion({ html: stringTemplate }, function (err, pdf) {
                callbacks.success(pdf);
            });
        } else {
            sendInfoMail('Student form copy download failed: ' + username, err);
            callbacks.error(err);
        }
    });
}

// function readCsv(username, callbacks) {
//     StudentModel.find().exec('find', function (err, students) {
//         var students = students;
//         var counter = 0;
//         for(var s = 0; s < students.length; s++) {
//             for(var p = 0; p < students[s].programmes.length; p++) {
//                 if(students[s].programmes[p].admissioncardno == "") {
//                     counter ++;
//                     console.log(students[s].phone + "   " + students[s].programmes[p].programmename);
//                 }
//             }
//         }
//         console.log(counter);

//         // var CsvReadableStream = require('csv-reader');
//         // var inputStream = fs.createReadStream(path.join(__dirname, '../../helpers') + '/admit2.csv', 'utf8');
//         // inputStream
//         //     .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
//         //     .on('data', function (row) {
//         //         console.log('A row arrived: ', row);
//         //         for(var i = 0; i < students.length; i++) {
//         //             if(row[0] == students[i].phone) {
//         //                 for(var p = 0; p < students[i].programmes.length; p++) {
//         //                     var pro = "";
//         //                     if(row[2] == 'TT') pro = 'Tiny Tots';
//         //                     if(row[2] == 'STT') pro = 'State Tiny Tots';
//         //                     if(row[2] == 'SMA') pro = 'State Mental Arithmetic';
//         //                     if(row[2] == 'MA') pro = 'Mental Arithmetic';
//         //                     if(row[2] == 'ES') pro = 'English Smart';
//         //                     if(row[2] == 'SM') pro = 'Speed Maths';
//         //                     if(students[i].programmes[p].programmename == pro) {
//         //                         students[i].programmes[p].admissioncardno = row[3];
//         //                         students[i].programmes[p].entrytime = "10:45 AM";
//         //                         students[i].save(function (err) { console.log("saved"); });
//         //                     }
//         //                 }
//         //             }
//         //         }
//         //     })
//         //     .on('end', function (data) {
//         //         console.log('No more rows!');
//         //     });
//     });
// }
// module.exports.readCsv = readCsv;

module.exports.createStudent = createStudent;
module.exports.readStudents = readStudents;
module.exports.readStudentById = readStudentById;
module.exports.updateStudent = updateStudent;
module.exports.deleteStudent = deleteStudent;
module.exports.downloadReceipt = downloadReceipt;
module.exports.generateHallTicket = generateHallTicket;
module.exports.downloadCopy = downloadCopy;
