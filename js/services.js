'use strict';

angular.module('mobistore.services', [])

    .factory('clientSrv', ['$rootScope', '$cookies', '$q', '$http', '$location', '$ionicPopup','$ionicLoading','$state','$ionicNativeTransitions', 'Constant', 'StringUtil', 'ClientOpt','MyDialog','JpushService','$ionicHistory', function($rootScope, $cookies, $q, $http, $location, $ionicPopup,$ionicLoading, $state,$ionicNativeTransitions,Constant, StringUtil, ClientOpt,MyDialog,JpushService,$ionicHistory){
        return {
            signon: function (client) {
                // $ionicHistory.clearHistory();
                client = angular.extend(client, {act: 'login',op:'index',store_id:$rootScope.store_id});
                ClientOpt.opt(client).$promise.then(function(json) {
                    //console.log(json);
                    if(json.datas.error){
                        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                    }
                    else{
                        MyDialog.tip('登陆成功',1000);
                        $rootScope.token=json.datas.token;
                        localStorage.setItem("token",json.datas.token);
                        //console.log($rootScope.token);
                        $ionicHistory.clearCache();
                        $ionicHistory.clearHistory();
                        $rootScope.mineReload=true;
                        //ClientOpt.opt({act: 'login',op:'rongcloud_token','ry_appKey':Constant.ry_appKey,'ry_appSecret':Constant.ry_appSecret}).$promise.then(function(json) {
                        //    if(json.datas.error){
                        //        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                        //    }
                        //    else {
                        //        if (parseInt(json.datas.code) == 200) {
                        //            $rootScope.rongcloud_token = json.datas.token;
                        //            localStorage.removeItem('rongcloud_token');
                        //            localStorage.setItem("rongcloud_token", json.datas.token);
                        //        }
                        //    }
                        //});
                        $ionicNativeTransitions.locationUrl('/tab/home', {
                            "type": "slide",
                            "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                        });
                    }
                });
            },
            signout: function () {
                $rootScope.userProfile = null;
                localStorage.removeItem('token');
                //$location.path('/login');
                $ionicNativeTransitions.locationUrl('/tab/home', {
                    "type": "slide",
                    "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                });
            },
            signup: function (client) {
                client = angular.extend(client, {act: 'login',op:'register',store_id:$rootScope.store_id});
                ClientOpt.opt(client).$promise.then(function(json) {
                    console.log(json);
                    if(json.datas.error){
                        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                    }
                    else{
                        MyDialog.successTip('注册成功',1000);
                        $rootScope.token=json.datas.token;
                        localStorage.setItem("token",json.datas.token);
                        $ionicHistory.clearCache();
                        $ionicHistory.clearHistory();
                        $rootScope.mineReload=true;
                        $ionicNativeTransitions.locationUrl('/tab/home', {
                            "type": "slide",
                            "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                        });
                    }
                });
            },
            wxsigno: function (client) {
                client = angular.extend(client, {act: 'login',op: 'wxlogin',store_id: $rootScope.store_id,appID: Constant.AppID,appSecret: Constant.AppSecret});
                ClientOpt.opt(client).$promise.then(function(json) {
                    if(json.datas.error){
                        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                    }
                    else{
                        $rootScope.token=json.datas.token;
                        localStorage.setItem("token",json.datas.token);
                        $ionicNativeTransitions.locationUrl('/tab/home', {
                            "type": "slide",
                            "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                        });
                        $ionicHistory.clearCache();
                        $ionicHistory.clearHistory();
                        $rootScope.mineReload=true;
                        //ClientOpt.opt({act: 'login',op:'rongcloud_token','ry_appKey':Constant.ry_appKey,'ry_appSecret':Constant.ry_appSecret}).$promise.then(function(json) {
                        //    if(json.datas.error){
                        //        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                        //    }
                        //    else {
                        //        if (parseInt(json.datas.code) == 200) {
                        //            $rootScope.rongcloud_token = json.datas.token;
                        //            localStorage.removeItem('rongcloud_token');
                        //            localStorage.setItem("rongcloud_token", json.datas.token);
                        //        }
                        //    }
                        //});
                    }
                });
            },
            qqsigno: function (client) {
                client = angular.extend(client, {act: 'login',op:'qqlogin',store_id:$rootScope.store_id});
                ClientOpt.opt(client).$promise.then(function(json) {
                    if(json.datas.error){
                        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                    }
                    else{
                        $rootScope.token=json.datas.token;
                        localStorage.setItem("token",json.datas.token);
                        $ionicHistory.clearCache();
                        $ionicHistory.clearHistory();
                        $rootScope.mineReload=true;
                        //ClientOpt.opt({act: 'login',op:'rongcloud_token','ry_appKey':Constant.ry_appKey,'ry_appSecret':Constant.ry_appSecret}).$promise.then(function(json) {
                        //    if(json.datas.error){
                        //        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                        //    }
                        //    else {
                        //        if (parseInt(json.datas.code) == 200) {
                        //            $rootScope.rongcloud_token = json.datas.token;
                        //            localStorage.removeItem('rongcloud_token');
                        //            localStorage.setItem("rongcloud_token", json.datas.token);
                        //        }
                        //    }
                        //});
                        $ionicNativeTransitions.locationUrl('/tab/home', {
                            "type": "slide",
                            "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                        });
                    }
                });
            },
            wbsigno: function (client) {
                client = angular.extend(client, {act: 'login',op:'wblogin',store_id:$rootScope.store_id});
                ClientOpt.opt(client).$promise.then(function(json) {
                    if(json.datas.error){
                        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                    }
                    else{
                        $rootScope.token=json.datas.token;
                        localStorage.setItem("token",json.datas.token);
                        $ionicHistory.clearCache();
                        $ionicHistory.clearHistory();
                        $rootScope.mineReload=true;
                        //ClientOpt.opt({act: 'login',op:'rongcloud_token','ry_appKey':Constant.ry_appKey,'ry_appSecret':Constant.ry_appSecret}).$promise.then(function(json) {
                        //    if(json.datas.error){
                        //        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                        //    }
                        //    else {
                        //        if (parseInt(json.datas.code) == 200) {
                        //            $rootScope.rongcloud_token = json.datas.token;
                        //            localStorage.removeItem('rongcloud_token');
                        //            localStorage.setItem("rongcloud_token", json.datas.token);
                        //        }
                        //    }
                        //});
                        $ionicNativeTransitions.locationUrl('/tab/home', {
                            "type": "slide",
                            "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                        });
                    }
                });
            },
            resetPassword: function (client) {
                client = angular.extend(client, {act: 'login',op:'reset_passwd'});
                ClientOpt.opt(client).$promise.then(function(json) {
                    if(json.datas.error){
                        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                    }
                    else{
                        MyDialog.successTip('密码重置成功',1000,function(){
                            $ionicNativeTransitions.locationUrl('/signon', {
                                "type": "slide",
                                "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                            });
                        });
                    }
                });
            },
            bindphone: function (client) {
                client = angular.extend(client, {act: 'login',op:'bind_phone'});
                ClientOpt.opt(client).$promise.then(function(json) {
                    if(json.datas.error){
                        $ionicLoading.show({ template: '失败:'+json.datas.error, noBackdrop: true, duration: 1000 });
                    }
                    else{
                        $rootScope.token=json.datas.token;
                        localStorage.setItem("token",json.datas.token);
                        $ionicHistory.clearCache();
                        $ionicHistory.clearHistory();
                        $rootScope.mineReload=true;
                        MyDialog.successTip('绑定成功',1000);
                        $ionicNativeTransitions.locationUrl('/tab/home', {
                            "type": "slide",
                            "direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
                        });
                    }
                });
            }
        };
    }])

    //选中的地址
    .factory('orderAddressSrv', function () {
        var addressInfo = {};
        return {
            getAddressInfo: function () {
                return addressInfo;
            },
            setAddressInfo: function (address) {
                addressInfo = address;
            }
        };
    })

    /**
     * App检查更新 Service
     */
    .factory('AppUpdateService', ["$http", '$q', '$cordovaNetwork', '$cordovaAppVersion', '$ionicPopup', '$ionicLoading', '$cordovaFileTransfer', '$cordovaFileOpener2', '$timeout','Constant','MyDialog',
        function ($http, $q, $cordovaNetwork, $cordovaAppVersion, $ionicPopup, $ionicLoading, $cordovaFileTransfer, $cordovaFileOpener2, $timeout,Constant,MyDialog) {
            return {
                checkVersionData: checkVersionData,
                checkVersion: checkVersion
            };
            function checkVersionData(data){
                var deferred = $q.defer();
                $http({method: 'GET', url: Constant.CHECK_VERSION_URL, params: data}).success(function (data) {
                    if(data.error)
                        deferred.reject(data.error);
                    else
                        deferred.resolve(data.datas);
                }).error(function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            }
            function checkVersion(scope){
                var deferred = $q.defer();
                // params 是我这边需要传递给后端接口的参数，需更改为你自己的参数
                var params = {
                    platform: 'android',
                    version: '',
                    code:Constant.ss
                };
                // 获取手机的网络状态，返回的值包括：WIFI CELL_4G CELL_3G等网络状态，这里用来检测手机是否处于WiFi状态
                var networkType = $cordovaNetwork.getNetwork();
                // 获取App 内的版本信息
                $cordovaAppVersion.getVersionNumber().then(function (version) {
                    params.version = version;
                    // 获取服务器版本信息
                    checkVersionData(params)
                        .then(function (data) {
                            // 判断是否需要更新
                            var json = {
                                title: '',
                                subTitle: '<p class="text-left">'+data.content+'</p>'
                            };
                            data.updateFlag=0;//0不更新，1强制更新，2普通更新
                            // 由于应用内的版本是1.0.0这种格式，所以可以通过正则替换成1.0.0->100，方便进行版本号的比较
                            var nowVersionNum = parseInt(version.toString().replace(new RegExp(/(\.)/g), '0'));
                            // data.version为后端接口返回的需要更新的新版本号
                            var newVersionNum = parseInt(data.newVersion);
                            var newMinVersionNum = parseInt(data.minVersion);
                            if (newVersionNum > nowVersionNum) {
                                if (newVersionNum>newMinVersionNum) {  // 普通更新
                                    data.updateFlag=2;
                                    if (networkType == 'wifi') {
                                        json.title = 'APP版本更新';
                                        scope.update_title="APP版本更新";
                                    }
                                    else {
                                        scope.update_title="APP版本更新（建议WIFI下升级）";
                                        json.title = 'APP版本更新（建议WIFI下升级）';
                                    }
                                    updateAppPopup(json, scope).then(function (res) {
                                        if (res == 'update') {
                                            UpdateForAndroid(data.downloadUrl,scope);
                                        }
                                    });
                                }
                                else if (newVersionNum===newVersionNum) {  // 强制更新
                                    data.updateFlag=1;
                                    UpdateForAndroid(data.downloadUrl,scope);
                                }
                            }
                            deferred.resolve(data.updateFlag);
                        }, function (err) {
                            deferred.reject(null);
                        })
                });

                return deferred.promise;
            }
            function updateAppPopup(json, scope){
                return $ionicPopup.show({
                    title: json.title,
                    subTitle: json.subTitle,
                    scope: scope,
                    buttons: [
                        {
                            text: '取消',
                            type: 'button-clear button-assertive',
                            onTap: function () {
                                return 'cancel';
                            }
                        },
                        {
                            text: '更新',
                            type: 'button-clear button-assertive border-left',
                            onTap: function (e) {
                                return 'update';
                            }
                        }
                    ]
                });
            }
            function UpdateForAndroid(downloadUrl,scope) {
                scope.progress_v.progress=0;
                scope.progress_v.text=true;
                scope.progress_v.showProgress=true;
                scope.progress_v.textVal="正在下载：";
                scope.targetPath = "file:///ApinAPKDownload/hztc.apk";
                try {
                    onDeviceReady(scope).then(function () {
                        var trustHosts = true;
                        var options = {};
                        $cordovaFileTransfer.download(downloadUrl, scope.targetPath, options, trustHosts).then(function (result) {
                            $cordovaFileOpener2.open(scope.targetPath, 'application/vnd.android.package-archive'
                            ).then(function () {
                            }, function (err) {
                                MyDialog.tip(err);
                            });
                            MyDialog.hideProgress();
                        }, function (err) {
                            $ionicLoading.show({
                                template: "下载失败:" + err,
                                duration: 1000
                            });
                            MyDialog.hideProgress();
                        }, function (progress) {
                            $timeout(function () {
                                var downloadProgress = Math.floor((progress.loaded / progress.total) * 100);
                                MyDialog.showProgress(downloadProgress);
                                if (downloadProgress > 99) {
                                    MyDialog.hideProgress();
                                }
                            }, 200);
                        });
                    });
                }
                catch (e) {
                    MyDialog.tip(e.name + ":" + e.message);
                }
            }
            function onDeviceReady(scope) {
                var q = $q.defer();
                try {
                    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (fileSystem) {
                        fileSystem.getDirectory("ApinAPKDownload",  {
                            create: true,
                            exclusive: false
                        }, function (result) {
                            scope.targetPath = result.toURL()+"/hztc.apk";
                            q.resolve(result);
                        }, function (error) {
                            MyDialog.tip(error.message);
                            q.reject(error);
                        });
                    }, function (err) {
                        MyDialog.tip(err.message);
                        q.reject(err.message);
                    });
                }
                catch (e) {
                    MyDialog.tip(e.message);
                    q.reject(e);
                }
                return q.promise;
            }
        }])

    .factory('JpushService', [
        function () {
            return {
                init: function () {
                    if(window.plugins&&window.plugins.jPushPlugin){
                        window.plugins.jPushPlugin.init();
                        //调试模式
                        window.plugins.jPushPlugin.setDebugMode(false);

                    }
                },
                setAlias:function(alias){
                    if(window.plugins&&window.plugins.jPushPlugin){
                        window.plugins.jPushPlugin.setAlias(alias);
                    }
                },
                clearAlias:function(){
                    if(window.plugins&&window.plugins.jPushPlugin){
                        window.plugins.jPushPlugin.setAlias(null);
                    }
                },
                setTags:function(tags){
                    if(window.plugins&&window.plugins.jPushPlugin){
                        window.plugins.jPushPlugin.setTags(tags,function(data){},function(data){
                            var json=data;
                            if(typeof data === 'string'){
                                console.log("jpush set tags error:"+data);
                                MyDialog.errorTip("jpush设置标签失败");
                            }

                        });
                    }
                },
                clearTags:function(){
                    if(window.plugins&&window.plugins.jPushPlugin){
                        window.plugins.jPushPlugin.setTags(null);
                    }
                }
            }
        }])
;