angular.module('StudentApp.FormController', [])

    .directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;
                element.bind('change', function () {
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

        $scope.downloadHallTicket = function () {
            var username = getCookie('username');
            var fileurl = "/api/0.1/student/generateHallTicket/" + username;
            window.open(fileurl, '_self', '');
        }

        $scope.downloadReceipt = function () {
            var username = getCookie('username');
            var fileurl = "/api/0.1/student/download/" + username;
            window.open(fileurl, '_self', '');
        }

        $timeout(function () {
            getStudentStatus();
        }, 1000);

    }]);
