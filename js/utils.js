'use strict';

angular.module('mobistore.utils', [])
    .factory('MyDialog', ['$ionicPopup', '$ionicLoading','$timeout','$rootScope','$ionicBackdrop','StringUtil',function($ionicPopup,$ionicLoading,$timeout,$rootScope,$ionicBackdrop,StringUtil) {
        return {
            error:function(msg){
                var alertPopup = $ionicPopup.alert({
                    title: '<a class="picon ion-close-circled"></a><span>有点问题</span>',
                    template: msg,
                    okText:'知道了',
                    cssClass:"mydialog_error"
                });
                return alertPopup;
            },
            success:function(msg){
                var alertPopup = $ionicPopup.alert({
                    title: '<a class="picon ion-checkmark-circled"></a><span>非常顺利</span>',
                    template: msg,
                    okText:'好的',
                    cssClass:"mydialog_success"
                });
                return alertPopup;
            },
            confirm:function(title,msg,okText,cancelText,okFunc,cancelFunc){
                $ionicPopup.confirm({
                    title: '<a class="picon ion-help-circled"></a><span>'+title+'</span>',
                    template: msg,
                    cancelText:StringUtil.isEmpty(cancelText)?"关闭":cancelText,
                    okText:StringUtil.isEmpty(okText)?"确定":okText
                }).then(function(res) {
                    if(res) {
                        if(!StringUtil.isEmpty(okFunc))
                            okFunc();
                    } else {
                        if(!StringUtil.isEmpty(cancelFunc))
                            cancelFunc();
                    }
                });;
            },
            tip:function(msg,time){
                $ionicLoading.show({
                    template:msg,
                    animation: 'fade-in',
                    content: 'Loading',
                    noBackdrop: true,
                    duration: StringUtil.isEmpty(time)?1000:time});
            },
            successTip:function(msg,time,callback){
                var alertPopup = $ionicPopup.alert({
                    title: '<a class="picon ion-checkmark-circled"></a><span>非常顺利</span>',
                    template: msg,
                    okText:'好的',
                    cssClass:"mydialog_successtip",
                    buttons:[]
                });
                $timeout(function() {
                    alertPopup.close();
                    if(callback!==undefined)
                        $rootScope.$eval(callback);
                }, time!==undefined?time:1000);
            },
            errorTip:function(msg,time,callback){
                var alertPopup = $ionicPopup.alert({
                    title: '<a class="picon ion-close-circled"></a><span>有点问题</span>',
                    template: msg,
                    okText:'知道了',
                    cssClass:"mydialog_error"
                });
                $timeout(function() {
                    alertPopup.close();
                    if(callback!==undefined)
                        $rootScope.$eval(callback);
                }, time!==undefined?time:1000);
            },
            showProgress:function(downloadProgress){
                if(!$rootScope.isProgressShow){
                    $ionicBackdrop.retain();
                    $rootScope.isProgressShow=true;
                }
                $rootScope.progress_v.showProgress=true;
                $rootScope.progress_v.progress=downloadProgress;
            },
            hideProgress:function(){
                $ionicBackdrop.release();
                $rootScope.progress_v.showProgress=false;
                $rootScope.isProgressShow=false;
            },
            showLoading : function(str) {
                var s="处理中...";
                if(!StringUtil.isEmpty(str))
                    s=str;
                $ionicLoading.show({
                    template: s
                });
            },
            hideLoading : function(){
                $ionicLoading.hide();
            }
        };
    }])

  .factory('Vari', [function() {
    return {
      Test: null
    };
  }])

  .factory('Util', ['$ionicPlatform',function($ionicPlatform){
    return {
      getScreenSize: function () {
        var sh = window.screen.height;
//        if (document.body.clientHeight < sh) {
//          sh = document.body.clientHeight;
//        }

        var sw = window.screen.width;
//        if (document.body.clientWidth < sw) {
//          sw = document.body.clientWidth;
//        }
        
        var landscape = this.landscape();
        if (landscape && sh > sw) {
        	var temp = sh;
        	sh = sw;
        	sw = temp;
        }
        
        return {h: sh, w: sw};
      },
      
      landscape: function () {
	  	var orientation;
	    if (window.orientation == 0 || window.orientation == 180) {
	        orientation = 'portrait';
	        return false;
	    }
	    else if (window.orientation == 90 || window.orientation == -90) {
	        orientation = 'landscape';
	        return true;
	    }
      },

        filterVariable:function(v,defaultV){
            if(v===null || v===undefined){
                if(defaultV!==undefined)
                    return defaultV;
                else
                    return "";
            }
            else
                return v;
        },

        getLocalTime:function(nS){
            return new Date(parseInt(nS) * 1000).toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
        },
        getDateStrFromDate:function (now,splitS) {
            var year = now.getFullYear();
            var month =(now.getMonth() + 1).toString();
            var day = (now.getDate()).toString();
            if (month.length == 1) {
                month = "0" + month;
            }
            if (day.length == 1) {
                day = "0" + day;
            }
            return year +splitS+ month+splitS +  day;
        },
        startWith:function(str,pre){
            var index = str.indexOf(pre);
            if(index==0){
                return true;
            }
            return false;
        },
        isAndroid:function(){
            return $ionicPlatform.is("android");
        },
        isIos:function(){
            return $ionicPlatform.is("ios");
        }
    }
  }])
  .factory('StringUtil', [function(){
		return {
			trim: function (o){
				if (this.isEmpty(o)) {
					return '';
				}
				
				o = o.replace(/(^\s*)|(\s*$)/g, '');
				return o;
			},
		    isEmpty: function (o){
		        if (o === null || o === "null" || o === undefined || o === "undefined" || o === "") {
		            return true;
		        } else {
		            return false;
		        }
		    },
		    upcaseFirst: function(str) {
		    	var first = str.substring(0,1).toUpperCase();
		    	var others = str.substring(1,str.length);
		    	var ret = first + others;
		    	return ret;
		    },
            splitStr: function(str,s,i) {
                var strs=str.split(s);
                return strs[i];
            },
            getUrlParam: function(name,url){
                var reg = new RegExp("(^|&|\\\?)"+ name +"=([^&]*)(&|$)");
                var r = url.substr(1).match(reg);
                if (r!=null){
                    return unescape(r[2]);
                }
                return null;
            }
		};
  }])
    .factory('YorderUtil', [function(){
        return {
            getStatus: function (statusId) {
                var v=parseInt(statusId);
                if(v===0)
                    return "新建";
                else if(v==1)
                    return "已下单";
                else if(v==2)
                    return "已结束";
                else
                    return "未知";
            },
            getTagIdByStr:function(v){
                if(v==="tobuy_list")
                    return 1;
                else if(v=="like_list")
                    return 3;
                else if(v=="focus_list")
                    return 2;
                else if(v=="look_list")
                    return 4;
                else if(v=="pass_list")
                    return 5;
                else
                    return 1;
            }
        }
    }]);

