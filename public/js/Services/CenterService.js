angular.module('StudentApp.CenterService', [])
.factory('centerFactory', function ($resource) {
    return $resource(
        '/api/0.1/center/:id', {
            id: '@id',
        }, {
            update: {
                method: 'PUT'
            }
        }
    );
});
