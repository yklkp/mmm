'use strict';

angular.module('mobistore.models', [])

//var models = ['client', 'home'];
//for (var i = 0; i < models.length; i++) {
//	angular.module('mobistore.models', [])
//		.factory(StringUtil.upcaseFirst(name) + 'Opt', ['$resource', 'Constant', function($resource, Constant){
//	    return $resource(Constant.ApiPath + name+ '/opt/:act', {act:'@act'}, {
//	        'opt': {method:'POST'}
//	    });
//	}])
//	console.log(StringUtil.upcaseFirst(name) + 'Opt');
//}

.factory('ClientOpt', ['$resource', 'Constant', function($resource, Constant){
    return $resource(Constant.ApiPath + 'act=:act&op=:op', {act:'@act',op:'@op'}, {
        'opt': {method:'POST'}
    });
}]);
