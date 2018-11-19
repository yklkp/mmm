'use strict';

// Ionic MobiStore App

// angular.module is a global place for creating, registering and retrieving Angular modules
//'mobistore' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of'requires'
//'mobistore.services' is found in services
//'mobistore.controllers' is found in controllers
angular.module('mobistore', ['ngResource', 'ionic', 'ngCookies', "ngWaterfall", "ui.router", 'ionic-citypicker', 'RongWebIMWidget',
    'mobistore.utils', 'mobistore.config', 'mobistore.filters', 'mobistore.models', 'mobistore.controllers', 'mobistore.services', 'mobistore.directives', 'tabSlideBox', 'TaxApp',
    'ng-mfb', 'ionic-datepicker', 'ngCordova', 'ionic-native-transitions', 'ui.swiper'])

    .run(function ($ionicPlatform,$rootScope,$cookies,$ionicHistory,$location,$cordovaToast,$cordovaKeyboard,$ionicNativeTransitions,StringUtil,AppUpdateService,MyDialog,Util,ClientOpt,$ionicModal,$q,$interval,Constant,JpushService,$injector) {
        $rootScope.get_yorder_num=function(){
            ClientOpt.opt({act:'jieorder', op:'get_yorder_num'}, function (json) {
                if (!StringUtil.isEmpty(json.datas.error)) {
                    $injector.get('$ionicLoading').show({
                        template: json.datas.error,
                        duration: 1000,
                        noBackdrop: true
                    });
                }
                else {
                    $rootScope.yorder_num=json.datas.yorder_num;
                }
            });
        };
        $rootScope.yorder_num=0;
        //获取店铺ID
        if(StringUtil.isEmpty($rootScope.store_id)){
            //var store_id=localStorage.getItem('store_id');
            var store_id=1714;
            //console.log(store_id);
            if(StringUtil.isEmpty(store_id)){
                ClientOpt.opt({act:'login', op:'get_store_id',code: Constant.ss}, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        $injector.get('$ionicLoading').show({
                            template: json.datas.error,
                            duration: 1000,
                            noBackdrop: true
                        });
                    }
                    else {
                        $rootScope.store_id=json.datas.store_id;
                        localStorage.removeItem('store_id');
                        localStorage.setItem('store_id',$rootScope.store_id);
                    }
                });
            }
            else{
                $rootScope.store_id=parseInt(store_id);
            }
        }
        if(StringUtil.isEmpty($rootScope.token)){
            var token=localStorage.getItem('token');
            if(!StringUtil.isEmpty(store_id)){
                $rootScope.token=token;
            }
        }
        $rootScope.isLogin=function(fun,check){
            ClientOpt.opt({act:'store', op:'isLogin'}, function (json) {
                var code = json.login;
                if (code === 0) {
                    $rootScope.gotoPage('/login');
                }
                else{
                    if(check){
                        if (StringUtil.isEmpty(json.datas.customer_mobile)){
                            $rootScope.gotoPage('/phonelock');
                        }
                        else{
                            JpushService.setAlias(json.datas.user_id);
                            $rootScope.get_yorder_num();
                            if(fun){
                                fun();
                            }
                        }
                    }
                    else{
                        JpushService.setAlias(json.datas.user_id);
                        $rootScope.get_yorder_num();
                        if(fun){
                            fun();
                        }
                    }
                }
            });
        };

        //me中的判断是否登陆，不跳转到登陆页面
        $rootScope.ismeLogin=function(fun,check){
            ClientOpt.opt({act:'store', op:'isLogin'}, function (json) {
                var code = json.login;
                //console.log(code);
                if (code === 0) {
                    $rootScope.gotoPage('/tab/me');
                    //return false;
                }
                else{
                    if(check){
                        if (StringUtil.isEmpty(json.datas.customer_mobile)){
                            $rootScope.gotoPage('/phonelock');
                        }
                        else{
                            JpushService.setAlias(json.datas.user_id);
                            $rootScope.get_yorder_num();
                            if(fun){
                                fun();
                            }
                        }
                    }
                    else{
                        JpushService.setAlias(json.datas.user_id);
                        $rootScope.get_yorder_num();
                        if(fun){
                            fun();
                        }
                    }
                }
            });
        };
        if(Util.isIos()){
            $rootScope.platform_name="ios";
        }
        else if(Util.isAndroid()){
            $rootScope.platform_name="android";
        }
        else{
            $rootScope.platform_name="web";
        }
        $ionicPlatform.ready(function () {
            if (window.cordova) {
                if(Util.isIos()){
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                }
                else {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                    //android6对于权限处理
                    $rootScope.permissions = cordova.plugins.permissions;
                    $rootScope.checkPermission=function(permissionType){
                        $rootScope.permissions.hasPermission(permissionType, checkPermissionCallback, null);
                        function checkPermissionCallback(status) {
                            if(!status.hasPermission) {
                                var errorCallback = function() {
                                    var err=permissionType+' 权限未开启。将影响功能正常使用';
                                    console.warn(err);
                                    MyDialog.tip(err,1000);
                                };
                                $rootScope.permissions.requestPermission(
                                    permissionType,
                                    function(status) {
                                        if(!status.hasPermission) errorCallback();
                                    },
                                    errorCallback);
                            }
                        }
                    };
                    //检测相机使用权限
                    $rootScope.checkPermission($rootScope.permissions.CAMERA);
                    $rootScope.checkPermission($rootScope.permissions.WRITE_EXTERNAL_STORAGE);
                    //进度条控制
                    $rootScope.progress_v={};
                    $rootScope.progress_v.style='blue';
                    $rootScope.progress_v.progress=0;
                    $rootScope.progress_v.text=true;
                    $rootScope.progress_v.showProgress=false;
                    $rootScope.progress_v.textVal="";
                    //全局刷新控制标志
                    $rootScope.allFreshFlag=false;
                    $rootScope.win_W = window.innerWidth;
                    $rootScope.win_H=window.innerHeight;
                    //更新app
                    AppUpdateService.checkVersion($rootScope).then(function (data) {
                    }, function (error) {
                        MyDialog.tip(error, 1000);
                    });
                }
                cordova.plugins.Keyboard.disableScroll(true);
                //延迟splash screnn 隐藏时间,不然会有短暂的白屏出现
                setTimeout(function () {
                    navigator.splashscreen.hide();
                }, 500);
            }
            $rootScope.goback = function () {
                $rootScope.$ionicGoBack();
            };
            $rootScope.toMine = function () {
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $ionicNativeTransitions.locationUrl('/tab/home', {
                    "type": "slide",
                    "direction": "right" //'left|right|up|down', default'left' (which is like'next')
                });
            };
            $rootScope.gotoPage = function (url) {
                var option = {
                    "type": "slide",
                    "direction": "left" //'left|right|up|down', default'left' (which is like'next')
                };
                $ionicNativeTransitions.locationUrl(url, option);
            };
            $rootScope.gobackPage = function (url) {
                var option = {
                    "type": "slide",
                    "direction": "right" //'left|right|up|down', default'left' (which is like'next')
                };
                $ionicNativeTransitions.locationUrl(url, option);
            };
            $rootScope.loadHtml = function (url) {
                //alert("wa")
                // url='http://127.0.0.1/supercmf/public/index.php/portal/article/index/id/33.html';
                if (url) {
                    url = encodeURIComponent(encodeURIComponent(url));
                    $rootScope.gotoPage("/htmlcontent/" + url);
                    // $location.path('/htmlcontent/'+url);
                    // $state.go('htmlcontent', { p: 222 });
                    // $state.reload("htmlcontent");
                }
            };
            $rootScope.parseFloat = function (num) {
                if(StringUtil.isEmpty(num)){
                    return 0;
                }
                return parseFloat(num).toFixed(2);
            };
            $rootScope.parseInt=function(num){
                if(StringUtil.isEmpty(num)){
                    return 0;
                }
                return parseInt(num);
            };
            //物理返回按钮控制&双击退出应用
            $ionicPlatform.registerBackButtonAction(function (e) {
                //判断处于哪个页面时双击退出
                if ($location.path() == '/tab/home' || $location.path() == '/tab/storelist_up' || $location.path() == '/tab/mine_new' || $location.path() == '/tab/notification' || $location.path() == '/tab/wish_list') {
                    if ($rootScope.backButtonPressedOnceToExit) {
                        ionic.Platform.exitApp();
                    } else {
                        $rootScope.backButtonPressedOnceToExit = true;
                        $cordovaToast.showShortBottom('再按一次退出系统');
                        setTimeout(function () {
                            $rootScope.backButtonPressedOnceToExit = false;
                        }, 2000);
                    }
                } else if ($ionicHistory.backView()) {
                    if ($cordovaKeyboard.isVisible()) {
                        $cordovaKeyboard.close();
                    } else {
                        // $ionicHistory.goBack();
                        if (Util.startWith($location.path(), '/order_detail/')) {//如果是从订单详细页点物理返回键，则强制跳到我页面
                            $ionicNativeTransitions.locationUrl('/tab/mine_new', {
                                "type": "slide",
                                "direction": "right" //'left|right|up|down', default'left' (which is like'next')
                            });
                        }
                        else {
                            $rootScope.$ionicGoBack();
                        }
                    }
                } else {
                    if ($rootScope.backButtonPressedOnceToExit) {
                        ionic.Platform.exitApp();
                    } else {
                        $rootScope.backButtonPressedOnceToExit = true;
                        $cordovaToast.showShortBottom('再按一次退出系统');
                        setTimeout(function () {
                            $rootScope.backButtonPressedOnceToExit = false;
                        }, 2000);
                    }
                }
                e.preventDefault();
                return false;
            }, 201);
        });
    })

    .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $provide, $httpProvider, $ionicConfigProvider, $sceDelegateProvider, $ionicNativeTransitionsProvider) {
        $ionicConfigProvider.platform.android.tabs.position('bottom');

        $urlRouterProvider.otherwise('/tab/home');
        $ionicConfigProvider.tabs.style('standard');
        $ionicConfigProvider.navBar.alignTitle('center');
        $ionicConfigProvider.backButton.icon('ion-chevron-left');
        $ionicConfigProvider.backButton.text('');
        $ionicConfigProvider.views.transition('none');
        // $locationProvider.html5Mode(true); // 发布时需要用html5Mode
        $sceDelegateProvider.resourceUrlWhitelist(['self',
            'http://127.0.0.1/**']);
        $ionicNativeTransitionsProvider.setDefaultOptions({
            duration: 400, // in milliseconds (ms), default 400,
            slowdownfactor: 4, // overlap views (higher number is more) or no overlap (1), default 4
            iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
            androiddelay: -1, // same as above but for Android, default -1
            winphonedelay: -1, // same as above but for Windows Phone, default -1,
            fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
            fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
            triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
            backInOppositeDirection: true // Takes over default back transition and state back transition to use the opposite direction transition to go back
        });

        $ionicNativeTransitionsProvider.setDefaultTransition({
            type: 'slide',
            direction: 'left'
        });
        $ionicNativeTransitionsProvider.setDefaultBackTransition({
            type: 'slide',
            direction: 'right'
        });

        //$ionicConfigProvider.views.maxCache(0);
        //$ionicConfigProvider.views.transition('none');

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js

        $stateProvider
            .state('tab.home', {
                url: '/home',
                nativeTransitions: null,
                // cache: false,
                views: {
                    'tab-home': {
                        templateUrl: 'templates/home.html',
                        controller: 'HomeCtrl'
                    }
                }
            })
            .state('tab.find', {
                url: '/find',
                nativeTransitions: null,
                // cache: false,
                views: {
                    'tab-find': {
                        templateUrl: 'templates/find.html',
                        controller: 'FindCtrl'
                    }
                }
            })
            .state('tab.me', {
                url: '/me',
                nativeTransitions: null,
                // cache: false,
                views: {
                    'tab-me': {
                        templateUrl: 'templates/me.html',
                        controller: 'MeCtrl'
                    }
                }
            })

            .state('tab', {
                url: '/tab',
                abstract: true,
                templateUrl: 'templates/tabs.html',
                controller: 'TabCtrl'
            })
            .state('photo_show', {
                url: '/photo_show/:goods_id/',
                templateUrl: 'templates/photo_show.html',
                controller: 'Photo_showCtrl'
            })
            .state('art_workshop', {
                url: '/art_workshop/:goods_id/',
                templateUrl: 'templates/art_workshop.html',
                controller: 'Art_workshopCtrl'
            })
            .state('goodsdetail', {
                url: '/goodsdetail/:goods_id/',
                templateUrl: 'templates/goodsdetail.html',
                controller: 'GoodsdetailCtrl'
            })
            .state('confirm_order', {
                url: '/confirm_order/:type/:id/',
                templateUrl: 'templates/order_confirm.html',
                controller: 'Confirm_orderCtrl'
            })
            .state('recharge', {
                url: '/recharge/:orderIds/:order_amount',
                templateUrl: 'templates/recharge.html',
                cache: false,
                controller:'RechargeCtrl'
            })
            .state('order_confirm', {
                url: '/order_confirm/:type/:id/:order_amounts/:pay_price/:size/:color/',
                cache: false,
                templateUrl: 'templates/order_confirm.html',
                controller: '0rder_confirmCtrl'
            })
            .state('wechat', {
                url:'/wechat/:goods_id',
                templateUrl:'templates/wechat.html',
                controller:'WechatCtrl'
            })
            .state('detail_message', {
                url: '/detail_message',
                templateUrl: 'templates/detail_message.html',
                controller: 'Detail_messageCtrl'
            })
            .state('shop_cart', {
                url: '/shop_cart',
                templateUrl: 'templates/shop_cart.html',
                controller: 'Shop_cartCtrl'
            })
            .state('mine_show', {
                url: '/mine_show',
                templateUrl: 'templates/mine_show.html',
                controller: 'Mine_showCtrl'
            })
            .state('mine_credit', {
                url: '/mine_credit',
                templateUrl: 'templates/mine_credit.html',
                controller: 'Mine_creditCtrl'
            })
            .state('stage', {
                url: '/stage',
                templateUrl: 'templates/stage.html',
                controller: 'StageCtrl'
            })
            .state('renew', {
                url: '/renew',
                templateUrl: 'templates/renew.html',
                controller: 'RenewCtrl'
            })
            .state('mine_service', {
                url: '/mine_service',
                templateUrl: 'templates/mine_service.html',
                controller: 'Mine_serviceCtrl'
            })
            .state('collection', {
                url: '/collection',
                templateUrl: 'templates/collection.html',
                controller: 'CollectionCtrl'
            })
            .state('mine_news', {
                url: '/mine_news',
                templateUrl: 'templates/mine_news.html',
                controller: 'Mine_newsCtrl'
            })
            .state('register', {
                url: '/register',
                templateUrl: 'templates/register.html',
                controller: 'RegisterCtrl'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            })
            .state('mine_order', {
                url: '/mine_order',
                templateUrl: 'templates/mine_order.html',
                controller: 'Mine_orderCtrl'
            })
            .state('order_detail', {
                url: '/order_detail',
                templateUrl: 'templates/order_detail.html',
                controller: 'Order_detailCtrl'
            })
            .state('advance_pay', {
                url: '/advance_pay',
                templateUrl: 'templates/advance_pay.html',
                controller: 'Advance_payCtrl'
            })
            .state('mine_data', {
                url: '/mine_data',
                templateUrl: 'templates/mine_data.html',
                controller: 'Mine_dataCtrl'
            })
            .state('select_stage', {
                url: '/select_stage',
                templateUrl: 'templates/select_stage.html',
                controller: 'Select_stageCtrl'
            })
            .state('stage_detail', {
                url: '/stage_detail',
                templateUrl: 'templates/stage_detail.html',
                controller: 'Stage_detailCtrl'
            })
            .state('credit_record', {
                url: '/credit_record',
                templateUrl: 'templates/credit_record.html',
                controller: 'Credit_recordCtrl'
            })
            .state('mine_check', {
                url: '/mine_check',
                templateUrl: 'templates/mine_check.html',
                controller: 'Mine_checkCtrl'
            })
            .state('confirm_stage', {
                url: '/confirm_stage',
                templateUrl: 'templates/confirm_stage.html',
                controller: 'Confirm_stageCtrl'
            })
            .state('replace_pay', {
                url: '/replace_pay',
                templateUrl: 'templates/replace_pay.html',
                controller: 'Replace_payCtrl'
            })
            .state('confirm_replace', {
                url: '/confirm_replace',
                templateUrl: 'templates/confirm_replace.html',
                controller: 'Confirm_replaceCtrl'
            })
            .state('mine_detail', {
                url: '/mine_detail',
                templateUrl: 'templates/mine_detail.html',
                controller: 'Mine_detailCtrl'
            })
            .state('personal_record', {
                url: '/personal_record',
                templateUrl: 'templates/personal_record.html',
                controller: 'Personal_recordCtrl'
            })
        ;
        // register the interceptor as a service
        $provide.factory('myHttpInterceptor', ['$rootScope','$cookies','$q','$location','$injector','$timeout','Constant','Util','StringUtil',
            function ($rootScope, $cookies, $q, $location, $injector, $timeout, Constant, Util, StringUtil) {
                return {
                    'request': function (config) {
                        if (config.url.indexOf('/' + Constant.BackendModule +'/') > -1) {//请求后台
                            if (!config.params) {
                                config.params = {};
                            }
                            config.params.pageSize = Constant.PageSize;
                            config.params.token = $rootScope.token;
                            config.params.store_id = $rootScope.store_id;
                            config.params.platform = $rootScope.platform_name;
                        }
                        return config || $q.when(config);
                    },
                    'requestError': function (rejection) {
                        return $q.reject(rejection);
                    },
                    'response': function (response) {
                        if (response.config.url.indexOf('/' + Constant.BackendModule +'/') > -1) {//请求后台
                            var code = response.data.login;
                            if (code === 0) {
                                if ($rootScope.modal) {
                                    $rootScope.modal.hide();
                                }
                                localStorage.removeItem('token');
                                $location.path("/login");
                            }
                            else {

                            }
                        }
                        return response;
                    },
                    'responseError': function (rejection) {
                        if ($rootScope.modal) {
                            $rootScope.modal.hide();
                        }
                        $injector.get('$ionicLoading').show({
                            template:'网络请求错误！',
                            duration: 1000,
                            noBackdrop: true
                        });
                        return $q.reject(rejection);
                    }
                };
            }]);
        $httpProvider.interceptors.push('myHttpInterceptor');

    });
