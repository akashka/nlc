var express = require('express'),
    router = express.Router(),
    domain = require('domain'),
    studentDAO = require('./../../../model/DAO/studentDAO'),
    path = require('path'),
    fs = require('fs'),
    conversion = require("phantom-html-to-pdf")();
var htmlToPdf = require('html-to-pdf');

// router.get('/readCsv', function (req, res) {
//     var d = domain.create();
//     d.run(function () {
//         studentDAO.readCsv({username: 'abc'}, {
//             success: function () { },
//             error: function () { }
//         });
//     });
// })

// router.get('/generateResult', function (req, res) {
//     var d = domain.create();
//     d.run(function () {
//         studentDAO.readCsv({username: 'abc'}, {
//             success: function () { },
//             error: function () { }
//         });
//     });
// })

//CREATE a new student
router.post('/', function (req, res) {
    var d = domain.create();

    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        studentDAO.createStudent({
            phone: req.body.phone,
            email: req.body.email,
            name: req.body.name,
            gender: req.body.gender,
            dateofbirth: req.body.dateofbirth,
            parentname: req.body.parentname,
            address: req.body.address,
            tshirtsize: req.body.tshirtsize,
            photo: req.body.photo,
            birthcertificate: req.body.birthcertificate,
            centername: req.body.centername,
            centercode: req.body.centercode,
            sstatename: req.body.sstatename,
            status: req.body.status,
            paymentdate: req.body.paymentdate,
            transactionno: req.body.transactionno,
            paymentmode: req.body.paymentmode,
            bankname: req.body.bankname,
            paymentapproved: req.body.paymentapproved,
            programmes: req.body.programmes,
            mfapproved: req.body.mfapproved,
            dateCreated: req.body.dateCreated,
            dateModified: req.body.dateModified
        }, {
                success: function (f) {
                    res.status(201).send({ msg: 'Student created succesfully: ' + req.body.name, data: f });
                },
                error: function (err) {
                    res.status(500).send(err);
                }
            });
    });
});

//READ all students
router.get('/', function (req, res, next) {
    var d = domain.create();
    var skip = req.query.skip;
    var count = req.query.count;

    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        studentDAO.readStudents(skip, count, {
            success: function (students) {
                res.status(200).send(JSON.stringify(students));
            },
            error: function (err) {
                res.status(500).send(err);
            }
        });
    });
});

//READ student by id
router.get('/:id', function (req, res) {
    var d = domain.create();
    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });

    });

    d.run(function () {
        studentDAO.readStudentById(req.params.id, {
            success: function (student) {
                res.status(200).send(JSON.stringify(student));
            },
            error: function (err) {
                res.status(404).send(err);
            }
        });
    });
});

//UPDATE student
router.put('/:id', function (req, res) {
    var d = domain.create();
    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        studentDAO.updateStudent(req.params.id, {
            phone: req.body.phone,
            email: req.body.email,
            name: req.body.name,
            gender: req.body.gender,
            dateofbirth: req.body.dateofbirth,
            parentname: req.body.parentname,
            address: req.body.address,
            tshirtsize: req.body.tshirtsize,
            photo: req.body.photo,
            birthcertificate: req.body.birthcertificate,
            centername: req.body.centername,
            centercode: req.body.centercode,
            sstatename: req.body.sstatename,
            status: req.body.status,
            programmes: req.body.programmes,
            paymentdate: req.body.paymentdate,
            transactionno: req.body.transactionno,
            paymentmode: req.body.paymentmode,
            paymentapproved: req.body.paymentapproved,
            bankname: req.body.bankname,
            mfapproved: req.body.mfapproved,
            dateCreated: req.body.dateCreated,
            dateModified: req.body.dateModified,
            paymentapproved: req.body.paymentapproved
        }, {
                success: function (f) {
                    res.status(200).send({ msg: 'Student updated succesfully: ' + JSON.stringify(f), data: f });
                },
                error: function (err) {
                    res.status(500).send(err);
                }
            });
    });
});

//DELETE student
router.delete('/:id', function (req, res) {
    var d = domain.create();
    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        studentDAO.deleteStudent(req.params.id, {
            success: function (f) {
                res.status(200).send({ msg: 'Student deleted succesfully: ' + req.params.id, data: f });
            },
            error: function (err) {
                res.status(500).send(err);
            }
        });
    });
});

// Download Fee Receipt
router.get('/download/:username', function (req, res) {
    var d = domain.create();
    d.run(function () {
        studentDAO.downloadReceipt({
            username: req.params.username,
        }, {
                success: function (pdf) {
                    var output = fs.createWriteStream('./output.pdf');
                    pdf.stream.pipe(output);
                    let filename = "invoice";
                    filename = encodeURIComponent(filename) + '.pdf';
                    var file = fs.readFileSync('./output.pdf');
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
                    pdf.stream.pipe(res);
                },
                error: function (err) {
                    res.status(403).send(err);
                }
            });
    });
})

// Generate Hall Ticket
router.get('/generateHallTicket/:username/:program', function (req, res) {
    var d = domain.create();
    d.run(function () {
        studentDAO.generateHallTicket({
            username: req.params.username,
            program: req.params.program,
        }, {
                success: function (pdf) {
                    var output = fs.createWriteStream('./hallticket.pdf');
                    pdf.stream.pipe(output);
                    let filename = "hallticket";
                    filename = encodeURIComponent(filename) + '.pdf';
                    var file = fs.readFileSync('./hallticket.pdf');
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
                    pdf.stream.pipe(res);
                },
                error: function (err) {
                    res.status(403).send(err);
                }
            });
    });
})

// Generate Copy
router.get('/downloadCopy/:username', function (req, res) {
    var d = domain.create();
    d.run(function () {
        studentDAO.downloadCopy({
            username: req.params.username,
        }, {
                success: function (pdf) {
                    var output = fs.createWriteStream('./form_copy.pdf');
                    pdf.stream.pipe(output);
                    let filename = "form_copy";
                    filename = encodeURIComponent(filename) + '.pdf';
                    var file = fs.readFileSync('./form_copy.pdf');
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
                    pdf.stream.pipe(res);
                },
                error: function (err) {
                    res.status(403).send(err);
                }
            });
    });
})

module.exports = router;
