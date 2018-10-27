angular.module('StudentApp.TableController', [])
    .controller('TableController', ['$scope', 'studentFactory', 'userFactory', 'centerFactory', function ($scope, studentFactory, userFactory, centerFactory) {
        //Update students
        $scope.$parent.update_students = function () {
            $scope.$parent.loading = true;
            //Load students

            $scope.$parent.center_terms_agreed = false;
            $scope.$parent.reverse_center_terms_agreed = function () {
                $scope.$parent.center_terms_agreed = true;
            }

            userFactory.query().$promise.then(function (response) {
                $scope.$parent.user_list = response;
            }, function (response) {
                //error
                console.error(response);
            });

            centerFactory.query().$promise.then(function (response) {
                $scope.$parent.center_list = response;
            }, function (response) {
                //error
                console.error(response);
            });

            studentFactory.query().$promise.then(function (response) {
                //$('tbody').html('');
                $scope.$parent.student_list = response;
                $scope.$parent.loading = false;

                if ($scope.$parent.isUnit) {
                    $scope.$parent.center = getCookie('center');
                    for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                        if ($scope.$parent.student_list[s].centercode != $scope.$parent.center) {
                            $scope.$parent.student_list.splice(s, 1);
                            s--;
                        }
                    }
                }

                if ($scope.$parent.isMaster) {
                    $scope.$parent.sstate = getCookie('sstate');
                    for (var s = 0; s < $scope.$parent.student_list.length; s++) {
                        if ($scope.$parent.student_list[s].sstatename != $scope.$parent.sstate) {
                            $scope.$parent.student_list.splice(s, 1);
                            s--;
                        }
                    }
                }

            }, function (response) {
                //error
                console.error(response);
            });

            $scope.studentClick = function (status, id, mfapproved) {
                if ((status == "admin" || status == "hallticket" || status == "closed" || $scope.selectMultiple == true) && $scope.isUnit) { }
                else if ($scope.isMaster && (status != "admin" || mfapproved)) { }
                else {
                    $scope.$parent.loading = true;
                    $scope.$parent.editing = true;
                    studentFactory.get({ id: id }, function (response) {
                        console.log(response);
                        $scope.$parent.student = response;
                        $scope.$parent.student.dateofbirth = new Date($scope.$parent.student.dateofbirth);
                        $scope.$parent.loading = false;
                        $scope.$parent.isPhoto = ($scope.$parent.student.photo == "" || $scope.$parent.student.photo == undefined) ? false : true;
                        $scope.$parent.isBirthcertificate = ($scope.$parent.student.birthcertificate == "" || $scope.$parent.student.birthcertificate == undefined) ? false : true;
                        //Floating label layout fix
                        $('.mdl-textfield').addClass('is-focused');
                    }, function (response) {
                        //error
                        console.error(response);
                    });
                }
            };

            $scope.$parent.total_amount = 0;
            $scope.$parent.selected = [];

            $scope.selectedOneMultiple = function (f) {
                var isFound = false;
                for (var s = 0; s < $scope.$parent.selected.length; s++) {
                    if ($scope.$parent.selected[s]._id == f._id) {
                        isFound = true;
                        $scope.$parent.selected.splice(s, 1);
                        s--;
                    }
                }
                if (!isFound) $scope.$parent.selected.push(f);
                $scope.$parent.total_amount = 0;
                
                for(var s=0; s<$scope.$parent.selected.length; s++) {
                    if($scope.$parent.selected[s].programmes.length <= 1)
                        $scope.$parent.total_amount += 1000;
                    if($scope.$parent.selected[s].programmes.length == 2)
                        $scope.$parent.total_amount += 1600;
                    if($scope.$parent.selected[s].programmes.length == 3)
                        $scope.$parent.total_amount += 2600;
                    if($scope.$parent.selected[s].programmes.length == 4)
                        $scope.$parent.total_amount += 3200;
                    if($scope.$parent.selected[s].programmes.length > 4)
                        $scope.$parent.total_amount += ($scope.$parent.selected[s].programmes.length * 1000);
                }
            }

            $scope.deleteStudent = function (deleted_id) {
                studentFactory.delete({ id: deleted_id }, function (response) {
                    $scope.update_students();
                }, function (response) {
                    console.error(response);
                });
            }

            $scope.approveStudent = function (stu) {
                stu.paymentapproved = true;
                stu.status = "hallticket";
                studentFactory.update({ id: stu._id }, stu, function (response) {
                    $scope.$parent.update_students();
                }, function (response) {
                    console.error(response);
                });
            }

            $scope.masterApprove = function (stu) {
                stu.mfapproved = true;
                studentFactory.update({ id: stu._id }, stu, function (response) {
                    $scope.$parent.update_students();
                }, function (response) {
                    console.error(response);
                });
            }

            $scope.predicate = 'dateCreated';
            $scope.reverse = true;
            $scope.order = function (predicate) {
                $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
                $scope.predicate = predicate;
            };

            $scope.$parent.adminediting = false;
            $scope.enterHallTicket = function (id) {
                $scope.$parent.adminediting = true;
                studentFactory.get({ id: id }, function (response) {
                    console.log(response);
                    $scope.$parent.student = response;
                    $scope.$parent.student.dateofbirth = new Date($scope.$parent.student.dateofbirth);
                    $scope.$parent.isPhoto = ($scope.$parent.student.photo == "" || $scope.$parent.student.photo == undefined) ? false : true;
                    $scope.$parent.isBirthcertificate = ($scope.$parent.student.birthcertificate == "" || $scope.$parent.student.birthcertificate == undefined) ? false : true;
                    //Floating label layout fix
                    $('.mdl-textfield').addClass('is-focused');
                }, function (response) {
                    //error
                    console.error(response);
                });
            }

            $scope.displayHallTicket = function (username) {
                var fileurl = "/api/0.1/student/generateHallTicket/" + username;
                window.open(fileurl, '_self', '');
            }

            $scope.updateCenter = function (center) {
                $scope.$parent.center = center;
                $scope.$parent.newCenterModal = true;
            }

            $scope.updateUser = function (user) {
                $scope.$parent.user = user;
                $scope.$parent.newUserModal = true;
            }

            $scope.showCenterDelete = function (center) {
                var isFound = false;
                if ($scope.$parent.student_list != undefined) {
                    for (var i = 0; i < $scope.$parent.student_list.length; i++) {
                        if ($scope.$parent.student_list[i].centercode == center.centercode
                            && $scope.$parent.student_list[i].sstatename == center.sstatename) {
                            for (var a = 0; a < $scope.$parent.student_list[i].programmes.length; a++) {
                                if ($scope.$parent.student_list[i].programmes[a].programmename == center.programmename)
                                    isFound == true;
                            }
                        }
                    }
                }
                return isFound;
            }

            $scope.showUserDelete = function (user) {
            }

            $scope.deleteUser = function (id) {
                userFactory.delete({ id: id }, function (response) {
                    $scope.update_students();
                }, function (response) {
                    console.error(response);
                });
            }

            $scope.deleteCenter = function (id) {
                centerFactory.delete({ id: id }, function (response) {
                    $scope.update_students();
                }, function (response) {
                    console.error(response);
                });
            }

        };
    }]);
