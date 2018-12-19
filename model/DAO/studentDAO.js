var db = require('../../config/mongodb').init(),
    mongoose = require('mongoose'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    conversion = require("phantom-html-to-pdf")(),
    QRCode = require('qrcode');
var sgMail = require('@sendgrid/mail');
var PptxGenJS = require("pptxgenjs");
const createCsvWriter = require('csv-writer').createArrayCsvWriter;

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
    admissioncardno: { type: String },
    marks: { type: Number, default: 0 }
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
                    // sendInfoMail('Student updated: ' + id, f);
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
                if (student.programmes[p]._id == username.program) {
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

var consolidateStudents = function (stu) {
    var temp_stu = [];
    for (var s = 0; s < stu.length; s++) {
        for (var p = 0; p < stu[s].programmes.length; p++) {
            var details = {
                phone: stu[s].phone,
                email: stu[s].email,
                name: stu[s].name,
                dateofbirth: stu[s].dateofbirth,
                gender: stu[s].gender,
                parentname: stu[s].parentname,
                address: stu[s].address,
                tshirtsize: stu[s].tshirtsize,
                photo: stu[s].photo,
                birthcertificate: stu[s].birthcertificate,
                dateCreated: stu[s].dateCreated,
                dateModified: stu[s].dateModified,
                centername: stu[s].centername,
                centercode: stu[s].centercode,
                sstatename: stu[s].sstatename,
                status: stu[s].status,
                mfapproved: stu[s].mfapproved,
                paymentdate: stu[s].paymentdate,
                transactionno: stu[s].transactionno,
                paymentmode: stu[s].paymentmode,
                bankname: stu[s].bankname,
                paymentapproved: stu[s].paymentapproved,
                programmename: stu[s].programmes[p].programmename,
                group: stu[s].programmes[p].group,
                category: stu[s].programmes[p].category,
                level: stu[s].programmes[p].level,
                feesdetails: stu[s].programmes[p].feesdetails,
                lastyearlevel: stu[s].programmes[p].lastyearlevel,
                examdate: stu[s].programmes[p].examdate,
                entrytime: stu[s].programmes[p].entrytime,
                competitiontime: stu[s].programmes[p].competitiontime,
                venue: stu[s].programmes[p].venue,
                admissioncardno: stu[s].programmes[p].admissioncardno,
                marks: stu[s].programmes[p].marks
            };
            temp_stu.push(details);
        }
    }
    return temp_stu;
}

var getResult = function (group, category, level, stu) {
    var students = stu.filter(obj => {
        return obj.programmename == group && obj.level == level && obj.category == category && obj.marks > 25
    });
    var res = {
        det: {
            'group': group,
            'category': category,
            'level': level,
            'count': students.length
        }
    };

    // Get highest and second highest marks overall
    var marks = students.map(function (a) { return a.marks; });
    var max_mark = Math.max.apply(null, marks);
    marks.splice(marks.indexOf(max_mark), 1);
    var second_max_mark = Math.max.apply(null, marks);
    marks.splice(marks.indexOf(second_max_mark), 1);
    var third_max_mark = Math.max.apply(null, marks);
    marks.splice(marks.indexOf(third_max_mark), 1);
    var fourth_max_mark = Math.max.apply(null, marks);
    marks.splice(marks.indexOf(fourth_max_mark), 1);

    // Get Winners
    res.first = students.filter(obj => { return obj.marks == max_mark });
    res.second = students.filter(obj => { return obj.marks == second_max_mark });
    res.third = students.filter(obj => { return obj.marks == third_max_mark });
    res.fourth = students.filter(obj => { return obj.marks == fourth_max_mark });

    // returning result
    return res;
}

var getChampions = function (group, category, stu) {
    var students = stu.filter(obj => {
        return obj.programmename == group && obj.category == category && obj.marks > 25
    });
    var res = {
        det: {
            'group': group,
            'category': category,
            'count': students.length
        }
    };

    // Get highest marks overall
    var marks = students.map(function (a) { return a.marks; });
    var max_mark = Math.max.apply(null, marks);

    // Get Winners
    res.champion = students.filter(obj => { return obj.marks == max_mark });

    // returning result
    return res;
}

var generatePPT = function (arr) {
    var pptx = new PptxGenJS();
    for (var a = 0; a < arr.result.length; a++) {

        // Print Winner
        for (var g = 0; g < arr.result[a].first.length; g++) {
            var slide = pptx.addNewSlide();
            slide.addText(
                ("Congratulations " + arr.result[a].first[g].name + " for being Winner in Category " +
                    arr.result[a].det.category + " and Level " + arr.result[a].det.level + " for Course " +
                    arr.result[a].det.group + " from Center " + arr.result[a].first[g].centername),
                { x: 1.5, y: 1.5, fontSize: 18, color: '363636' }
            );
        }

        // Print 1st runner up
        for (var g = 0; g < arr.result[a].second.length; g++) {
            var slide = pptx.addNewSlide();
            slide.addText(
                ("Congratulations " + arr.result[a].second[g].name + " for being 1st runner up in Category " +
                    arr.result[a].det.category + " and Level " + arr.result[a].det.level + " for Course " +
                    arr.result[a].det.group + " from Center " + arr.result[a].second[g].centername),
                { x: 1.5, y: 1.5, fontSize: 18, color: '363636' }
            );
        }

        // Print 2nd runner up
        for (var g = 0; g < arr.result[a].third.length; g++) {
            var slide = pptx.addNewSlide();
            slide.addText(
                ("Congratulations " + arr.result[a].third[g].name + " for being 2nd runner up in Category " +
                    arr.result[a].det.category + " and Level " + arr.result[a].det.level + " for Course " +
                    arr.result[a].det.group + " from Center " + arr.result[a].third[g].centername),
                { x: 1.5, y: 1.5, fontSize: 18, color: '363636' }
            );
        }

        // Print 3rd runner up
        for (var g = 0; g < arr.result[a].fourth.length; g++) {
            var slide = pptx.addNewSlide();
            slide.addText(
                ("Congratulations " + arr.result[a].fourth[g].name + " for being 3rd runner up in Category " +
                    arr.result[a].det.category + " and Level " + arr.result[a].det.level + " for Course " +
                    arr.result[a].det.group + " from Center " + arr.result[a].fourth[g].centername),
                { x: 1.5, y: 1.5, fontSize: 18, color: '363636' }
            );
        }

    }

    for (var a = 0; a < arr.champions.length; a++) {
        for (var g = 0; g < arr.champions[a].champion.length; g++) {
            var slide = pptx.addNewSlide();
            slide.addText(
                ("Congratulations " + arr.champions[a].champion[g].name + " for being Champion in Category " +
                    arr.champions[a].det.category + " for Course " + arr.champions[a].det.group + " from Center "
                    + arr.champions[a].champion[g].centername),
                { x: 1.5, y: 1.5, fontSize: 18, color: '363636' }
            );
        }
    }
    pptx.save('Sample Presentation');
}

var generateMail = function (arr) {
    const csvWriter = createCsvWriter({
        header: ['POSITION', 'NAME', 'CATEGORY', 'PROGRAMME', 'LEVEL', 'PHONE', 'PHOTO', 
            'CENTER NAME', 'CENTER CODE', 'STATE', 'ADMISSION CARD NO', 'MARKS'],
        path: './results.csv'
    });
    const records = [];

    for (var a = 0; a < arr.result.length; a++) {

        // Print Winner
        for (var g = 0; g < arr.result[a].first.length; g++) {
            records.push([
                'WINNER',
                arr.result[a].first[g].name, 
                arr.result[a].first[g].category, 
                arr.result[a].first[g].programmename, 
                arr.result[a].first[g].level,
                arr.result[a].first[g].phone,
                ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + arr.result[a].first[g].photo),
                arr.result[a].first[g].centername,
                arr.result[a].first[g].centercode,
                arr.result[a].first[g].sstatename,
                arr.result[a].first[g].admissioncardno,
                arr.result[a].first[g].marks
            ]);
        }

        // Print 1st runner up
        for (var g = 0; g < arr.result[a].second.length; g++) {
            records.push([
                'FIRST RUNNER',
                arr.result[a].second[g].name, 
                arr.result[a].second[g].category, 
                arr.result[a].second[g].programmename, 
                arr.result[a].second[g].level,
                arr.result[a].second[g].phone,
                ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + arr.result[a].second[g].photo),
                arr.result[a].second[g].centername,
                arr.result[a].second[g].centercode,
                arr.result[a].second[g].sstatename,
                arr.result[a].second[g].admissioncardno,
                arr.result[a].second[g].marks
            ]);
        }

        // Print 2nd runner up
        for (var g = 0; g < arr.result[a].third.length; g++) {
            records.push([
                'SECOND RUNNER',
                arr.result[a].third[g].name, 
                arr.result[a].third[g].category, 
                arr.result[a].third[g].programmename, 
                arr.result[a].third[g].level,
                arr.result[a].third[g].phone,
                ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + arr.result[a].third[g].photo),
                arr.result[a].third[g].centername,
                arr.result[a].third[g].centercode,
                arr.result[a].third[g].sstatename,
                arr.result[a].third[g].admissioncardno,
                arr.result[a].third[g].marks
            ]);
        }

        // Print 3rd runner up
        for (var g = 0; g < arr.result[a].fourth.length; g++) {
            records.push([
                'THIRD RUNNER',
                arr.result[a].fourth[g].name, 
                arr.result[a].fourth[g].category, 
                arr.result[a].fourth[g].programmename, 
                arr.result[a].fourth[g].level,
                arr.result[a].fourth[g].phone,
                ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + arr.result[a].fourth[g].photo),
                arr.result[a].fourth[g].centername,
                arr.result[a].fourth[g].centercode,
                arr.result[a].fourth[g].sstatename,
                arr.result[a].fourth[g].admissioncardno,
                arr.result[a].fourth[g].marks
            ]);
        }

    }

    // Champions
    for (var a = 0; a < arr.champions.length; a++) {
        for (var g = 0; g < arr.champions[a].champion.length; g++) {
            records.push([
                'CHAMPION',
                arr.champions[a].champion[g].name, 
                arr.champions[a].champion[g].category, 
                arr.champions[a].champion[g].programmename, 
                arr.champions[a].champion[g].level,
                arr.champions[a].champion[g].phone,
                ('https://s3.ap-south-1.amazonaws.com/alohanlc/' + arr.champions[a].champion[g].photo),
                arr.champions[a].champion[g].centername,
                arr.champions[a].champion[g].centercode,
                arr.champions[a].champion[g].sstatename,
                arr.champions[a].champion[g].admissioncardno,
                arr.champions[a].champion[g].marks
            ]);
        }
    }

    csvWriter.writeRecords(records).then(() => {
        console.log('...Done');
    });
}

var generateCenterResult = function (arr) {
    var res = {};
    for (var a = 0; a < arr.result.length; a++) {
        for (var g = 0; g < arr.result[a].first.length; g++) {
            if(res[arr.result[a].first[g].centercode] == undefined)
                res[arr.result[a].first[g].centercode] = {
                    centername: arr.result[a].first[g].centername,
                    centercode: arr.result[a].first[g].centercode,
                    sstatename: arr.result[a].first[g].sstatename,
                    winners: 0,
                    firstrunnerup: 0,
                    secondrunnerup: 0,
                    thirdrunnerup: 0,
                    champion: 0,
                    scores: 0
                }
            res[arr.result[a].first[g].centercode].winners = res[arr.result[a].first[g].centercode].winners + 1;
        }
        for (var g = 0; g < arr.result[a].second.length; g++) {
            if(res[arr.result[a].second[g].centercode] == undefined)
                res[arr.result[a].second[g].centercode] = {
                    centername: arr.result[a].second[g].centername,
                    centercode: arr.result[a].second[g].centercode,
                    sstatename: arr.result[a].second[g].sstatename,
                    winners: 0,
                    firstrunnerup: 0,
                    secondrunnerup: 0,
                    thirdrunnerup: 0,
                    champion: 0,
                    scores: 0
                }
            res[arr.result[a].second[g].centercode].firstrunnerup = res[arr.result[a].second[g].centercode].firstrunnerup + 1;
        }
        for (var g = 0; g < arr.result[a].third.length; g++) {
            if(res[arr.result[a].third[g].centercode] == undefined)
                res[arr.result[a].third[g].centercode] = {
                    centername: arr.result[a].third[g].centername,
                    centercode: arr.result[a].third[g].centercode,
                    sstatename: arr.result[a].third[g].sstatename,
                    winners: 0,
                    firstrunnerup: 0,
                    secondrunnerup: 0,
                    thirdrunnerup: 0,
                    champion: 0,
                    scores: 0
                }
            res[arr.result[a].third[g].centercode].secondrunnerup = res[arr.result[a].third[g].centercode].secondrunnerup + 1;
        }
        for (var g = 0; g < arr.result[a].fourth.length; g++) {
            if(res[arr.result[a].fourth[g].centercode] == undefined)
                res[arr.result[a].fourth[g].centercode] = {
                    centername: arr.result[a].fourth[g].centername,
                    centercode: arr.result[a].fourth[g].centercode,
                    sstatename: arr.result[a].fourth[g].sstatename,
                    winners: 0,
                    firstrunnerup: 0,
                    secondrunnerup: 0,
                    thirdrunnerup: 0,
                    champion: 0,
                    scores: 0
                }
            res[arr.result[a].fourth[g].centercode].thirdrunnerup = res[arr.result[a].fourth[g].centercode].thirdrunnerup + 1;
        }
    }
    for (var a = 0; a < arr.champions.length; a++) {
        for (var g = 0; g < arr.champions[a].champion.length; g++) {
            if(res[arr.champions[a].champion[g].centercode] == undefined)
                res[arr.champions[a].champion[g].centercode] = {
                    centername: arr.champions[a].champion[g].centername,
                    centercode: arr.champions[a].champion[g].centercode,
                    sstatename: arr.champions[a].champion[g].sstatename,
                    winners: 0,
                    firstrunnerup: 0,
                    secondrunnerup: 0,
                    thirdrunnerup: 0,
                    champion: 0,
                    scores: 0
                }
            res[arr.champions[a].champion[g].centercode].champion = res[arr.champions[a].champion[g].centercode].champion + 1;
        }
    }

    const csvWriter = createCsvWriter({
        header: ['CENTER NAME', 'CENTER CODE', 'STATE', 'WINNERS', 'FIRST RUNNER UP', 
            'SECOND RUNNER UP', 'THIRD RUNNER UP', 'CHAMPIONS', 'SCORE'],
        path: './center_results.csv'
    });
    const records = [];

    for (var prop in res) {
            records.push([
                res[prop].centername,
                res[prop].centercode,
                res[prop].sstatename,
                res[prop].winners,
                res[prop].firstrunnerup,
                res[prop].secondrunnerup,
                res[prop].thirdrunnerup,
                res[prop].champion,
                ((res[prop].winners*4) + (res[prop].champion*5) + (res[prop].firstrunnerup*3) + (res[prop].secondrunnerup*2) + (res[prop].thirdrunnerup*1))
            ]);
    }

    csvWriter.writeRecords(records).then(() => {
        console.log('...CENTER Done');
    });
}

function generateResult(username, callbacks) {
    StudentModel.find().exec('find', function (err, students) {
        students = consolidateStudents(students);
        var groups_list = ['Tiny Tots', 'Mental Arithmetic', 'English Smart', 'Speed Maths', 'State Tiny Tots', 'State Mental Arithmetic'];
        var stringnow = {
            result: [],
            champions: [],
            centers: []
        };

        for (var g = 0; g < groups_list.length; g++) {
            if (groups_list[g] == 'Tiny Tots' || groups_list[g] == 'State Tiny Tots') {
                category_list = ['A', 'B'];
                levels_list = ["pre", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
            }
            if (groups_list[g] == 'Mental Arithmetic' || groups_list[g] == 'State Mental Arithmetic') {
                category_list = ['A', 'B', 'C', 'D'];
                levels_list = ["pre", "1", "2", "3", "4", "5", "6", "7", "8"];
            }
            if (groups_list[g] == 'English Smart' || groups_list[g] == 'Speed Maths') {
                category_list = ['A'];
                levels_list = ["1", "2", "3", "4", "5", "6"];
            }

            for (var l = 0; l < levels_list.length; l++) {
                for (var c = 0; c < category_list.length; c++) {
                    var rslt = getResult(groups_list[g], category_list[c], levels_list[l], students);
                    stringnow.result.push(rslt);
                }
            }

            for (var c = 0; c < category_list.length; c++) {
                var rslts = getChampions(groups_list[g], category_list[c], students);
                stringnow.champions.push(rslts);
            }
        }

        generatePPT(stringnow);
        generateMail(stringnow);
        generateCenterResult(stringnow);
        callbacks.success(stringnow);
    });
};
module.exports.generateResult = generateResult;

module.exports.createStudent = createStudent;
module.exports.readStudents = readStudents;
module.exports.readStudentById = readStudentById;
module.exports.updateStudent = updateStudent;
module.exports.deleteStudent = deleteStudent;
module.exports.downloadReceipt = downloadReceipt;
module.exports.generateHallTicket = generateHallTicket;
module.exports.downloadCopy = downloadCopy;
