var db = require("../../config/mongodb").init(),
  karnatakadb = require("../../config/karnatakamongodb").init(),
  mongoose = require("mongoose"),
  path = require("path"),
  fs = require("fs"),
  http = require("http"),
  conversion = require("phantom-html-to-pdf")(),
  QRCode = require("qrcode");
var sgMail = require("@sendgrid/mail");
const createCsvWriter = require("csv-writer").createArrayCsvWriter;
var PptxGenJS = require("pptxgenjs");

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

var curl = require("curlrequest");
var smsUrl = "https://smsapp.mx9.in/smpp/?username=alohaindia&password=9790944889&from=ALOHAS&to=91";

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
  marks: { type: Number, default: 0 },
  prizeone: { type: String, required: true, default: '' },
  prizetwo: { type: String, required: true, default: '' }
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

var KarnatakaSchema = new Schema({
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  dateofbirth: { type: String, required: true },
  gender: { type: String, required: true },
  parentname: { type: String, required: true },
  address: { type: String, required: true },
  programmename: { type: String },
  tshirtrequired: { type: Boolean },
  tshirtsize: { type: String },
  photo: { type: String },
  birthcertificate: { type: String },
  centername: { type: String },
  centercode: { type: String, required: true },
  schoolname: { type: String },
  status: { type: String, required: true },
  dateCreated: { type: Date, required: true },
  dateModified: { type: Date },
  group: { type: String },
  category: { type: String },
  level: { type: String },
  registrationdate: { type: String },
  studentcode: { type: String },
  presentlevel: { type: String },
  presentweek: { type: String },
  section: { type: String },
  class: { type: String },
  lastyearlevel: { type: String },
  paymentdate: { type: String },
  transactionno: { type: String },
  paymentmode: { type: String },
  bankname: { type: String },
  examdate: { type: String },
  entrytime: { type: String },
  competitiontime: { type: String },
  venue: { type: String },
  admissioncardno: { type: String },
  paymentapproved: { type: Boolean, default: false },
  marks: { type: Number, default: 0, required: true }
});

StudentSchema.pre("save", function(next) {
  now = new Date();
  this.dateModified = now;
  if (!this.dateCreated) {
    this.dateCreated = now;
  }
  next();
});
var StudentModel = db.model("Student", StudentSchema);
var KarnatakaModel = karnatakadb.model("student", KarnatakaSchema);

var sendInfoMail = function(subject, stringTemplate) {
  var mailOptions = {
    to: "akash.ka01@gmail.com",
    from: "info@aloha.com",
    subject: subject,
    text: JSON.stringify(stringTemplate)
  };
  sgMail.send(mailOptions, function(err) {
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
    status: "open",
    dateCreated: new Date()
  });
  f.save(function(err) {
    if (!err) {
      sendInfoMail("Student created with id: " + f._id, f);
      callbacks.success(f);
    } else {
      sendInfoMail("Error in Creating Student", err + f);
      callbacks.error(err);
    }
  });
}

//READ all Students
function readStudents(skip, count, callbacks) {
  return StudentModel.find()
    .sort("-dateCreated")
    .skip(skip)
    .limit(count)
    .exec("find", function(err, students) {
      if (!err) {
        callbacks.success(students);
      } else {
        sendInfoMail("Student read failed", err);
        callbacks.error(err);
      }
    });
}

//READ student by id
function readStudentById(id, callbacks) {
  return StudentModel.findById(id, function(err, student) {
    if (!err) {
      callbacks.success(student);
    } else {
      sendInfoMail("Student read with id failed: " + id, err);
      callbacks.error(err);
    }
  });
}

//READ student by Phone
function readStudentByPhone(id, callbacks) {
  return StudentModel.find({ phone: id }, function(err, student) {
    if (!err) {
      callbacks.success(student);
    } else {
      sendInfoMail("Student read with id failed: " + id, err);
      callbacks.error(err);
    }
  });
}

function getCenterCode(ccode) {
  if (ccode == "1367") return "1367";
  if (ccode == "1379") return "1364A";
  if (ccode == "1323") return "1323";
  if (ccode == "1321") return "1364A";
  if (ccode == "KA42") return "1364A";
  if (ccode == "1357") return "1357";
  if (ccode == "1356") return "1356";
  if (ccode == "1344") return "1344";
  if (ccode == "1364") return "1364A";
  if (ccode == "1400") return "1400";
  if (ccode == "SCH1") return "1364A";
  if (ccode == "SCH2") return "1364A";
  if (ccode == "SCH3") return "1364A";
  if (ccode == "SCH4") return "1364A";
}

function getCenterName(ccode) {
  if (ccode == "1367") return "Aloha Hebbal";
  if (ccode == "1379") return "Aloha Jalahalli West";
  if (ccode == "1323") return "Aloha Kumara Park West";
  if (ccode == "1321") return "Aloha Jalahalli West";
  if (ccode == "KA42") return "Aloha Jalahalli West";
  if (ccode == "1357") return "Aloha RPD Cross";
  if (ccode == "1356") return "MALMARUTHI Belgaum";
  if (ccode == "1344") return "Aloha Court Road, Karkala";
  if (ccode == "1364") return "Aloha Jalahalli West";
  if (ccode == "1400") return "Aloha Mysore";
  if (ccode == "SCH1") return "Aloha Jalahalli West";
  if (ccode == "SCH2") return "Aloha Jalahalli West";
  if (ccode == "SCH3") return "Aloha Jalahalli West";
  if (ccode == "SCH4") return "Aloha Jalahalli West";
}

//UPDATE student
function updateStudent(id, student, callbacks) {
  return StudentModel.findById(id, function(err, f) {
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

      return f.save(function(err) {
        if (!err) {
          sendInfoMail("Student updated: " + id, f);
          callbacks.success(f);
        } else {
          sendInfoMail("Student update failed: " + id, err + f);
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
  return StudentModel.findById(id, function(err, f) {
    if (!err) {
      return f.remove(function(err) {
        if (!err) {
          sendInfoMail("Student removed: " + id, f);
          callbacks.success(f);
        } else {
          sendInfoMail("Student remove failed: " + id, err + f);
          callbacks.error(err);
        }
      });
    } else {
      callbacks.error(err);
    }
  });
}

function downloadReceipt(username, callbacks) {
  StudentModel.find({ phone: username.username }, function(err, student) {
    if (!err) {
      student = student[0];
      var programmes = "";
      var amount = 0;
      for (var i = 0; i < student.programmes.length; i++) {
        if (i != 0) programmes += ", ";
        programmes += student.programmes[i].programmename;
      }
      var count = (programmes.match(/State/g) || []).length;

      if (student.programmes.length == 1) amount = 1000;
      if (student.programmes.length == 2 && count > 0) amount = 1600;
      if (student.programmes.length == 2 && count <= 0) amount = 1800;
      if (student.programmes.length == 3 && count > 0) amount = 2600;
      if (student.programmes.length == 3 && count < 0) amount = 2800;
      if (student.programmes.length == 4 && count > 0) amount = 3200;
      if (student.programmes.length == 4 && count <= 0) amount = 3600;

      var stringTemplate = fs.readFileSync(
        path.join(__dirname, "../../helpers") + "/receipt.html",
        "utf8"
      );
      stringTemplate = stringTemplate.replace(
        "{{stateName}}",
        student.sstatename != undefined ? student.sstatename : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{centerName}}",
        student.centername != undefined ? student.centername : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{parentName}}",
        student.parentname != undefined ? student.parentname : ""
      );
      stringTemplate = stringTemplate.replace("{{amount}}", amount);
      stringTemplate = stringTemplate.replace(
        "{{studentName}}",
        student.name != undefined ? student.name : ""
      );
      stringTemplate = stringTemplate.replace("{{coursesName}}", programmes);

      conversion({ html: stringTemplate }, function(err, pdf) {
        callbacks.success(pdf);
      });
    } else {
      sendInfoMail("Student receipt download failed: " + username, err);
      callbacks.error(err);
    }
  });
}

// Karnataka student shifting
function karnataka(username, callbacks) {
  KarnatakaModel.find().exec("find", function(err, kstudents) {
    for (var i = 0; i < kstudents.length; i++) {
      if (kstudents[i].phone == username) {
        var f = new StudentModel({
          phone: kstudents[i].phone,
          email: kstudents[i].email,
          name: kstudents[i].name.toUpperCase(),
          dateofbirth: kstudents[i].dateofbirth,
          gender: kstudents[i].gender,
          parentname: kstudents[i].parentname.toUpperCase(),
          address: kstudents[i].address,
          tshirtsize:
            kstudents[i].tshirtsize != "" ? kstudents[i].tshirtsize : "L",
          photo: kstudents[i].photo,
          birthcertificate: kstudents[i].birthcertificate,
          centername: getCenterName(kstudents[i].centercode),
          centercode: getCenterCode(kstudents[i].centercode),
          sstatename: "Karnataka",
          programmes: [],
          status: "open",
          dateCreated: new Date()
        });

        f.programmes.push({
          programmename:
            kstudents[i].group == "TT" || kstudents[i].group == "TTS"
              ? "Tiny Tots"
              : kstudents[i].group == "MA" || kstudents[i].group == "MAS"
              ? "Mental Arithmetic"
              : "",
          group: "",
          category: kstudents[i].category,
          level: kstudents[i].level,
          feesdetails: [],
          lastyearlevel: kstudents[i].lastyearlevel
        });

        f.save(function(err) {
          if (!err) {
            sendInfoMail("Karnataka Student created with id: " + f._id, f);
            callbacks.success(f);
          } else {
            sendInfoMail("Error in Creating Karnataka Student", err + f);
            callbacks.error(err);
          }
        });
      }
    }
  });
}

// GENERATING Hall ticket
function generateHallTicket(username, callbacks) {
  console.log(username);
  StudentModel.find({ phone: username.username }, function(err, student) {
    if (!err) {
      student = student[0];
      for (var p = 0; p < student.programmes.length; p++) {
        if (student.programmes[p]._id == username.program.toString()) {
          var program = student.programmes[p];
          var text = "Student Name: " + student.name + "\n \n";
          text += "Roll No: " + student.programmes[p].admissioncardno + "\n \n";
          text +=
            "Reporting Time: " + student.programmes[p].entrytime + "\n \n";
          text += "Center: " + student.centername;
          QRCode.toDataURL(text, function(err, body) {
            var qrImage = "";
            if (!err) qrImage = body;
            var stringTemplate = fs.readFileSync(
              path.join(__dirname, "../../helpers") + "/hallticket.html",
              "utf8"
            );

            stringTemplate = stringTemplate.replace(
              "{{headingName}}",
              program.programmename.indexOf("State") != -1
                ? "16th State Level Competition 2019"
                : "16th National Level Competition 2019"
            );
            stringTemplate = stringTemplate.replace(
              "{{StudentRollNumber}}",
              program.admissioncardno != undefined
                ? program.admissioncardno
                : ""
            );
            stringTemplate = stringTemplate.replace(
              "{{StudentName}}",
              student.name
            );
            stringTemplate = stringTemplate.replace(
              "{{StateName}}",
              student.sstatename
            );
            stringTemplate = stringTemplate.replace(
              "{{CenterName}}",
              student.centername
            );
            stringTemplate = stringTemplate.replace(
              "{{CenterCode}}",
              student.centercode
            );
            stringTemplate = stringTemplate.replace(
              "{{ReportingTime}}",
              program.entrytime != undefined ? program.entrytime : ""
            );
            stringTemplate = stringTemplate.replace(
              "{{StudentImage}}",
              student.photo != undefined
                ? student.photo
                : "https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png"
            );
            stringTemplate = stringTemplate.replace(
              "{{StudentQRCode}}",
              qrImage != undefined
                ? qrImage
                : "https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png"
            );

            conversion({ html: stringTemplate }, function(err, pdf) {
              callbacks.success(pdf);
            });
          });
        }
      }
    } else {
      sendInfoMail("Student hall ticket generation failed: " + username, err);
      callbacks.error(err);
    }
  });
}

function formatDate(date) {
  var d = new Date(date);
  d.setDate(d.getDate());
  var month = "" + (d.getMonth() + 1),
    day = "" + (d.getDate() + 1),
    year = d.getFullYear();

  console.log("a", day + " - " + month + " - " + year);
  if (
    month == "1" ||
    month == "3" ||
    month == "5" ||
    month == "7" ||
    month == "8" ||
    month == "10" ||
    month == "12"
  ) {
    if (day == "32") {
      month = "" + (parseInt(month) + 1);
      day = "1";
    }
    if (month == "13") {
      month = "1";
      year = "" + (parseInt(year) + 1);
    }
    console.log("b", day + " - " + month + " - " + year);
  } else if (month == "4" || month == "6" || month == "9" || month == "11") {
    if (day == "31") {
      month = "" + (parseInt(month) + 1);
      day = "1";
    }
    console.log("c", day + " - " + month + " - " + year);
  } else if (month == "2" && day == "28") {
    month = "" + (parseInt(month) + 1);
    day = "1";
    console.log("d", day + " - " + month + " - " + year);
  }
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  console.log("e", day + " - " + month + " - " + year);
  return [day, month, year].join("/");
}

// Generating Form Copy
function downloadCopy(username, callbacks) {
  StudentModel.find({ phone: username.username }, function(err, student) {
    if (!err) {
      student = student[0];
      var programmes = "";
      for (var i = 0; i < student.programmes.length; i++) {
        if (i != 0) programmes += ", ";
        programmes += student.programmes[i].programmename;
      }
      var stringTemplate = fs.readFileSync(
        path.join(__dirname, "../../helpers") + "/copy.html",
        "utf8"
      );
      stringTemplate = stringTemplate.replace(
        "{{sstateName}}",
        student.sstatename ? student.sstatename : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{centerName}}",
        student.centername ? student.centername : ""
      );
      stringTemplate = stringTemplate.replace("{{programmes}}", programmes);
      stringTemplate = stringTemplate.replace(
        "{{phoneNo}}",
        student.phone ? student.phone : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{emailId}}",
        student.email ? student.email : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{studentName}}",
        student.name ? student.name : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{gender}}",
        student.gender ? student.gender : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{parentName}}",
        student.parentname ? student.parentname : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{address}}",
        student.address ? student.address : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{dateOfBirth}}",
        student.dateofbirth ? formatDate(student.dateofbirth) : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{tShirtSize}}",
        student.tshirtsize ? student.tshirtsize : ""
      );
      stringTemplate = stringTemplate.replace(
        "{{photo}}",
        student.photo != undefined && student.photo != ""
          ? student.photo
          : "https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png"
      );
      stringTemplate = stringTemplate.replace(
        "{{birthCertificate}}",
        student.birthcertificate != undefined && student.birthcertificate != ""
          ? student.birthcertificate
          : "https://consumercomplaintscourt.com/wp-content/uploads/2015/12/no_uploaded.png"
      );

      conversion({ html: stringTemplate }, function(err, pdf) {
        callbacks.success(pdf);
      });
    } else {
      sendInfoMail("Student form copy download failed: " + username, err);
      callbacks.error(err);
    }
  });
}

// function sendsms(username, callbacks) {
//   console.log("abc");
//   StudentModel.find().exec("find", function(err, students) {
//     if (!err) {
//       for (var s = 0; s < students.length; s++) {
//         if (s == 0) {
//           // for (var p = 0; p < students[s].programmes.length; p++) {
//           // var url = 'http://alohaonline.in/api/0.1/student/generateHallTicket/' +
//           //     students[s].phone + '/' + students[s].programmes[p]._id;
//           var messageData =
//             "Team Aloha India. Dear Parents, If you have any issue related to Aloha NLC 2018, kindly contact Mrs. Jaya on Whatsapp number 9790944889. Kindly click on the link below to download Info Guide of NLC 2018: " +
//             "https://www.alohaonline.in/info_guide.htm";
//           var phonenumber = students[s].phone;
//           var formData =
//             smsUrl + phonenumber + "&text=" + encodeURIComponent(messageData);
//           console.log(formData);
//           curl.request(formData, function optionalCallback(err, body) {
//             if (err) {
//               return console.error("Sending SMS to parent failed: ", err);
//             }
//           });
//         }
//       }
//       var stringnow = "";
//       res.status(200).send({ stringnow });
//     } else {
//       sendInfoMail("Student form copy download failed: " + username, err);
//       callbacks.error(err);
//     }
//   });
// }

// function readCsv(username, callbacks) {
//   console.log("yes");
//   StudentModel.find().exec("find", function(err, students) {
//     var students = students;
//     var CsvReadableStream = require("csv-reader");
//     var inputStream = fs.createReadStream(
//       path.join(__dirname, "../../helpers") + "/marks.csv",
//       "utf8"
//     );
//     inputStream
//       .pipe(
//         CsvReadableStream({
//           parseNumbers: true,
//           parseBooleans: true,
//           trim: true
//         })
//       )
//       .on("data", function(row) {
//         console.log("A row arrived: ", row);
//         for (var i = 0; i < students.length; i++) {
//           // if (row[0] == students[i].phone) {
//             // console.log("Phone Matched");
//             for (var p = 0; p < students[i].programmes.length; p++) {
//               if (students[i].programmes[p].admissioncardno == row[0]) {
//                 console.log("Admission Card Matched: " + row[8]);
//                 students[i].programmes[p].marks = row[1] != "" ? row[1] : 0;
//                 console.log(
//                   "Updating marks to: " + students[i].programmes[p].marks
//                 );
//                 students[i].save(function(err) {
//                   console.log("saved");
//                 });
//               }
//             }
//           // }
//         }
//       })
//       .on("end", function(data) {
//         console.log("No more rows!");
//       });
//   });
// }
// // readCsv();

// var consolidateStudents = function(stu) {
//   var temp_stu = [];
//   for (var s = 0; s < stu.length; s++) {
//     for (var p = 0; p < stu[s].programmes.length; p++) {
//       var details = {
//         phone: stu[s].phone,
//         email: stu[s].email,
//         name: stu[s].name,
//         dateofbirth: stu[s].dateofbirth,
//         gender: stu[s].gender,
//         parentname: stu[s].parentname,
//         address: stu[s].address,
//         tshirtsize: stu[s].tshirtsize,
//         photo: stu[s].photo,
//         birthcertificate: stu[s].birthcertificate,
//         dateCreated: stu[s].dateCreated,
//         dateModified: stu[s].dateModified,
//         centername: stu[s].centername,
//         centercode: stu[s].centercode,
//         sstatename: stu[s].sstatename,
//         status: stu[s].status,
//         mfapproved: stu[s].mfapproved,
//         paymentdate: stu[s].paymentdate,
//         transactionno: stu[s].transactionno,
//         paymentmode: stu[s].paymentmode,
//         bankname: stu[s].bankname,
//         paymentapproved: stu[s].paymentapproved,
//         programmename: stu[s].programmes[p].programmename,
//         group: stu[s].programmes[p].group,
//         category: stu[s].programmes[p].category,
//         level: stu[s].programmes[p].level,
//         feesdetails: stu[s].programmes[p].feesdetails,
//         lastyearlevel: stu[s].programmes[p].lastyearlevel,
//         examdate: stu[s].programmes[p].examdate,
//         entrytime: stu[s].programmes[p].entrytime,
//         competitiontime: stu[s].programmes[p].competitiontime,
//         venue: stu[s].programmes[p].venue,
//         admissioncardno: stu[s].programmes[p].admissioncardno,
//         marks: stu[s].programmes[p].marks
//       };
//       temp_stu.push(details);
//     }
//   }
//   return temp_stu;
// };

// var getResult = function(group, category, level, stu, cutoffmarks) {
//   var students = stu.filter(obj => {
//     return (
//       obj.programmename == group &&
//       obj.level == level &&
//       obj.category == category &&
//       obj.marks > cutoffmarks
//     );
//   });

//   var res = {
//     det: {
//       group: group,
//       category: category,
//       level: level,
//       count: students.length
//     }
//   };

//   // Get highest and second highest marks overall
//   var marks = students.map(function(a) {
//     return a.marks;
//   });
//   marks = [...new Set(marks)];
//   marks = marks.filter(function(item, pos) {
//     return marks.indexOf(item) == pos;
//   });
//   var max_mark = Math.max.apply(null, marks);
//   marks.splice(marks.indexOf(max_mark), 1);
//   var second_max_mark = Math.max.apply(null, marks);
//   marks.splice(marks.indexOf(second_max_mark), 1);
//   var third_max_mark = Math.max.apply(null, marks);
//   marks.splice(marks.indexOf(third_max_mark), 1);
//   var fourth_max_mark = Math.max.apply(null, marks);
//   marks.splice(marks.indexOf(fourth_max_mark), 1);

//   // Get Winners
//   res.first = students.filter(obj => {
//     return obj.marks == max_mark;
//   });
//   res.second = students.filter(obj => {
//     return obj.marks == second_max_mark;
//   });
//   res.third = students.filter(obj => {
//     return obj.marks == third_max_mark;
//   });
//   res.fourth = students.filter(obj => {
//     return obj.marks == fourth_max_mark;
//   });

//   // returning result
//   return res;
// };

// var getChampions = function(group, category, stu, cutoffmarks) {
//   var students = stu.filter(obj => {
//     return (
//       obj.programmename == group &&
//       obj.category == category &&
//       obj.marks > cutoffmarks
//     );
//   });

//   var students_pre1 = students.filter(obj => {
//     return obj.level == "pre" || obj.level == "1";
//   });
//   var students_notpre1 = students.filter(obj => {
//     return obj.level != "pre" && obj.level != "1";
//   });

//   var res = {
//     det: {
//       group: group,
//       category: category,
//       count: students.length
//     },
//     champion: []
//   };

//   // Get highest marks overall
//   var marks = students_pre1.map(function(a) {
//     return a.marks;
//   });
//   marks = [...new Set(marks)];

//   var max_mark_pre1 = Math.max.apply(null, marks);
//   var pre1 = students_pre1.filter(obj => {
//     return obj.marks == max_mark_pre1;
//   });

//   var marks = students_notpre1.map(function(a) {
//     return a.marks;
//   });
//   var max_mark_notPre1 = Math.max.apply(null, marks);
//   var notpre1 = students_notpre1.filter(obj => {
//     return obj.marks == max_mark_notPre1;
//   });

//   var percentage_pre1 = (max_mark_pre1 / 80) * 100;
//   var percentage_notPre1 = (max_mark_notPre1 / 70) * 100;

//   if (percentage_pre1 >= percentage_notPre1) {
//     for (var p = 0; p < pre1.length; p++) {
//       res.champion.push(pre1[p]);
//     }
//   }

//   if (percentage_pre1 <= percentage_notPre1) {
//     for (var p = 0; p < notpre1.length; p++) {
//       res.champion.push(notpre1[p]);
//     }
//   }

//   // returning result
//   return res;
// };

// var generateMail = function(arr) {
//   const csvWriter = createCsvWriter({
//     header: [
//       "POSITION",
//       "NAME",
//       "CATEGORY",
//       "PROGRAMME",
//       "LEVEL",
//       "PHONE",
//       "PHOTO",
//       "CENTER NAME",
//       "CENTER CODE",
//       "STATE",
//       "ADMISSION CARD NO",
//       "MARKS"
//     ],
//     path: "./resultsNew.csv"
//   });
//   const records = [];

//   for (var a = 0; a < arr.result.length; a++) {
//     // Print Winner
//     for (var g = 0; g < arr.result[a].first.length; g++) {
//       records.push([
//         "WINNER",
//         arr.result[a].first[g].name,
//         arr.result[a].first[g].category,
//         arr.result[a].first[g].programmename,
//         arr.result[a].first[g].level,
//         arr.result[a].first[g].phone,
//         arr.result[a].first[g].photo,
//         arr.result[a].first[g].centername,
//         arr.result[a].first[g].centercode,
//         arr.result[a].first[g].sstatename,
//         arr.result[a].first[g].admissioncardno,
//         arr.result[a].first[g].marks
//       ]);
//     }

//     // Print 1st runner up
//     for (var g = 0; g < arr.result[a].second.length; g++) {
//       records.push([
//         "FIRST RUNNER",
//         arr.result[a].second[g].name,
//         arr.result[a].second[g].category,
//         arr.result[a].second[g].programmename,
//         arr.result[a].second[g].level,
//         arr.result[a].second[g].phone,
//         arr.result[a].second[g].photo,
//         arr.result[a].second[g].centername,
//         arr.result[a].second[g].centercode,
//         arr.result[a].second[g].sstatename,
//         arr.result[a].second[g].admissioncardno,
//         arr.result[a].second[g].marks
//       ]);
//     }

//     // Print 2nd runner up
//     for (var g = 0; g < arr.result[a].third.length; g++) {
//       records.push([
//         "SECOND RUNNER",
//         arr.result[a].third[g].name,
//         arr.result[a].third[g].category,
//         arr.result[a].third[g].programmename,
//         arr.result[a].third[g].level,
//         arr.result[a].third[g].phone,
//         arr.result[a].third[g].photo,
//         arr.result[a].third[g].centername,
//         arr.result[a].third[g].centercode,
//         arr.result[a].third[g].sstatename,
//         arr.result[a].third[g].admissioncardno,
//         arr.result[a].third[g].marks
//       ]);
//     }

//     // Print 3rd runner up
//     for (var g = 0; g < arr.result[a].fourth.length; g++) {
//       records.push([
//         "THIRD RUNNER",
//         arr.result[a].fourth[g].name,
//         arr.result[a].fourth[g].category,
//         arr.result[a].fourth[g].programmename,
//         arr.result[a].fourth[g].level,
//         arr.result[a].fourth[g].phone,
//         arr.result[a].fourth[g].photo,
//         arr.result[a].fourth[g].centername,
//         arr.result[a].fourth[g].centercode,
//         arr.result[a].fourth[g].sstatename,
//         arr.result[a].fourth[g].admissioncardno,
//         arr.result[a].fourth[g].marks
//       ]);
//     }
//   }

//   // Champions
//   for (var a = 0; a < arr.champions.length; a++) {
//     for (var g = 0; g < arr.champions[a].champion.length; g++) {
//       records.push([
//         "CHAMPION",
//         arr.champions[a].champion[g].name,
//         arr.champions[a].champion[g].category,
//         arr.champions[a].champion[g].programmename,
//         arr.champions[a].champion[g].level,
//         arr.champions[a].champion[g].phone,
//         arr.champions[a].champion[g].photo,
//         arr.champions[a].champion[g].centername,
//         arr.champions[a].champion[g].centercode,
//         arr.champions[a].champion[g].sstatename,
//         arr.champions[a].champion[g].admissioncardno,
//         arr.champions[a].champion[g].marks
//       ]);
//     }
//   }

//   csvWriter.writeRecords(records).then(() => {
//     console.log("...Done");
//   });
// };

// var generateCenterResult = function(arr) {
//   var res = {};
//   console.log("abcderregd");
//   var courses = ["State Mental Arithmetic"];
//   // var courses = ['Tiny Tots', 'Mental Arithmetic', 'English Smart', 'Speed Maths', 'State Tiny Tots', 'State Mental Arithmetic'];

//   for (var co = 0; co < courses.length; co++) {
//     for (var a = 0; a < arr.result.length; a++) {
//       for (var g = 0; g < arr.result[a].first.length; g++) {
//         // 'Tiny Tots', 'Mental Arithmetic', 'English Smart', 'Speed Maths', 'State Tiny Tots', 'State Mental Arithmetic'
//         if (arr.result[a].first[g].programmename == courses[co]) {
//           if (res[arr.result[a].first[g].centercode] == undefined)
//             res[arr.result[a].first[g].centercode] = {
//               centername: arr.result[a].first[g].centername,
//               centercode: arr.result[a].first[g].centercode,
//               sstatename: arr.result[a].first[g].sstatename,
//               course: courses[co],
//               winners: 0,
//               firstrunnerup: 0,
//               secondrunnerup: 0,
//               thirdrunnerup: 0,
//               champion: 0,
//               scores: 0
//             };
//           res[arr.result[a].first[g].centercode].winners =
//             res[arr.result[a].first[g].centercode].winners + 1;
//         }
//       }
//       for (var g = 0; g < arr.result[a].second.length; g++) {
//         if (arr.result[a].second[g].programmename == courses[co]) {
//           if (res[arr.result[a].second[g].centercode] == undefined)
//             res[arr.result[a].second[g].centercode] = {
//               centername: arr.result[a].second[g].centername,
//               centercode: arr.result[a].second[g].centercode,
//               sstatename: arr.result[a].second[g].sstatename,
//               courses: courses[co],
//               winners: 0,
//               firstrunnerup: 0,
//               secondrunnerup: 0,
//               thirdrunnerup: 0,
//               champion: 0,
//               scores: 0
//             };
//           res[arr.result[a].second[g].centercode].firstrunnerup =
//             res[arr.result[a].second[g].centercode].firstrunnerup + 1;
//         }
//       }
//       for (var g = 0; g < arr.result[a].third.length; g++) {
//         if (arr.result[a].third[g].programmename == courses[co]) {
//           if (res[arr.result[a].third[g].centercode] == undefined)
//             res[arr.result[a].third[g].centercode] = {
//               centername: arr.result[a].third[g].centername,
//               centercode: arr.result[a].third[g].centercode,
//               sstatename: arr.result[a].third[g].sstatename,
//               courses: courses[co],
//               winners: 0,
//               firstrunnerup: 0,
//               secondrunnerup: 0,
//               thirdrunnerup: 0,
//               champion: 0,
//               scores: 0
//             };
//           res[arr.result[a].third[g].centercode].secondrunnerup =
//             res[arr.result[a].third[g].centercode].secondrunnerup + 1;
//         }
//       }
//       for (var g = 0; g < arr.result[a].fourth.length; g++) {
//         if (arr.result[a].fourth[g].programmename == courses[co]) {
//           if (res[arr.result[a].fourth[g].centercode] == undefined)
//             res[arr.result[a].fourth[g].centercode] = {
//               centername: arr.result[a].fourth[g].centername,
//               centercode: arr.result[a].fourth[g].centercode,
//               sstatename: arr.result[a].fourth[g].sstatename,
//               courses: courses[co],
//               winners: 0,
//               firstrunnerup: 0,
//               secondrunnerup: 0,
//               thirdrunnerup: 0,
//               champion: 0,
//               scores: 0
//             };
//           res[arr.result[a].fourth[g].centercode].thirdrunnerup =
//             res[arr.result[a].fourth[g].centercode].thirdrunnerup + 1;
//         }
//       }
//     }
//     for (var a = 0; a < arr.champions.length; a++) {
//       for (var g = 0; g < arr.champions[a].champion.length; g++) {
//         if (arr.champions[a].champion[g].programmename == courses[co]) {
//           if (res[arr.champions[a].champion[g].centercode] == undefined)
//             res[arr.champions[a].champion[g].centercode] = {
//               centername: arr.champions[a].champion[g].centername,
//               centercode: arr.champions[a].champion[g].centercode,
//               sstatename: arr.champions[a].champion[g].sstatename,
//               courses: courses[co],
//               winners: 0,
//               firstrunnerup: 0,
//               secondrunnerup: 0,
//               thirdrunnerup: 0,
//               champion: 0,
//               scores: 0
//             };
//           res[arr.champions[a].champion[g].centercode].champion =
//             res[arr.champions[a].champion[g].centercode].champion + 1;
//         }
//       }
//     }
//   }

//   const csvWriter = createCsvWriter({
//     header: [
//       "CENTER NAME",
//       "CENTER CODE",
//       "STATE",
//       "PROGRAM",
//       "WINNERS",
//       "FIRST RUNNER UP",
//       "SECOND RUNNER UP",
//       "THIRD RUNNER UP",
//       "CHAMPIONS",
//       "SCORE"
//     ],
//     path: "./center_results.csv"
//   });
//   const records = [];

//   for (var prop in res) {
//     records.push([
//       res[prop].centername,
//       res[prop].centercode,
//       res[prop].sstatename,
//       res[prop].courses,
//       res[prop].winners,
//       res[prop].firstrunnerup,
//       res[prop].secondrunnerup,
//       res[prop].thirdrunnerup,
//       res[prop].champion,
//       res[prop].winners * 4 +
//         res[prop].champion * 5 +
//         res[prop].firstrunnerup * 3 +
//         res[prop].secondrunnerup * 2 +
//         res[prop].thirdrunnerup * 1
//     ]);
//   }

//   csvWriter.writeRecords(records).then(() => {
//     console.log("...CENTER Done");
//   });
// };

// function generateResult(username, callbacks) {
//   StudentModel.find().exec("find", function(err, students) {
//     students = consolidateStudents(students);
//     var groups_list = [
//       "Tiny Tots",
//       "Mental Arithmetic",
//       "English Smart",
//       "Speed Maths",
//       "State Tiny Tots",
//       "State Mental Arithmetic"
//     ];
//     var stringnow = {
//       result: [],
//       champions: [],
//       centers: []
//     };

//     for (var g = 0; g < groups_list.length; g++) {
//       if (
//         groups_list[g] == "Mental Arithmetic" ||
//         groups_list[g] == "State Mental Arithmetic"
//       ) {
//         category_list = ["A", "B", "C", "D"];
//         levels_list = ["pre", "1", "2", "3", "4", "5", "6", "7", "8"];
//       }
//       if (
//         groups_list[g] == "English Smart" ||
//         groups_list[g] == "Speed Maths"
//       ) {
//         category_list = ["A"];
//         levels_list = ["1", "2", "3", "4", "5", "6"];
//       }
//       if (
//         groups_list[g] == "Tiny Tots" ||
//         groups_list[g] == "State Tiny Tots"
//       ) {
//         category_list = ["A", "B"];
//         levels_list = [
//           "pre",
//           "1",
//           "2",
//           "3",
//           "4",
//           "5",
//           "6",
//           "7",
//           "8",
//           "9",
//           "10"
//         ];
//       }

//       var cutoffmarks =
//         groups_list[g] == "State Mental Arithmetic" ||
//         groups_list[g] == "State Tiny Tots"
//           ? 22
//           : 28;
//       for (var l = 0; l < levels_list.length; l++) {
//         if (groups_list[g] == "Tiny Tots") console.log(levels_list[l]);
//         for (var c = 0; c < category_list.length; c++) {
//           if (groups_list[g] == "Tiny Tots") console.log(category_list[c]);
//           var rslt = getResult(
//             groups_list[g],
//             category_list[c],
//             levels_list[l],
//             students,
//             cutoffmarks
//           );
//           stringnow.result.push(rslt);
//         }
//       }

//       for (var c = 0; c < category_list.length; c++) {
//         var rslts = getChampions(
//           groups_list[g],
//           category_list[c],
//           students,
//           cutoffmarks
//         );
//         stringnow.champions.push(rslts);
//       }
//     }

//     generateMail(stringnow);
//     generateCenterResult(stringnow);
//     callbacks.success(stringnow);
//   });
// }

// makePPT = function(results) {
//   var pptx = new PptxGenJS();
//   for (var i = 0; i < results.length; i++) {
//     var slide = pptx.addNewSlide();
//     var str = 
//     slide.addText("16th NATIONAL LEVEL COMPETITION", {
//       x: 0.1,
//       y: 0.5,
//       w: "60%",
//       fontSize: 30,
//       color: "293462",
//       bold: true,
//       align: "center"
//     });
//     // slide.addText("CONGRATULATIONS", {
//     //   x: 8,
//     //   y: 0.5,
//     //   w: "100%",
//     //   fontSize: 20,
//     //   color: "293462",
//     //   bold: true,
//     //   align: "center"
//     // });
//     slide.addImage({
//       path: "public/img/logo.png",
//       x: 6.5,
//       y: 0.1,
//       w: '30%',
//       h: 0.8
//     });
//     slide.addText(results[i][1], {
//       x: 0.5,
//       y: 1.5,
//       w: "50%",
//       align: "center",
//       fontSize: 30,
//       color: "00818A"
//     });
//     slide.addText("OF", {
//       x: 0.5,
//       y: 2.2,
//       fontSize: 24,
//       w: "50%",
//       align: "center",
//       color: "216583"
//     });
//     slide.addText(results[i][7] + '   (' + results[i][9] + ')', {
//       x: 0.5,
//       y: 3,
//       fontSize: 30,
//       align: "center",
//       w: "50%",
//       color: "00818A"
//     });
//     slide.addText(results[i][0].toUpperCase(), {
//       x: 0.5,
//       y: 4,
//       fontSize: 32,
//       w: "50%",
//       align: "center",
//       bold: true,
//       color: "F7BE16"
//     });
//     slide.addImage({
//       path: results[i][6],
//       x: 6.5,
//       y: 1.3,
//       w: "30%",
//       h: "60%"
//     });
//   }
//   pptx.save("resultNew");
// };

// function generatePPT(username, callbacks) {
//   var downloadList = [];
//   var CsvReadableStream = require("csv-reader");
//   var inputStream = fs.createReadStream(
//     path.join(__dirname, "../..") + "/resultsNew.csv",
//     "utf8"
//   );
//   inputStream
//     .pipe(
//       CsvReadableStream({
//         parseNumbers: true,
//         parseBooleans: true,
//         trim: true
//       })
//     )
//     .on("data", function(row) {
//       console.log("A row arrived: ", row);
//       downloadList.push(row);
//     })
//     .on("end", function(data) {
//         makePPT(downloadList);
//         console.log("No more rows!");
//     });
// }

// function updateResult() {
//   StudentModel.find().exec("find", function(err, students) {
//     var students = students;
//     var CsvReadableStream = require("csv-reader");
//     var inputStream = fs.createReadStream(
//       path.join(__dirname, "../..") + "/resultsNew _copy.csv",
//       "utf8"
//     );
//     inputStream
//       .pipe(
//         CsvReadableStream({
//           parseNumbers: true,
//           parseBooleans: true,
//           trim: true
//         })
//       )
//       .on("data", function(row) {
//         console.log("A row arrived: ", row);
//         for (var i = 0; i < students.length; i++) {
//           for (var p = 0; p < students[i].programmes.length; p++) {
//             if(students[i].programmes[p].admissioncardno == row[10]) {
//               if(students[i].programmes[p].prizeone != '') students[i].programmes[p].prizetwo = row[0].toUpperCase();
//               else students[i].programmes[p].prizeone = row[0].toUpperCase();
//               students[i].status = 'RESULT';
//               students[i].save(function(err) {
//                 console.log("saved");
//               });
//             }
//           }
//         }
//       })
//       .on("end", function(data) {
//         console.log("No more rows!");
//       });
//   });
// }
// updateResult();

// module.exports.generateResult = generateResult;
// module.exports.generatePPT = generatePPT;
module.exports.createStudent = createStudent;
module.exports.readStudents = readStudents;
module.exports.readStudentById = readStudentById;
module.exports.readStudentByPhone = readStudentByPhone;
module.exports.updateStudent = updateStudent;
module.exports.deleteStudent = deleteStudent;
module.exports.downloadReceipt = downloadReceipt;
module.exports.generateHallTicket = generateHallTicket;
module.exports.downloadCopy = downloadCopy;
module.exports.karnataka = karnataka;
// module.exports.sendsms = sendsms;
// module.exports.readCsv = readCsv;
