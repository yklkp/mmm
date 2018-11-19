'use strict';

angular.module('mobistore.config', [])
   .factory('Constant', ['$location', function($location) {
        var PAGE_SIZE = 6;
        var SERVICE_URL_DEVELOP  = "http://127.0.0.1/tplus/";
        var SERVICE_URL_PRODUCTION = "http://127.0.0.1/tplus/";
       // var SERVICE_URL_DEVELOP  = "http://192.168.1.134/";
        //var SERVICE_URL_PRODUCTION = "http://192.168.1.134/";
        var BackendModule="mobiletplus";
        var FrontModule="mobiletplusweb";
        var ORDERADDRESS_CHANGE_EVENT='orderaddress-change';
        var WebPath = 'N/A';
        var SessionId='PHPSESSID';

        var url = $location.absUrl();
        if (url.indexOf("localhost") > -1 || url.indexOf("127.0.0.1") > -1
    		|| url.indexOf("192.168") > -1 || url.indexOf("172.16") > -1 || url.indexOf("10.0") > -1) { // development
    	    WebPath = SERVICE_URL_DEVELOP;
        } else if (url.indexOf("file://") > -1) {    // app test
		    WebPath = SERVICE_URL_DEVELOP;
        } else {    // production
    	    WebPath = SERVICE_URL_PRODUCTION;
        }
        var ApiPath =  WebPath+BackendModule+'/index.php?';
        var CHECK_VERSION_URL=ApiPath+'act=login&op=appSingleCheckUpdate';
		var ss="erteewer1714";
        var ry_appKey = '8luwapkv8rnbl';
        var ry_appSecret = 'nJRymsCpXXPV';
        return {
            PageSize: PAGE_SIZE,
            WebPath: WebPath,
            ApiPath: ApiPath,
            SessionId:SessionId,
            BackendModule:BackendModule,
            FrontModule:FrontModule,
            HTTP_RETURN_CODE_SUCCESS: 1,
            HTTP_RETURN_CODE_FAIL: 0,
            HTTP_RETURN_CODE_NO_MORE: -100,
            ORDERADDRESS_CHANGE_EVENT:ORDERADDRESS_CHANGE_EVENT,
            SERVICE_URL:WebPath,
            CHECK_VERSION_URL:CHECK_VERSION_URL,
			ss:ss,
            ry_appKey:ry_appKey,
            ry_appSecret:ry_appSecret
        };
  }])
;

