angular.module('StudentApp.LoginController', [])

    .controller('LoginController', ['$scope', 'userFactory', '$rootScope', 'studentFactory', 'centerFactory', 'fileUpload', '$http', 'fileReader', function ($scope, userFactory, $rootScope, studentFactory, centerFactory, fileUpload, $http, fileReader) {
        //Login form listener
        var working = false;
        $scope.otpSent = false;
        $scope.msg = '';

        var isReportingHO = function (centercode, center_list) {
            for (var c = 0; c < center_list.length; c++) {
                if (center_list[c].centercode == centercode)
                    return center_list[c].is_direct;
            }
            return false;
        }

        $scope.send = function (username, password) {
            $("#login img").hide();
            if (working) return;
            working = true;
            var $this = $('#login'),
                $state = $this.find('button > .state');
            $this.addClass('loading');
            $state.html('Authenticating');

            userFactory.login({
                username: username,
                password: password
            }, function (response) {
                console.log(response);
                setTimeout(function () {
                    $this.addClass('ok');
                    $state.html('Welcome!');
                    $(".fa.fa-sign-out").show();
                    setCookie("username", username, 1);
                    setCookie("password", password, 1);
                    setCookie("role", response.role, 1);
                    setCookie("center", response.center, 1);
                    setCookie("sstate", response.sstate, 1);
                    $scope.$parent.isStudent = (response.role == 'student') ? true : false;
                    $scope.$parent.isUnit = (response.role == 'unit') ? true : false;
                    $scope.$parent.isMaster = (response.role == 'master') ? true : false;
                    $scope.$parent.isAdmin = (response.role == 'admin') ? true : false;
                    if ($scope.$parent.isUnit) {
                        $scope.$parent.center = response.center;
                        for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                            if ($scope.$parent.student_list[s].centercode != $scope.$parent.center) {
                                $scope.$parent.student_list.splice(s, 1);
                                s--;
                            }
                        }
                    }
                    if ($scope.$parent.isMaster) {
                        centerFactory.query().$promise.then(function (response) {
                            $scope.$parent.sstate = getCookie('sstate');
                            for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                                if ($scope.$parent.student_list[s].sstatename != $scope.$parent.sstate || isReportingHO($scope.$parent.student_list[s].centercode, response)) {
                                    $scope.$parent.student_list.splice(s, 1);
                                    s--;
                                }
                            }
                        }, function (response) {
                            //error
                            console.error(response);
                        });
                    }
                    setTimeout(function () {
                        $state.html('Log in');
                        $this.removeClass('ok loading');
                        working = false;
                        $scope.$parent.loggedIn = true;
                        $scope.showOTPForm = false;
                        $scope.$parent.update_students();
                        $rootScope.$broadcast('loggedin');
                        $scope.$apply();
                        //load everything
                    }, 1000);
                }, 1500);

            }, function (response) {
                //error
                console.error(response);
                $scope.$parent.loggedIn = false;
                $this.addClass('ko');
                $state.html('Invalid OTP!');
                var i = setTimeout(function () {
                    $state.html('Log in');
                    $("#login img").show();
                    $this.removeClass('ko loading');
                    $this.removeClass('ok loading');
                    working = false;
                    clearInterval(i);
                }, 1500);
            });
        };

        $scope.generateOTP = function (username) {
            $scope.msg = "";
            var isPhoneExist = false;
            var isCenterAdmin = false;

            for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                if ($scope.$parent.student_list[s].phone == username)
                    isPhoneExist = true;
            }

            for (var u = 0; u < $scope.$parent.user_list.length; u++) {
                if ($scope.$parent.user_list[u].username == username && $scope.$parent.user_list[u].role != 'student')
                    isCenterAdmin = true;
            }

            if (isPhoneExist || isCenterAdmin) {
                userFactory.generateOTP({
                    username: username
                }, function (response) {
                    console.log(response);
                    $scope.otpSent = true;
                    $scope.match = {
                        password: response.password,
                        username: response.username
                    };
                    $("#password").focus();
                }, function (response) {
                    $scope.otpSent = false;
                    $scope.msg = response.data.msg;
                });
            } else {
                $scope.msg = "Phone Number is not registered!";
            }
        }

        $scope.getStudentStatus = function () {
            var username = getCookie('username');
            if (username != undefined && $scope.$parent.student_list != undefined) {
                for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                    if ($scope.$parent.student_list[s].phone == username) {
                        $scope.studentStatus = $scope.$parent.student_list[s];
                        $scope.showStudentStatus = true;
                        $scope.loading = false;
                    }
                };
            }
        }

        $scope.tryDifferentNumber = function () {
            $scope.otpSent = false;
        }

        $scope.registrationForm = false;
        $scope.register = function () {
            $scope.registrationForm = true;
        }

        $scope.showOTPForm = false;
        $scope.checkStatus = function () {
            $scope.showOTPForm = true;
        }

        $scope.contactUs = false;
        $scope.contact_us = function () {
            $scope.contactUs = true;
        }
        $scope.close_contact_us = function () {
            $scope.contactUs = false;
        }

        function getUniqueValuesOfKey(array, key) {
            if (array != undefined) {
                return array.reduce(function (carry, item) {
                    if (item[key] && !~carry.indexOf(item[key])) carry.push(item[key]);
                    return carry;
                }, []);
            } else {
                return [];
            }
        }

        $scope.dataSaved = false;
        $scope.tshirtsizeoptions = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        $scope.ttlevels = ["pre", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        $scope.malevels = ["pre", "1", "2", "3", "4", "5", "6", "7", "8"];
        $scope.eslevels = ["1", "2", "3", "4", "5"];
        $scope.smlevels = ["1", "2", "3", "4", "5", "6"];

        $scope.dayOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
        $scope.monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        $scope.yearOptions = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];

        $scope.dob = {
            day: '',
            month: '',
            year: ''
        };

        centerFactory.query().$promise.then(function (response) {
            $scope.$parent.center_list = response;
            $scope.sstateoptions = getUniqueValuesOfKey($scope.$parent.center_list, 'sstatename');
        }, function (response) {
            //error
            console.error(response);
        });
        $scope.centeroptions = [];
        $scope.programmeoptions = [];

        $scope.onStateChange = function () {
            $scope.centeroptions = [];
            $scope.programmeoptions = [];
            $scope.student.centercode = "";
            var opt = $scope.$parent.center_list.filter(function (item) {
                return (item.sstatename == $scope.student.sstatename);
            }, []);
            $scope.centeroptions = getUniqueValuesOfKey(opt, 'centername');
            $scope.student.programmeName = [];
        }

        $scope.onCenterChange = function () {
            $scope.programmeoptions = [];
            $scope.student.centercode = "";
            var opt = $scope.$parent.center_list.filter(function (item) {
                return (item.sstatename == $scope.student.sstatename &&
                    item.centername == $scope.student.centername);
            }, []);
            $scope.student.centercode = opt[0].centercode;
            $scope.programmeoptions = getUniqueValuesOfKey(opt, 'programmename');
            $scope.student.programmeName = [];
        }

        $scope.termsAccepted = false;
        $scope.onTCChange = function () {
            $scope.termsAccepted = !$scope.termsAccepted;
        }

        //Save student button handler
        $scope.msg = "";
        $scope.save_student = function () {
            // if ($('#datepicker')[0].type != 'date') {
            //     var parts = $('#datepicker')[0].value.split('/');
            //     var mydate = new Date(parts[2], parts[1] - 1, parts[0]);
            $scope.student.dateofbirth = new Date($scope.dob.year, $scope.dob.month-1, $scope.dob.day, 0, 0, 0, 0);
            console.log($scope.student.dateofbirth);
            // }
            $scope.msg = "";
            if ($scope.student.address == "" || $scope.student.address == undefined) {
                $scope.msg = "Invalid or Missing Address. Please make sure you have entered correct Address";
            }
            else if ($scope.student.dateofbirth == "" || $scope.student.dateofbirth == undefined || Object.prototype.toString.call($scope.student.dateofbirth) != "[object Date]") {
                $scope.msg = "Invalid or Missing Date Of Birth. Please make sure you have entered correct Date Of Birth";
            }
            else if ($scope.student.email == "" || $scope.student.email == undefined) {
                $scope.msg = "Invalid or Missing Email Id. Please make sure you have entered correct Email Id";
            }
            else if ($scope.student.gender == "" || $scope.student.gender == undefined) {
                $scope.msg = "Invalid or Missing Gender. Please make sure you have selected a Gender";
            }
            else if ($scope.student.name == "" || $scope.student.name == undefined) {
                $scope.msg = "Invalid or Missing Student Number. Please make sure you have entered correct Student Number";
            }
            else if ($scope.student.parentname == "" || $scope.student.parentname == undefined) {
                $scope.msg = "Invalid or Missing Parent Name. Please make sure you have entered correct Parent Name";
            }
            else if ($scope.student.phone == "" || $scope.student.phone == undefined) {
                $scope.msg = "Invalid or Missing Phone Number. Please make sure you have entered correct Phone Number";
            }
            else if ($scope.student.tshirtsize == "" || $scope.student.tshirtsize == undefined){
                $scope.msg = "Invalid or Missing T Shirt Size. Please make sure you have selected correct T Shirt Size";
            }
            else if ($scope.student.programmeName.length <= 0) {
                $scope.msg = "Please select atleast One Programme";
            } else if (!$scope.termsAccepted) {
                $scope.msg = "Please refer to our terms and conditions document and agree to it!";
            } else {
                $scope.count++;
                if ($scope.count == 1) {
                    $scope.uploadFile($scope.myFile);
                }
            }
        };

        $scope.calculateAge = function () {
            var now = new Date();
            var today = new Date(now.getYear(), now.getMonth(), now.getDate());
            var yearNow = now.getYear();
            var monthNow = now.getMonth();
            var dateNow = now.getDate();
            var dob = new Date($scope.$parent.student.dateofbirth);
            var yearDob = dob.getYear();
            var monthDob = dob.getMonth();
            var dateDob = dob.getDate();
            var age = {};
            yearAge = yearNow - yearDob;

            var monthAge = monthNow - monthDob;
            if (monthNow < monthDob) {
                yearAge--;
                monthAge += 12;
            }

            var dateAge = dateNow - dateDob;
            if (dateNow < dateDob) {
                monthAge--;
                dateAge += 31;
                if (monthAge < 0) {
                    monthAge = 11;
                    yearAge--;
                }
            }

            age = {
                years: yearAge,
                months: monthAge,
                days: dateAge
            };

            return age;
        }

        $scope.onGroupChange = function (group, program) {
            var age = $scope.calculateAge();
            if (program == 'Center') {
                if (group == 'TT') {
                    if (age.years >= 5 && age.years < 7) $scope.$parent.student.category = 'A';
                    else if (age.years >= 7) $scope.$parent.student.category = 'B';
                    else $scope.$parent.student.category = '';
                } else {
                    if (age.years >= 7 && age.years < 9) $scope.$parent.student.category = 'A';
                    else if (age.years >= 9 && age.years < 11) $scope.$parent.student.category = 'B';
                    else if (age.years >= 11 && age.years < 13) $scope.$parent.student.category = 'C';
                    else if (age.years >= 13) $scope.$parent.student.category = 'D';
                    else $scope.$parent.student.category = '';
                }
            } else {
                if (group == 'TTS') {
                    if (age.years >= 5 && age.years < 7) $scope.$parent.student.category = 'A1';
                    else if (age.years >= 7) $scope.$parent.student.category = 'B1';
                    else $scope.$parent.student.category = '';
                } else {
                    if (age.years >= 8 && age.years < 10) $scope.$parent.student.category = 'A1';
                    else if (age.years >= 10) $scope.$parent.student.category = 'B1';
                    else $scope.$parent.student.category = '';
                }
            }
        }

        $scope.student = {
            phone: "",
            email: "",
            name: "",
            dateofbirth: undefined,
            gender: "Male",
            parentname: "",
            address: "",
            tshirtsize: "",
            photo: "",
            birthcertificate: "",
            dateCreated: new Date(),
            programmes: [],
            centername: "",
            centercode: "",
            sstatename: "",
            status: 'open',
            paymentdate: "",
            transactionno: "",
            paymentmode: "",
            bankname: "",
            paymentapproved: false,
            mfapproved: false,
            programmeName: []
        }

        $scope.addProgram = function (pro) {
            $scope.student.programmes.push({
                programmename: pro,
                admissioncardno: "",
                group: "",
                category: "",
                level: "",
                feesdetails: [],
                lastyearlevel: {},
                examdate: undefined,
                entrytime: "",
                competitiontime: "",
                venue: ""
            });
        }

        var reverseToggleSelections = function (fruitName) {
            var idx = $scope.student.programmeName.indexOf(fruitName);
            if (idx > -1) $scope.student.programmeName.splice(idx, 1);
        };

        $scope.toggleSelection = function (fruitName) {
            var idx = $scope.student.programmeName.indexOf(fruitName);
            if (idx > -1) $scope.student.programmeName.splice(idx, 1);
            else $scope.student.programmeName.push(fruitName);

            if (fruitName == 'Mental Arithmetic') {
                reverseToggleSelections('Tiny Tots');
                // reverseToggleSelections('Speed Maths');
            }
            if (fruitName == 'Tiny Tots') {
                reverseToggleSelections('Mental Arithmetic');
                reverseToggleSelections('Speed Maths');
            }

            if (fruitName == 'Speed Maths') {
                reverseToggleSelections('Tiny Tots');
                // reverseToggleSelections('Mental Arithmetic');
            }

            if (fruitName == 'State Mental Arithmetic') {
                reverseToggleSelections('State Tiny Tots');
                // reverseToggleSelections('State Speed Maths');
            }
            if (fruitName == 'State Tiny Tots') {
                reverseToggleSelections('State Mental Arithmetic');
                reverseToggleSelections('State Speed Maths');
            }

            if (fruitName == 'State Speed Maths') {
                reverseToggleSelections('State Tiny Tots');
                // reverseToggleSelections('State Mental Arithmetic');
            }
        };

        $scope.isPhoneDuplicate = false;
        $scope.count = 0;
        $scope.phoneOtpVerification = false;
        $scope.onPhoneChange = function (phone) {
            $scope.isPhoneDuplicate = false;
            for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                if ($scope.$parent.student_list[s].phone == $scope.student.phone)
                    $scope.isPhoneDuplicate = true;
            }
            if (!$scope.isPhoneDuplicate && phone > 1000000000 && phone <= 9999999999) {
                $scope.phoneOtpVerification = true;
                userFactory.generateOTP({
                    username: phone
                }, function (response) {
                    $scope.otpSent = true;
                    $scope.match = {
                        password: response.password,
                        username: response.username
                    };
                    $("#password").focus();
                }, function (response) {
                    $scope.phoneOtpVerification = false;
                    $scope.otpSent = false;
                });
            }
        }

        $scope.changePhoneNumber = function () {
            $scope.phoneOtpVerification = false;
        }

        $scope.isOTPVerified = false;
        $scope.oTPmessage = "We have send you a OTP on the number you entered just now. Please verify to continue!";
        $scope.onPwdChange = function (otp) {
            $scope.isOTPVerified = ($scope.match.username == $scope.student.phone && $scope.match.password == otp) ? true : false;
            if ($scope.isOTPVerified) $scope.phoneOtpVerification = false;
            else $scope.oTPmessage = "OTP does not match!!! Please try again!";
        }

        $scope.uploadFile = function (myFile) {
            if (myFile != undefined && myFile.name != undefined) {
                var file = myFile;
                var uploadUrl = "/savedata";
                var fd = new FormData();
                fd.append('file', file);
                $scope.student.photo = (myFile != undefined && myFile.name != undefined) ? myFile.name : "";
                $http.post(uploadUrl, fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).success(function (response) {
                    $scope.uploadFile1($scope.myFile1);
                }).error(function (error) {
                    console.log(error);
                });
            } else {
                $scope.uploadFile1($scope.myFile1);
            }
        };

        $scope.uploadFile1 = function (myFile) {
            if (myFile != undefined && myFile.name != undefined) {
                var file = myFile;
                var uploadUrl = "/savedata";
                var fd = new FormData();
                fd.append('file', file);
                $scope.student.birthcertificate = (myFile != undefined && myFile.name != undefined) ? myFile.name : "";
                $http.post(uploadUrl, fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).success(function (response) {
                    $scope.save();
                }).error(function (error) {
                    console.log(error);
                });
            } else {
                $scope.save();
            }
        };

        $scope.save = function () {
            $scope.$parent.loading = true;
            for (var i = 0; i < $scope.student.programmeName.length; i++) {
                $scope.addProgram($scope.student.programmeName[i]);
            }
            if ($scope.student._id === undefined) {
                //Adding Student -> POST
                studentFactory.save($scope.student, function (response) {
                    console.log(response);
                    $scope.editing = false;
                    $scope.dataSaved = true;
                    $scope.savingSuccess = true;
                    $scope.savingFailed = false;
                    $scope.update_students();
                }, function (response) {
                    //error
                    console.log(response);
                    $scope.$parent.editing = false;
                    $scope.savingFailed = true;
                    $scope.dataSaved = false;
                    $scope.savingSuccess = false;
                    // $scope.$parent.update_students();
                });

            } else {
                //Editing Student -> PUT
                studentFactory.update({ id: $scope.$parent.student._id }, $scope.$parent.student, function (response) {
                    console.log(response);
                    $scope.$parent.editing = false;
                    $scope.$parent.update_students();
                }, function (response) {
                    //error
                    console.log(response);
                    $scope.$parent.editing = false;
                    $scope.$parent.update_students();
                });
            }
        }

        $scope.getFile = function (mod) {
            fileReader.readAsDataUrl($scope.file, $scope)
                .then(function (result) {
                    if (mod == 'myFile') $scope.imageSrc = result;
                    else $scope.imageSrc1 = result;
                });
        };

        $scope.downloadFormCopy = function () {
            var fileurl = "/api/0.1/student/downloadCopy/" + $scope.student.phone;
            window.open(fileurl, '_self', '');
        }

        $scope.$parent.file = "./terms_conditions.pdf";
        $scope.$parent.center_file = "http://alohakarnataka.com/center_terms_conditions.pdf";

    }])

    .directive('ngConfirmClick', [
        function () {
            return {
                link: function (scope, element, attr) {
                    var msg = attr.ngConfirmClick || "Are you sure?";
                    var clickAction = attr.confirmedClick;
                    element.bind('click', function (event) {
                        if (window.confirm(msg)) {
                            scope.$eval(clickAction)
                        }
                    });
                }
            };
        }])
