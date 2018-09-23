var app = angular.module('StudentApp', [
    'ngRoute',
    'ngResource',
    'StudentApp.StudentService',
    'StudentApp.UserService',
    'StudentApp.CenterService',
    'StudentApp.LoginController',
    'StudentApp.TableController',
    'StudentApp.CardController',
    'StudentApp.FormController',
    'uiSwitch',
    'ngCsv',
    'ngTable'
])
    .controller('MainController', ['$scope', '$http', 'studentFactory', function ($scope, $http, studentFactory) {
        //State vars initialization
        $scope.loading = true;
        $scope.loggedIn = getCookie('username') != "";
        $scope.isStudent = getCookie('role') == "student";
        $scope.isCenter = getCookie('role') == "center";
        $scope.isAdmin = getCookie('role') == "admin";
        if ($scope.isCenter) $scope.center = getCookie('center');
        // $scope.student={};
        $scope.editing = false;

        //Add student button handler
        $scope.add_student = function () {
            $scope.student = {};
            $scope.editing = true;

            //Floating label layout fix
            $('.mdl-textfield').removeClass('is-focused');
        };

        //Logout button handler
        $scope.logout = function (e) {
            delete_cookie('username');
            location.reload();
        };

        $scope.$parent.selectMultiple = false;
        $scope.make_payment = function () {
            $scope.$parent.selectMultiple = !$scope.$parent.selectMultiple;
        }

        $scope.$parent.paymenting = false;
        $scope.pay_amount = function () {
            if ($scope.$parent.selectMultiple.length <= 0) return;
            $scope.$parent.paymenting = true;
            $scope.payment = {
                paymentdate: new Date(),
                transactionno: "",
                paymentmode: "",
                bankname: "",
            };
        }

        //Close card handler
        $scope.cancel_payment = function () {
            $scope.$parent.paymenting = false;
            $scope.$parent.loading = false;
        };

        $scope.paymentmodes = ['Online', 'Cheque'];
        $scope.banknames = ["Allahabad Bank", "Andhra Bank", "Axis Bank", "Bank of Bahrain and Kuwait", "Bank of Baroda",
            "Bank of India", "Bank of Maharashtra", "Canara Bank", "Central Bank of India", "City Union Bank", "Corporation Bank",
            "Deutsche Bank", "Development Credit Bank", "Dhanlaxmi Bank", "Federal Bank", "HDFC Bank", "ICICI Bank", "IDBI Bank",
            "Indian Bank", "Indian Overseas Bank", "IndusInd Bank", "ING Vysya Bank", "Jammu and Kashmir Bank", "Karnataka Bank Ltd",
            "Karur Vysya Bank", "Kotak Bank", "Laxmi Vilas Bank", "Oriental Bank of Commerce", "Punjab National Bank", "Punjab & Sind Bank",
            "Shamrao Vitthal Co-operative Bank", "South Indian Bank", "State Bank of India", "Syndicate Bank", "Tamilnad Mercantile Bank Ltd.",
            "UCO Bank", "Union Bank of India", "United Bank of India", "Vijaya Bank", "Yes Bank Ltd", "Others"
        ];

        $scope.msgs = "";
        $scope.save_payment = function () {
            if ($scope.payment.paymentdate == undefined || $scope.payment.paymentdate == "" ||
                $scope.payment.transactionno == undefined || $scope.payment.transactionno == "" ||
                $scope.payment.paymentmode == undefined || $scope.payment.paymentmode == "" ||
                $scope.payment.bankname == undefined || $scope.payment.bankname == ""
            ) {
                $scope.msgs = "Please fill all data correctly.";
            } else {
                $scope.loading = true;
                var count = 0;
                for (i = 0; i < $scope.selected.length; i++) {
                    $scope.selected[i].paymentdate = $scope.payment.paymentdate;
                    $scope.selected[i].transactionno = $scope.payment.transactionno;
                    $scope.selected[i].paymentmode = $scope.payment.paymentmode;
                    $scope.selected[i].bankname = $scope.payment.bankname;
                    $scope.selected[i].status = 'admin';
                    studentFactory.update({ id: $scope.selected[i]._id }, $scope.selected[i], function (response) {
                        count++;
                        if (count >= $scope.selected.length) {
                            $scope.paymenting = false;
                            $scope.loading = false;
                            $scope.update_students();
                        }
                    }, function (response) {
                        console.error(response);
                    });
                }
            }
        }

        $scope.getDownloadTable = function () {
            var down = [];
            for (var d = 0; d < $scope.student_list.length; d++) {
                down.push({
                    phone: ($scope.student_list[d].phone != undefined) ? $scope.student_list[d].phone : "",
                    email: ($scope.student_list[d].email != undefined) ? $scope.student_list[d].email : "",
                    name: ($scope.student_list[d].name != undefined) ? $scope.student_list[d].name : "",
                    dateofbirth: ($scope.student_list[d].dateofbirth != undefined) ? $scope.student_list[d].dateofbirth : "",
                    gender: ($scope.student_list[d].gender != undefined) ? $scope.student_list[d].gender : "",
                    parentname: ($scope.student_list[d].parentname != undefined) ? $scope.student_list[d].parentname : "",
                    address: ($scope.student_list[d].address != undefined) ? $scope.student_list[d].address : "",
                    programmename: ($scope.student_list[d].programmename != undefined) ? $scope.student_list[d].programmename : "",
                    tshirtrequired: ($scope.student_list[d].tshirtrequired != undefined) ? $scope.student_list[d].tshirtrequired : "",
                    tshirtsize: ($scope.student_list[d].tshirtsize != undefined) ? $scope.student_list[d].tshirtsize : "",
                    photo: ($scope.student_list[d].photo != undefined && $scope.student_list[d].photo != "") ? ("https://s3.ap-south-1.amazonaws.com/alohakarnataka/" + $scope.student_list[d].photo) : "",
                    birthcertificate: ($scope.student_list[d].birthcertificate != undefined && $scope.student_list[d].birthcertificate != "") ? ("https://s3.ap-south-1.amazonaws.com/alohakarnataka/" + $scope.student_list[d].birthcertificate) : "",
                    centername: (($scope.student_list[d].centername != undefined) ? $scope.student_list[d].centername : "") + ($scope.student_list[d].schoolname != undefined ? $scope.student_list[d].schoolname : ""),
                    status: ($scope.student_list[d].status != undefined) ? $scope.student_list[d].status : "",
                    dateCreated: ($scope.student_list[d].dateCreated != undefined) ? $scope.student_list[d].dateCreated : "",
                    group: ($scope.student_list[d].group != undefined) ? $scope.student_list[d].group : "",
                    category: ($scope.student_list[d].category != undefined) ? $scope.student_list[d].category : "",
                    level: ($scope.student_list[d].level != undefined) ? $scope.student_list[d].level : "",
                    registrationdate: ($scope.student_list[d].registrationdate != undefined) ? $scope.student_list[d].registrationdate : "",
                    presentlevel: ($scope.student_list[d].presentlevel != undefined) ? $scope.student_list[d].presentlevel : "",
                    presentweek: ($scope.student_list[d].presentweek != undefined) ? $scope.student_list[d].presentweek : "",
                    section: ($scope.student_list[d].section != undefined) ? $scope.student_list[d].section : "",
                    class: ($scope.student_list[d].class != undefined) ? $scope.student_list[d].class : "",
                    lastyearlevel: ($scope.student_list[d].lastyearlevel != undefined) ? $scope.student_list[d].lastyearlevel : "",
                    paymentdate: ($scope.student_list[d].paymentdate != undefined) ? $scope.student_list[d].paymentdate : "",
                    transactionno: ($scope.student_list[d].transactionno != undefined) ? $scope.student_list[d].transactionno : "",
                    paymentmode: ($scope.student_list[d].paymentmode != undefined) ? $scope.student_list[d].paymentmode : "",
                    bankname: ($scope.student_list[d].bankname != undefined) ? $scope.student_list[d].bankname : "",
                    examdate: ($scope.student_list[d].examdate != undefined) ? $scope.student_list[d].examdate : "",
                    entrytime: ($scope.student_list[d].entrytime != undefined) ? $scope.student_list[d].entrytime : "",
                    competitiontime: ($scope.student_list[d].competitiontime != undefined) ? $scope.student_list[d].competitiontime : "",
                    admissioncardno: ($scope.student_list[d].admissioncardno != undefined) ? $scope.student_list[d].admissioncardno : "",
                    paymentapproved: ($scope.student_list[d].paymentapproved != undefined) ? $scope.student_list[d].paymentapproved : ""
                })
            }
            return down;
        }

        $scope.getDownloadHeader = function () {
            var abc = ['Phone No.', 'Email ID', 'Student Name', 'Date of Birth', 'Gender', 'Parent Name', 'Address',
                'Programme Name', 'T-shirt Required', 'T-shirt Size', 'Photo URL', 'Birth Certificate URL',
                'Center / School Name', 'Status', 'Date Of Entry', 'Group', 'Category', 'Level', 'Registration Date',
                'Present Level', 'Present Week', 'Section', 'Class', 'Last Year Level', 'Payment Date',
                'Transaction No', 'Payment Mode', 'Bank Name', 'Exam Date', 'Entry Time', 'Competition Time',
                'Admission Card No', 'Payment Approved'];
            return abc;
        }

    }]);



