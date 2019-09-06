var express = require('express'),
    domain = require('domain'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    i18n = require("i18next"),
    http = require('http'),
    multer = require('multer')
    bodyParser = require('body-parser')
    busboy = require('connect-busboy')
    busboyBodyParser = require('busboy-body-parser')
    AWS = require('aws-sdk')
    Busboy = require('busboy')
    routes = require('./routes/index')
    userAPI = require('./routes/api/0.1/userAPI')
    studentAPI = require('./routes/api/0.1/studentAPI')
    centerAPI = require('./routes/api/0.1/centerAPI');

const BUCKET_NAME = 'alohanlc2019';
const IAM_USER_KEY = 'AKIAJ5YI3ULII2UU4HWA';
const IAM_USER_SECRET1 = 'V717KGCwHmm';
const IAM_USER_SECRET2 = 'AZ2FzCAaMV3DAJ';
const IAM_USER_SECRET3 = 'OSskeDj1nw9XI5h';

var storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, file.originalname.replace(path.extname(file.originalname), "") + '-' + Date.now() + path.extname(file.originalname))
    }
})

var upload = multer({ storage: storage })

var dom = domain.create(),
    app = express();

//i18n init
i18n.init({ lng: 'en-US' }, function (err, t) {
    if (err)
        console.log(err);
});
i18n.setLng('en-US', function (err, t) {
    if (err)
        console.log(err);
});
app.use(i18n.handle);
app.use(busboy());
i18n.registerAppHelper(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(busboyBodyParser());

app.use('/', routes);
app.use('/api/0.1/user', userAPI);
app.use('/api/0.1/student', studentAPI);
app.use('/api/0.1/center', centerAPI);

// error handlers
app.use(function (error, req, res, next) {
    if (domain.active) {
        console.info('caught with domain ', domain.active);
        domain.active.emit('error', error);
    } else {
        //DEFAULT ERROR HANDLERS
        // catch 404 and forward to error handler
        app.use(function (req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // development error handler
        // will print stacktrace
        if (app.get('env') === 'development') {
            app.use(function (err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
    }
});

// function uploadToS3(file) {
//     console.log("Uploading File to S3");
//     let s3bucket = new AWS.S3({
//         accessKeyId: IAM_USER_KEY,
//         secretAccessKey: IAM_USER_SECRET1+IAM_USER_SECRET2+IAM_USER_SECRET3,
//         Bucket: BUCKET_NAME
//     });
//     console.log(s3bucket);
//     s3bucket.createBucket(function () {
//         var params = {
//             Bucket: BUCKET_NAME,
//             Key: file.name,
//             Body: file.data
//         };
//         s3bucket.upload(params, function (err, data) {
//             if (err) {
//                 console.log('error in callback');
//                 console.log(err);
//             }
//             console.log('success');
//         });
//     });
// }

// app.post('/savedata', upload.single('file'), function (req, res, next) {
//     uploadToS3(req.files.file);
//     console.log('Uploade Successful ', req.file, req.body);
//     res.send(req.file);
// });

app.post('/savedata/:phone', upload.single('file'), function (req, res, next) {
    var file = req.files.file;
    console.log(req.params);
    console.log("Uploading File to S3");
    let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET1+IAM_USER_SECRET2+IAM_USER_SECRET3,
        Bucket: BUCKET_NAME
    });
    // console.log(s3bucket);
    s3bucket.createBucket(function () {
        var params = {
            Bucket: (BUCKET_NAME + "/" + req.params.phone),
            Key: file.name,
            Body: file.data
        };
        console.log(params.Bucket);
        s3bucket.upload(params, function (err, data) {
            if (err) {
                console.log('error in callback');
                console.log(err);
            }
            console.log(data);
            console.log('success');
            res.send(data.Location);
        });
    });
});

module.exports = app;
