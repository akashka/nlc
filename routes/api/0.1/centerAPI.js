var express = require('express'),
    router = express.Router(),
    domain = require('domain'),
    centerDAO = require('./../../../model/DAO/centerDAO'),
    path = require('path'),
    fs = require('fs'),
    conversion = require("phantom-html-to-pdf")();

//CREATE a new center
router.post('/', function (req, res) {
    var d = domain.create();

    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        centerDAO.createCenter({
            phone: req.body.phone,
            email: req.body.email,
            sstatename: req.body.sstatename,
            centername: req.body.centername,
            centercode: req.body.centercode,
            programmename: req.body.programmename
        }, {
                success: function (f) {
                    res.status(201).send({ msg: 'Center created succesfully: ' + req.body.centercode, data: f });
                },
                error: function (err) {
                    res.status(500).send(err);
                }
            });
    });
});

//READ all center
router.get('/', function (req, res, next) {
    var d = domain.create();
    var skip = req.query.skip;
    var count = req.query.count;

    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        centerDAO.readCenters(skip, count, {
            success: function (centers) {
                res.status(200).send(JSON.stringify(centers));
            },
            error: function (err) {
                res.status(500).send(err);
            }
        });
    });
});

//READ center by id
router.get('/:id', function (req, res) {
    var d = domain.create();
    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });

    });

    d.run(function () {
        centerDAO.readCenterById(req.params.id, {
            success: function (center) {
                res.status(200).send(JSON.stringify(center));
            },
            error: function (err) {
                res.status(404).send(err);
            }
        });
    });
});

//UPDATE center
router.put('/:id', function (req, res) {
    var d = domain.create();
    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        centerDAO.updateCenter(req.params.id, {
            phone: req.body.phone,
            email: req.body.email,
            sstatename: req.body.sstatename,
            centername: req.body.centername,
            centercode: req.body.centercode,
            programmename: req.body.programmename
        }, {
                success: function (f) {
                    res.status(200).send({ msg: 'Center updated succesfully: ' + JSON.stringify(f), data: f });
                },
                error: function (err) {
                    res.status(500).send(err);
                }
            });
    });
});

//DELETE center
router.delete('/:id', function (req, res) {
    var d = domain.create();
    d.on('error', function (error) {
        console.log(error.stacktrace);
        res.status(500).send({ 'error': error.message });
    });

    d.run(function () {
        centerDAO.deleteCenter(req.params.id, {
            success: function (f) {
                res.status(200).send({ msg: 'Center deleted succesfully: ' + req.params.centercode, data: f });
            },
            error: function (err) {
                res.status(500).send(err);
            }
        });
    });
});

module.exports = router;
