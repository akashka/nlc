angular.module('StudentApp.StudentService', [])
.factory('studentFactory', function ($resource) {
    return $resource(
        '/api/0.1/student/:id', {
            id: '@id',
        }, {
            update: {
                method: 'PUT'
            }
        }
    );
});
