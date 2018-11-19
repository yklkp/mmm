'use strict';

angular.module('mobistore.filters', [])

.filter('imgPath', ['Constant', 'StringUtil', function(Constant, StringUtil) {
    return function(url, external) {
        if (StringUtil.isEmpty(url)) {
            return undefined;
        }
        if (StringUtil.isEmpty(external))  {
        	external = true;
        }

        if (external) {
            url = Constant.WebPath + url;
        }
        return url;
    }
}])

.filter('thumbPath', ['Constant', 'StringUtil', function(Constant, StringUtil) {
    return function(url) {
        if (StringUtil.isEmpty(url)) {
            return undefined;
        }
        var inx = url.lastIndexOf('/');
        var rst = url.substring(0, inx + 1) + 'thumbnail' + url.substring(inx);
        return rst;
    }
}])

.filter('orderStatus', ['Constant', 'StringUtil', function(Constant, StringUtil) {
    return function(s) {
    	var s = parseInt(s);
    	var status;
        if(s===0){
            status = '已取消';
        }
        else if (s === 10) {
        	status = '未付款';
        } else if (s === 15) {
        	status = '录入定金';
        } else if (s === 16){
        	status = '确认定金';
        } else if (s ===20){
        	status = '已付款';
        } else if (s === 25){
        	status = '备货中';
        } else if (s === 26){
        	status = '部分发货';
        } else if (s ===30){
        	status = '已发货';
        } else if (s === 40){
        	status = '已收货';
        }
        else{
            status = '未知';
        }
        return status;
    }
}])
    .filter('productStatus', ['StringUtil', function( StringUtil) {
        return function(s) {
            var s = parseInt(s);
            var status;
            if(s===0){
                status = '未售';
            }
            else if (s === 1) {
                status = '已售';
            } else if (s === 2) {
                status = '维护中';
            } else if (s === 3){
                status = '锁定中';
            }
            else{
                status = '未知';
            }
            return status;
        }
    }])
.filter('booleanToCn', ['Constant', 'StringUtil', function(Constant, StringUtil) {
    return function(bl) {
        if (bl == true) {
        	return '是';
        } else {
        	return '否';
        }
        
        var inx = url.lastIndexOf('/');
        var rst = url.substring(0, inx + 1) + 'thumbnail' + url.substring(inx);
        return rst;
    }
}])
    .filter('to_html', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }])
;
