angular.module('StudentApp.CardController', [])
    .controller('CardController', ['$scope', 'studentFactory', '$http', '$window', 'centerFactory', 'userFactory', 'fileReader', '$route', function ($scope, studentFactory, $http, $window, centerFactory, userFactory, fileReader, $route) {
        //Close card handler
        $scope.close_card = function () {
            $scope.$parent.editing = false;
            $scope.$parent.loading = false;
            $scope.msg = "";            
            $route.reload();
            $scope.myFile1 = undefined;
            $scope.myFile = undefined;
            $scope.imageSrc = undefined;
            $scope.imageSrc1 = undefined;
            $scope.file = null;
        };

        $scope.tshirtsizeoptions = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        $scope.ttlevels = ["pre", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        $scope.malevels = ["pre", "1", "2", "3", "4", "5", "6", "7", "8"];
        $scope.eslevels = ["1", "2", "3", "4", "5"];
        $scope.smlevels = ["1", "2", "3", "4", "5", "6"];
        $scope.hwlevels = ["1", "2", "3", "4"];

        function hasDuplicates(array) {
            return (new Set(array)).size !== array.length;
        }

        function hasValue(val, arrValues) {
            return arrValues.indexOf(val) > -1
        }

        //Save student button handler
        $scope.msg = "";
        $scope.count = 0;
        $scope.save_student = function () {
            $scope.msg = "";
            if ($scope.$parent.student.address == "" || $scope.$parent.student.dateofbirth == "" || $scope.$parent.student.email == "" ||
                $scope.$parent.student.gender == "" || $scope.$parent.student.name == "" || $scope.$parent.student.parentname == "" ||
                $scope.$parent.student.phone == "" || $scope.$parent.student.address == undefined || $scope.$parent.student.dateofbirth == undefined ||
                $scope.$parent.student.email == undefined || $scope.$parent.student.gender == undefined || $scope.$parent.student.name == undefined ||
                $scope.$parent.student.parentname == undefined || $scope.$parent.student.phone == undefined) {
                $scope.msg = "Invalid or Missing Student Basic Details. Please make sure you have filled all the details correctly";
            } else if ($scope.$parent.student.programmes.length <= 0) {
                $scope.msg = "No Programme selected. Please make sure you have filled all the details correctly";
            } else {
                var isError = false;
                var courseError = false;
                var selectedCourses = $scope.$parent.student.programmes.map(function (a) { return a.programmename; });
                if(hasDuplicates(selectedCourses)) { courseError = true; } 
                else {
                    if(hasValue('Mental Arithmetic',selectedCourses) && hasValue('Tiny Tots',selectedCourses)) { courseError = true; }
                    if(hasValue('Speed Maths',selectedCourses) && hasValue('Tiny Tots',selectedCourses)) { courseError = true; }
                    if(hasValue('State Mental Arithmetic',selectedCourses) && hasValue('State Tiny Tots',selectedCourses)) { courseError = true; }
                    if(hasValue('State Speed Maths',selectedCourses) && hasValue('State Tiny Tots',selectedCourses)) { courseError = true; }
                }
                for (var s = 0; s < $scope.$parent.student.programmes.length; s++) {
                    if ($scope.$parent.student.programmes[s].programmename == "" || $scope.$parent.student.programmes[s].programmename == undefined
                        || $scope.$parent.student.programmes[s].category == "" || $scope.$parent.student.programmes[s].category == undefined
                        || $scope.$parent.student.programmes[s].level == "" || $scope.$parent.student.programmes[s].level == undefined
                    ) { isError = true; }
                }
                if (courseError)
                    $scope.msg = "You have selected wrong course combinations. Please make sure you have selected right courses.";
                else if (isError)
                    $scope.msg = "Invalid or Missing Programme Details. Please make sure you have filled all the details correctly";
                else
                    $scope.uploadFile($scope.myFile);
            }
        };

        $scope.getFile = function (mod) {
            fileReader.readAsDataUrl($scope.file, $scope)
                .then(function (result) {
                    if (mod == 'myFile') {
                        $scope.imageSrc = result;
                        $scope.$parent.isPhoto = false;
                    }
                    else {
                        $scope.imageSrc1 = result;
                        $scope.$parent.isBirthcertificate = false;
                    }
                });
        };

        $scope.save = function () {
            $scope.count++;
            if ($scope.count == 1) {
                $scope.$parent.loading = true;
                $scope.$parent.student.centername = $scope.$parent.student.centername;
                if ($scope.$parent.isUnit) $scope.$parent.student.status = 'payment';
                else $scope.$parent.student.status = $scope.$parent.student.status;
                if ($scope.$parent.student._id === undefined) {
                    //Adding Student -> POST
                    studentFactory.save($scope.$parent.student, function (response) {
                        $scope.$parent.editing = false;
                        $scope.$parent.update_students();
                        $scope.myFile1 = undefined;
                        $scope.myFile = undefined;
                        $scope.imageSrc = undefined;
                        $scope.imageSrc1 = undefined;
                        $scope.file = null;                        
                        $route.reload();     
                    }, function (response) {
                        //error
                        console.error(response);
                    });

                } else {
                    //Editing Student -> PUT
                    studentFactory.update({ id: $scope.$parent.student._id }, $scope.$parent.student, function (response) {
                        $scope.$parent.editing = false;
                        $scope.count = 0;;
                        $scope.$parent.update_students();
                        $scope.myFile1 = undefined;
                        $scope.myFile = undefined;
                        $scope.imageSrc = undefined;
                        $scope.imageSrc1 = undefined;
                        $scope.file = null;                        
                        $route.reload();                        
                    }, function (response) {
                        //error
                        console.error(response);
                    });
                }
                $scope.count = 0;
                $scope.msg = "";            
            }
        }

        $scope.getCategoryValue = function (program) {
            if ($scope.$parent.student != undefined && $scope.$parent.student.dateofbirth != undefined) {
                var dt = $scope.$parent.student.dateofbirth;
                program.category = "";
                if (program.programmename == 'Tiny Tots' || program.programmename == 'State Tiny Tots') {
                    if (dt > new Date('10/01/2011')) program.category = 'A';
                    else program.category = 'B';
                } else if (program.programmename == 'Mental Arithmetic' || program.programmename == 'State Mental Arithmetic') {
                    if (dt > new Date('10/01/2010')) program.category = 'A';
                    else if (dt > new Date('10/01/2008')) program.category = 'B';
                    else if (dt > new Date('10/01/2006')) program.category = 'C';
                    else program.category = 'D';
                } else {
                    program.category = 'A';
                }
                return program.category;
            }
            return '';
        }

        $scope.getlevelsOptions = function (programmename) {
            if (programmename != undefined) {
                if (programmename == 'Tiny Tots' || programmename == 'State Tiny Tots')
                    return $scope.ttlevels;
                else if (programmename == 'Mental Arithmetic' || programmename == 'State Mental Arithmetic')
                    return $scope.malevels;
                else if (programmename == 'English Smart' || programmename == 'State English Smart')
                    return $scope.eslevels;
                else if (programmename == 'Speed Maths' || programmename == 'State Speed Maths')
                    return $scope.smlevels;
                else
                    return [];
            }
            return [];
        }

        $scope.uploadFile = function (myFile) {
            if ($scope.$parent.isPhoto) {
                $scope.uploadFile1($scope.myFile1);
            } else if (myFile == undefined || myFile.name == undefined) {
                $scope.uploadFile1($scope.myFile1);
            } else {
                var file = myFile;
                var uploadUrl = "/savedata";
                var fd = new FormData();
                $scope.student.photo = (myFile != undefined && myFile.name != undefined) ? myFile.name : "";
                fd.append('file', file);
                $http.post(uploadUrl, fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).success(function (response) {
                    $scope.uploadFile1($scope.myFile1);
                }).error(function (error) {
                    console.log(error);
                });
            }
        };

        $scope.uploadFile1 = function (myFile) {
            if ($scope.$parent.isBirthcertificate) {
                $scope.save();
            } else if (myFile == undefined || myFile.name == undefined) {
                $scope.save();
            } else {
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
            }
        };

        $scope.getFileExtension = function (fileName) {
            var ext = fileName.split('.').pop();
            if (ext == 'jpg' || ext == 'png' || ext == 'jpeg') return true;
            return false;
        }

        $scope.close_admincard = function () {
            $scope.$parent.adminediting = false;
        }

        getNumberOfStudents = function () {
            var count = 0;
            for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                if ($scope.$parent.student_list[s].category == $scope.$parent.student.category &&
                    $scope.$parent.student_list[s].level == $scope.$parent.student.level)
                    count++;
            }
            count = count.toString();
            if (count < 10) count = "00" + count;
            else if (count < 100) count = "0" + count;
            return count;
        }

        $scope.save_adminstudent = function () {
            $scope.msg = "";
            if ($scope.$parent.student.entrytime == "" || $scope.$parent.student.entrytime == undefined ||
                $scope.$parent.student.competitiontime == "" || $scope.$parent.student.competitiontime == undefined) {
                $scope.msg = "Invalid or Missing Data. Please make sure you have filled all the details correctly";
            } else {
                // $scope.$parent.student.examdate = "28-Oct-2018";
                // $scope.$parent.student.venue = "";
                // $scope.$parent.student.status = "closed";
                // $scope.$parent.student.admissioncardno = $scope.$parent.student.centercode + "/" + $scope.$parent.student.group + "/" +
                // $scope.$parent.student.category + "/" + ($scope.$parent.student.level == 'pre' ? "0" : $scope.$parent.student.level) + "/";
                // $scope.$parent.student.admissioncardno += getNumberOfStudents();
                studentFactory.update({ id: $scope.$parent.student._id }, $scope.$parent.student, function (response) {
                    $scope.$parent.adminediting = false;
                    $scope.$parent.update_students();
                }, function (response) {
                    //error
                    console.error(response);
                });
            }
        }

        $scope.swap_image = function () {
            var temp = $scope.$parent.student.photo;
            $scope.$parent.student.photo = $scope.$parent.student.birthcertificate;
            $scope.$parent.student.birthcertificate = temp;
        }

        $scope.deleteImage = function (type) {
            if (type == "photo") {
                $scope.$parent.student.photo = "";
                $scope.$parent.isPhoto = false;
            } else {
                $scope.$parent.student.birthcertificate = "";
                $scope.$parent.isBirthcertificate = false;
            }
        }

        $scope.center_error_message = "";
        $scope.save_center = function () {
            $scope.center = $scope.$parent.center;
            if ($scope.center.programmename == "" || $scope.center.programmename == undefined) {
                $scope.center_error_message = "Invalid Programme Name";
            } else if ($scope.center.centername == "" || $scope.center.centername == undefined) {
                $scope.center_error_message = "Invalid Center Name";
            } else if ($scope.center.centercode == "" || $scope.center.centercode == undefined) {
                $scope.center_error_message = "Invalid Center Code";
            } else if ($scope.center.sstatename == "" || $scope.center.sstatename == undefined) {
                $scope.center_error_message = "Invalid State Name";
            } else {
                if ($scope.center._id != undefined && $scope.center._id != "") {
                    centerFactory.update({ id: $scope.center._id }, $scope.center, function (response) {
                        $scope.$parent.closeCenterModal();
                        $scope.$parent.update_students();
                    }, function (response) {
                        $scope.$parent.update_students();
                    });
                } else {
                    centerFactory.save($scope.center, function (response) {
                        $scope.$parent.closeCenterModal();
                        $scope.$parent.update_students();
                    }, function (response) {
                        $scope.$parent.update_students();
                    });
                }
            }
        }

        $scope.user_error_message = "";
        $scope.save_user = function () {
            $scope.user = $scope.$parent.user;
            if ($scope.user.role == "" || $scope.user.role == undefined) {
                $scope.user_error_message = "Invalid Role";
            } else if ($scope.user.role == 'unit' && ($scope.user.center == "" || $scope.user.center == undefined)) {
                $scope.user_error_message = "Invalid Center Code";
            } else if ($scope.user.role != 'admin' && ($scope.user.sstate == "" || $scope.user.sstate == undefined)) {
                $scope.user_error_message = "Invalid State Name";
            } else if ($scope.user.username == "" || $scope.user.username == undefined) {
                $scope.user_error_message = "Invalid Phone Number";
            } else {
                if ($scope.user._id != undefined && $scope.user._id != "") {
                    userFactory.update({ id: $scope.user._id }, $scope.user, function (response) {
                        $scope.$parent.closeUserModal();
                        $scope.$parent.update_students();
                    }, function (response) {
                        $scope.$parent.update_students();
                    });
                } else {
                    userFactory.save($scope.user, function (response) {
                        $scope.$parent.closeUserModal();
                        $scope.$parent.update_students();
                    }, function (response) {
                        $scope.$parent.update_students();
                    });
                }
            }
        }

        $scope.closeUserModal = function () {
            $scope.$parent.closeUserModal();
        }

        $scope.closeCenterModal = function () {
            $scope.$parent.closeCenterModal();
        }

        $scope.delete_programme = function (program) {
            for (var i = 0; i < $scope.$parent.student.programmes.length; i++) {
                if ($scope.$parent.student.programmes[i]._id == program._id)
                    $scope.$parent.student.programmes.splice(i, 1);
            }
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

        $scope.getProgrammeOptions = function () {
            $scope.programmeoptions = [];
            var opt = $scope.$parent.center_list.filter(function (item) {
                return (item.sstatename == $scope.$parent.student.sstatename &&
                    item.centername == $scope.$parent.student.centername);
            }, []);
            return (getUniqueValuesOfKey(opt, 'programmename'));
        }

        $scope.add_programme = function () {
            $scope.$parent.student.programmes.push({
                programmename: '',
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

    }]);
