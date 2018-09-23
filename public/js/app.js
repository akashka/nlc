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
        $scope.isUnit = getCookie('role') == "unit";
        $scope.isMaster = getCookie('role') == "master";
        $scope.isAdmin = getCookie('role') == "admin";
        if ($scope.isUnit) $scope.center = getCookie('center');
        if (!$scope.isStudent) $scope.sstate = getCookie('sstate');
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
            $scope.$parent.center = getCookie('center');
            $scope.$parent.sstate = getCookie('sstate');
            for (var d = 0; d < $scope.student_list.length; d++) {
                if ($scope.isAdmin || ($scope.isMaster && $scope.student_list[d].sstatename == $scope.$parent.sstate) 
                    || ($scope.isUnit && $scope.student_list[d].centercode == $scope.$parent.center)) {
                        down.push({
                            phone: ($scope.student_list[d].phone != undefined) ? $scope.student_list[d].phone : "",
                            email: ($scope.student_list[d].email != undefined) ? $scope.student_list[d].email : "",
                            name: ($scope.student_list[d].name != undefined) ? $scope.student_list[d].name : "",
                            dateofbirth: ($scope.student_list[d].dateofbirth != undefined) ? $scope.student_list[d].dateofbirth : "",
                            gender: ($scope.student_list[d].gender != undefined) ? $scope.student_list[d].gender : "",
                            parentname: ($scope.student_list[d].parentname != undefined) ? $scope.student_list[d].parentname : "",
                            address: ($scope.student_list[d].address != undefined) ? $scope.student_list[d].address : "",
                            tshirtsize: ($scope.student_list[d].tshirtsize != undefined) ? $scope.student_list[d].tshirtsize : "",
                            photo: ($scope.student_list[d].photo != undefined && $scope.student_list[d].photo != "") ? ("https://s3.ap-south-1.amazonaws.com/alohanlc/" + $scope.student_list[d].photo) : "",
                            birthcertificate: ($scope.student_list[d].birthcertificate != undefined && $scope.student_list[d].birthcertificate != "") ? ("https://s3.ap-south-1.amazonaws.com/alohanlc/" + $scope.student_list[d].birthcertificate) : "",
                            programmename: ($scope.student_list[d].programmename != undefined) ? $scope.student_list[d].programmename : "",
                            centername: ($scope.student_list[d].centername != undefined) ? $scope.student_list[d].centername : "",
                            centercode: ($scope.student_list[d].centercode != undefined) ? $scope.student_list[d].centercode : "",
                            sstatename: ($scope.student_list[d].sstatename != undefined) ? $scope.student_list[d].sstatename : "",
                            status: ($scope.student_list[d].status != undefined) ? $scope.student_list[d].status : "",
                            dateCreated: ($scope.student_list[d].dateCreated != undefined) ? $scope.student_list[d].dateCreated : "",
                            group: ($scope.student_list[d].group != undefined) ? $scope.student_list[d].group : "",
                            level: ($scope.student_list[d].level != undefined) ? $scope.student_list[d].level : "",
                            paymentdate: ($scope.student_list[d].paymentdate != undefined) ? $scope.student_list[d].paymentdate : "",
                            transactionno: ($scope.student_list[d].transactionno != undefined) ? $scope.student_list[d].transactionno : "",
                            paymentmode: ($scope.student_list[d].paymentmode != undefined) ? $scope.student_list[d].paymentmode : "",
                            bankname: ($scope.student_list[d].bankname != undefined) ? $scope.student_list[d].bankname : "",
                            examdate: ($scope.student_list[d].examdate != undefined) ? $scope.student_list[d].examdate : "",
                            entrytime: ($scope.student_list[d].entrytime != undefined) ? $scope.student_list[d].entrytime : "",
                            competitiontime: ($scope.student_list[d].competitiontime != undefined) ? $scope.student_list[d].competitiontime : "",
                            admissioncardno: ($scope.student_list[d].admissioncardno != undefined) ? $scope.student_list[d].admissioncardno : "",
                            paymentapproved: ($scope.student_list[d].paymentapproved != undefined) ? $scope.student_list[d].paymentapproved : "",
                            mfapproved: ($scope.student_list[d].mfapproved != undefined) ? $scope.student_list[d].mfapproved : "",
                            venue: ($scope.student_list[d].venue != undefined) ? $scope.student_list[d].venue : "",
                        })
                }
            }
            return down;
        }

        $scope.getDownloadHeader = function () {
            var abc = ['Phone No.', 'Email ID', 'Student Name', 'Date of Birth', 'Gender', 'Parent Name', 'Address',
                'T-shirt Size', 'Photo URL', 'Birth Certificate URL', 'Programme Name', 'Center Name', 'Center Code',
                'State Name', 'Status', 'Date Of Entry', 'Group', 'Level', 'Payment Date',
                'Transaction No', 'Payment Mode', 'Bank Name', 'Exam Date', 'Entry Time', 'Competition Time',
                'Admission Card No', 'Payment Approved', 'MF Approved', 'Venue'];
            return abc;
        }

        /* Set the width of the side navigation to 250px */
        $scope.openNav = function () {
            document.getElementById("mySidenav").style.width = "250px";
        }

        /* Set the width of the side navigation to 0 */
        $scope.closeNav = function () {
            document.getElementById("mySidenav").style.width = "0";
        }

    }]);



