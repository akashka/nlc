angular.module('StudentApp.FormController', [])

    .directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;
                element.bind('change', function () {
                    scope.file = element[0].files[0];
                    scope.getFile(element[0].attributes['file-model'].nodeValue);
                    scope.$apply(function () {
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }])

    .service('fileUpload', ['$http', function ($http) {
        this.uploadFileToUrl = function (file, uploadUrl) {
            var fd = new FormData();
            fd.append('file', file);
            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            })
                .success(function (response) {
                    return response;
                })
                .error(function (error) {
                    return error;
                });
        }
    }])

    .controller('FormController', ['$scope', 'studentFactory', 'fileUpload', '$timeout', '$rootScope', function ($scope, studentFactory, fileUpload, $timeout, $rootScope) {

        $scope.showStudentStatus = false;
        $scope.loading = true;

        var getStudentStatus = function () {
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

        $rootScope.$on('loggedin', function () {
            getStudentStatus();
        });

        $scope.downloadHallTicket = function (username, program_id) {
            // var username = getCookie('username');
            var fileurl = "/api/0.1/student/generateHallTicket/" + username + "/" + program_id;
            window.open(fileurl, '_self', '');
        }

        $scope.downloadReceipt = function () {
            var username = getCookie('username');
            var fileurl = "/api/0.1/student/download/" + username;
            window.open(fileurl, '_self', '');
        }

        $scope.getModelPaper = function(program) {
            if (program.programmename == 'Tiny Tots' || program.programmename == 'State Tiny Tots')
            {
                var fileToPrint1 = './files/TT_' + program.level + '_1.pdf';
                var fileToPrint2 = './files/TT_' + program.level + '_2.pdf';
                window.open(fileToPrint1, 'print1', '');
                $timeout(function () {
                    window.open(fileToPrint2, 'print2', '');
                }, 1000);
            }
            else if (program.programmename == 'Mental Arithmetic' || program.programmename == 'State Mental Arithmetic')
            {
                var fileToPrint1 = './files/MA_' + program.level + '_1.pdf';
                var fileToPrint2 = './files/MA_' + program.level + '_2.pdf';
                window.open(fileToPrint1, 'print1', '');
                $timeout(function () {
                    window.open(fileToPrint2, 'print2', '');
                }, 1000);
            }
        }

        $scope.calculateFee = function(student) {
            var amount = 0;
            var programmes = '';
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
            return amount;
        }

        $scope.downloadFormCopy = function (student) {
            var fileurl = "/api/0.1/student/downloadCopy/" + student.phone;
            window.open(fileurl, '_self', '');
        }

        $timeout(function () {
            getStudentStatus();
        }, 1000);

    }]);
