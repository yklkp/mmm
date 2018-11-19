'use strict';

angular.module('mobistore.controllers', [])
    /************************directive***************************/
    .controller('TabCtrl', ['$rootScope', '$scope', '$location', '$timeout', '$ionicHistory', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog',
        function ($rootScope, $scope, $location, $timeout, $ionicHistory, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog) {
        }])
    .controller('ClientCtrl', ['$rootScope', '$scope', '$location', '$timeout', '$ionicHistory', '$ionicPopup', '$cookies', 'Util', 'StringUtil', 'clientSrv', 'MyDialog',
        function ($rootScope, $scope, $location, $timeout, $ionicHistory, $ionicPopup, $cookies, Util, StringUtil, clientSrv, MyDialog) {
            var isWebView = ionic.Platform.isWebView();
            $scope.$on('$ionicView.enter', function (scopes, states) {
                // $ionicHistory.clearCache();
                clientSrv.isLogin();
            });
            $scope.loginUserName = localStorage.getItem('login_user_name');
            $scope.client = { username: $scope.loginUserName, password: $scope.loginUserPwd };
            $scope.client = angular.extend($scope.client, {
                //platform: platform,
                isWebView: isWebView,
                store_id: 1714
            });
            $scope.newClient = {};
            $scope.signon = function () {
                clientSrv.signon($scope.client);
            };
            $scope.toSignon = function () {
                $location.path('/signon');
            };
            $scope.toSignup = function () {
                $location.path('/signup');
            };
            $scope.toForget = function () {
                $location.path('/forget');
            };
            $scope.wxlogin = function () {
                MyDialog.showLoading();
                $timeout(function () {
                    Wechat.isInstalled(function (installed) {
                        MyDialog.hideLoading();
                        if (!installed) {
                            // MyDialog.tipTip("尚未安装微信");
                            return false
                        }
                        Wechat.auth("snsapi_userinfo", function (response) {
                            clientSrv.wxsigno(response);
                        }, function (reason) {
                            MyDialog.tipTip(reason);
                        });
                    }, function (reason) {
                        MyDialog.hideLoading();
                        // MyDialog.tipTip('Failed'+ reason);
                    });
                });
            };
        }])
    .controller('SignupCtrl', ['$rootScope', '$scope', '$state', '$location', '$interval', '$ionicHistory', '$ionicPopup', '$ionicNativeTransitions', 'Util', 'StringUtil', 'clientSrv', 'ClientOpt', 'Constant', 'MyDialog',
        function ($rootScope, $scope, $state, $location, $interval, $ionicHistory, $ionicPopup, $ionicNativeTransitions, Util, StringUtil, clientSrv, ClientOpt, Constant, MyDialog) {
            var platform = ionic.Platform.platform();
            var isWebView = ionic.Platform.isWebView();
            $scope.a = "mobilemember_register";
            $scope.o = "index";
            $scope.img_code = "";
            $scope.client = {};
            $scope.$on('$ionicView.enter', function (scopes, states) {
                ClientOpt.opt({ act: 'login', op: 'register_init', a: $scope.a, o: $scope.o }, function (json) {
                    if (json.datas.is_login !== 'N') {
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $rootScope.gotoPage("/tab/home");
                    }
                    else {
                        $scope.readonly = 0;
                        $scope.nchash = json.datas.nchash;
                        $scope.refreshValidateCode();
                    }
                });
                ClientOpt.opt({ act: 'login', op: 'area_list' }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.prov_list = json.datas.area_list;
                    }
                });
            });
            $scope.signup = function () {
                if (StringUtil.isEmpty($scope.client.mobile) || StringUtil.isEmpty($scope.client.password)
                    || StringUtil.isEmpty($scope.client.password_confirm)) {
                    $ionicPopup.alert({
                        title: '请填写手机号和密码!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                $scope.client.username = $scope.client.mobile;
                if ($scope.client.password != $scope.client.password_confirm) {
                    $ionicPopup.alert({
                        title: '两次密码不一致!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                if (StringUtil.isEmpty($scope.client.verify_code)) {
                    $ionicPopup.alert({
                        title: '验证码不能为空!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                $scope.client = angular.extend($scope.client, { platform: platform, isWebView: isWebView, nchash: $scope.nchash, verify_code: $scope.client.verify_code });
                clientSrv.signup($scope.client);
            };
            $scope.refreshValidateCode = function () {
                $scope.img_code = Constant.WebPath + "/shop/index.php?act=seccode&op=makecode&nchash=" + $scope.nchash + "&ttt=" + Math.random().toString(36).substr(2);
            };
            $scope.verifyCodeText = "获取手机验证码";
            $scope.timeInterval = 60;
            $scope.getVerifyCode = function () {
                ClientOpt.opt({
                    act: 'login', op: 'get_register_verify',
                    nchash: $scope.nchash,
                    captcha: $scope.client.img_code,
                    phone_num: $scope.client.mobile
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        var v = json.datas.error;
                        if (v === "-1") {
                            MyDialog.tip("验证码不正确");
                            $scope.client.img_code = "";
                            $scope.refreshValidateCode();
                        }
                        else if (v === "-2")
                            MyDialog.tip("手机号码不正确");
                        else if (v === "-3")
                            MyDialog.tip("短信验证码已经下发，请过5分钟后再操作");
                        else
                            MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.readonly = 1;
                        $scope.timer = $interval(function () {
                            if ($scope.timeInterval === 0) {
                                $scope.timeInterval = 60;
                                $scope.verifyCodeText = "获取手机验证码";
                                $interval.cancel($scope.timer);
                            }
                            else {
                                $scope.verifyCodeText = $scope.timeInterval + "s后重新获取";
                                $scope.timeInterval--;
                            }
                        }, 1000);
                    }
                });
            };
        }])
    .controller('ForgetPasswordCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicPopup', '$ionicNativeTransitions', '$interval', 'Util', 'StringUtil', 'clientSrv', 'ClientOpt', 'MyDialog', 'Constant',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicPopup, $ionicNativeTransitions, $interval, Util, StringUtil, clientSrv, ClientOpt, MyDialog, Constant) {
            var platform = ionic.Platform.platform();
            var isWebView = ionic.Platform.isWebView();
            $scope.a = "mobilemember_forgot";
            $scope.o = "index";
            $scope.img_code = "";
            $scope.client = {};
            $scope.$on('$ionicView.enter', function (scopes, states) {
                ClientOpt.opt({ act: 'login', op: 'forgot_init', a: $scope.a, o: $scope.o }, function (json) {
                    if (json.datas.is_login !== 'N') {
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $rootScope.gotoPage("/tab/home");
                    }
                    else {
                        $scope.readonly = 0;
                        $scope.nchash = json.datas.nchash;
                        $scope.refreshValidateCode();
                    }
                });
            });
            $scope.refreshValidateCode = function () {
                $scope.img_code = Constant.WebPath + "/shop/index.php?act=seccode&op=makecode&nchash=" + $scope.nchash + "&ttt=" + Math.random().toString(36).substr(2);;
            };
            $scope.verifyCodeText = "获取验证码";
            $scope.timeInterval = 60;
            $scope.getVerifyCode = function () {
                if (StringUtil.isEmpty($scope.client.mobile)) {
                    MyDialog.tip('请填写手机号码!');
                    return;
                }
                ClientOpt.opt({
                    act: 'login', op: 'get_forgot_verify',
                    nchash: $scope.nchash,
                    captcha: $scope.client.img_code,
                    phone_num: $scope.client.mobile
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        var v = json.datas.error;
                        if (v === "-1") {
                            MyDialog.tip("验证码不正确");
                            $scope.client.img_code = "";
                            $scope.refreshValidateCode();
                        }
                        else if (v === "-2")
                            MyDialog.tip("手机号码不正确");
                        else if (v === "-3")
                            MyDialog.tip("短信验证码已经下发，请过5分钟后再操作");
                        else
                            MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.readonly = 1;
                        $scope.timer = $interval(function () {
                            if ($scope.timeInterval === 0) {
                                $scope.timeInterval = 60;
                                $scope.verifyCodeText = "获取验证码";
                                $interval.cancel($scope.timer);
                            }
                            else {
                                $scope.verifyCodeText = $scope.timeInterval + "s后重新获取";
                                $scope.timeInterval--;
                            }
                        }, 1000);
                    }
                });
            };
            $scope.resetPassword = function () {
                if (StringUtil.isEmpty($scope.client.mobile) || StringUtil.isEmpty($scope.client.password)
                    || StringUtil.isEmpty($scope.client.repassword) || StringUtil.isEmpty($scope.client.verifyCode)) {
                    MyDialog.tip('请填写必要的信息!');
                    return;
                }
                if ($scope.client.password != $scope.client.repassword) {
                    MyDialog.tip('两次密码不一致!');
                    return;
                }
                angular.extend($scope.client, { platform: platform, isWebView: isWebView, nchash: $scope.nchash, verifyCode: $scope.client.verifyCode });
                clientSrv.resetPassword($scope.client);
            };
        }])
    // .controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
    //     function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
    //         $scope.$on('$ionicView.enter', function (scopes, states) {
    //             $scope.rootEle = $("#home[nav-view='active']");
    //             if ($scope.loaded) {
    //                 return;
    //             }
    //             $scope.loaded = true;
    //             $rootScope.shijiReload = false;
    //             $scope.init();
    //         });
    //         $scope.init = function () {
    //             $scope.getselectiongoods();
    //             var rootEle = $scope.rootEle;
    //             new Swiper('.swiper-container', {
    //                 spaceBetween: 30,
    //                 centeredSlides: true,
    //                 autoplay: {
    //                     delay: 2500,
    //                     disableOnInteraction: false
    //                 },
    //                 loop: true,
    //                 pagination: {
    //                     el: '.swiper-pagination',
    //                     clickable: true,
    //                     bulletActiveClass: 'my-bullet-active'
    //                 }
    //
    //             });
    //         };
    //         $scope.gotoGoods=function(goods_id){
    //             event.stopPropagation();
    //             $rootScope.gotoPage("/goods_detail/"+goods_id+"/");
    //         };
    //         $scope.getselectiongoods=function(){
    //             ClientOpt.opt({
    //                 act:  'goods',
    //                 op:  'get_selection_goods'
    //             }, function (json) {
    //                 $scope.selection_goods=json.datas.goods_list;
    //             });
    //         };
    //         $scope.goodsFinish_01=function(){
    //             $($scope.rootEle).find(".ho_box").scroll(function() {
    //                 var viewH =$(this).height();//可见高度
    //                 var contentH =$(this).get(0).scrollHeight;//内容高度
    //                 var scrollTop = $(this).scrollTop();//滚动高度
    //                 if(contentH - viewH - scrollTop <= 0) {
    //                     $scope.mySwiper.slideTo(2, 700, false);
    //                     $scope.data.curTab=2;
    //                     $scope.$apply();
    //                 }
    //             });
    //         };
    //     }])
    .controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate) {
            $scope.yx_curpage = 0;
            $scope.s_curpage = 0;
            $scope.z_curpage = 0;
            $scope.r_curpage = 0;
            $scope.data = { curTab: 0 };
            $scope.instance = {};
            $scope.is_refresh = 1;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#home[nav-view='active']");
                $rootScope.get_yorder_num();
                //广告
                // if (!$scope.adRoaded){
                //     $scope.adRoaded = true;
                //     $($scope.rootEle).find("#guanggao_x").unbind().click(function () {
                //         $($scope.rootEle).find("#guanggao").hide();
                //     });
                //     ClientOpt.opt({act:'store', op:'get_guangao'}, function (json) {
                //         if (!StringUtil.isEmpty(json.datas.error)) {
                //             MyDialog.tip(json.datas.error);
                //         }
                //         else {
                //             $scope.ad = json.datas.ad;
                //             $scope.count = json.datas.count;
                //             if (!StringUtil.isEmpty($scope.ad.image)&&$scope.count==0) {
                //                 $($scope.rootEle).find("#guanggao").show();
                //                 if ($scope.ad.auto_close == 0) {
                //                     $timeout(function () {
                //                         $($scope.rootEle).find("#guanggao").hide();
                //                     }, parseInt($scope.ad.auto_time) * 1000);
                //                 }
                //             }
                //         }
                //     });
                // }
                // else{
                //     $($scope.rootEle).find("#guanggao").hide();
                // }
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });
            $scope.doRefresh = function () {
                if ($scope.data.curTab == 0) {
                    $scope.yx_curpage = 0;
                    $scope.getmodule();
                }
                else if ($scope.data.curTab == 1) {
                    $scope.s_curpage = 0;
                    $scope.getselection();
                    $scope.getselectiongoods();
                    $scope.getrecbrandlist();
                }
                else if ($scope.data.curTab == 2) {
                    $scope.z_curpage = 0;
                    $scope.getrecspecial();
                    $scope.getspecial();
                }
                else if ($scope.data.curTab == 3) {
                    $scope.r_curpage = 0;
                    $scope.getrecrare();
                    $scope.getraregoods();
                    $scope.getrare();
                }
                $scope.$broadcast('scroll.refreshComplete');
            }
            $scope.init = function () {
                $scope.getmodule();
                $scope.getselection();
                $scope.getselectiongoods();
                $scope.getrecbrandlist();
                $scope.getrecspecial();
                $scope.getspecial();
                $scope.getrecrare();
                //$scope.getraregoods();
                $scope.getrare();
                $scope.mySwiper = new Swiper('#btn11', {
                    initialSlide: 0,
                    onTransitionStart: function (swiper) {
                        $scope.data.curTab = swiper.activeIndex;
                        $($scope.rootEle).find(".back_top").slideUp(100);
                        $scope.$apply();
                    }
                })
                $($scope.rootEle).find(".back_top").click(function () {
                    $($scope.thisDiv).scrollTop(0);
                })
                $($scope.rootEle).find(".esb_01,.esb_02,.esb_03").scroll(function () {
                    $scope.thisDiv = this;
                    var scrollTop = $(this).scrollTop();
                    if (scrollTop < 10) {
                        $scope.is_refresh = 1;
                    } else {
                        $scope.is_refresh = 0;
                    }
                    $scope.$apply();
                    if (scrollTop < 1500) {
                        $($scope.rootEle).find(".back_top").slideUp(100);
                    } else {
                        $($scope.rootEle).find(".back_top").slideDown(100);
                    }
                })
                $($scope.rootEle).find(".esb").scroll(function () {
                    $scope.thisDiv = this;
                    var viewH = $(this).height();
                    var contentH = $(this).get(0).scrollHeight;
                    var scrollTop = $(this).scrollTop();
                    if (scrollTop < 10) {
                        $scope.is_refresh = 1;
                    } else {
                        $scope.is_refresh = 0;
                    }
                    $scope.$apply();
                    if (scrollTop < 600) {
                        $($scope.rootEle).find(".back_top").slideUp(100);
                    } else {
                        $($scope.rootEle).find(".back_top").slideDown(100);
                    }
                    if (contentH - viewH - scrollTop <= 10 && $scope.yx_hasmore) {
                        $scope.goods_more();
                    }
                })
            }
            $scope.showli = function (ss) {
                $scope.mySwiper.slideTo(ss, 700, false);
                $scope.data.curTab = ss;
                $($scope.rootEle).find(".back_top").slideUp(100);

            }
            $scope.zhenxuantjFinish = function () {
                new Swiper('#zhenxuan_tj', {
                    slidesPerView: 2,
                    slidesPerColumn: 2,
                    paginationClickable: true,
                    spaceBetween: 10
                });
            }
            $scope.getmodule = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_module'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.module_list = json.datas.module_list;
                        $.each($scope.module_list, function (i, item) {
                            if (item.id == 1 && item.status == 1) {
                                $scope.lunbo = true;
                                $scope.loadlunbo();
                            }
                            else if (item.id == 2 && item.status == 1) {
                                $scope.guanggao = true;
                                $scope.loadlguanggao();
                            }
                            else if (item.id == 3 && item.status == 1) {
                                $scope.xinping = true;
                                $scope.loadxinping();
                            }
                            else if (item.id == 4 && item.status == 1) {
                                $scope.shiping = true;
                                $scope.loadshiping();
                            }
                            else if (item.id == 5 && item.status == 1) {
                                $scope.jianren = true;
                                $scope.loadjianren();
                            }
                            else if (item.id == 6 && item.status == 1) {
                                $scope.youxuan = true;
                                $scope.loadyouxuan();
                            }
                            else if (item.id == 7 && item.status == 1) {
                                $scope.tehui = true;
                                $scope.loadtehui();
                            }
                            else if (item.id == 8 && item.status == 1) {
                                $scope.tuiguang = true;
                                $scope.tuiguanglist();
                            }
                            else if (item.id == 9 && item.status == 1) {
                                $scope.season = true;
                                $scope.seasoninfo();
                            }
                            else if (item.id == 10 && item.status == 1) {
                                $scope.class = true;
                                $scope.classlist();
                            }
                            else if (item.id == 11 && item.status == 1) {
                                $scope.private = true;
                                $scope.privatelist();
                            }
                        });
                    }
                });
            }
            $scope.gotoGoods = function (goods_id) {
                event.stopPropagation();
                $rootScope.gotoPage("/goods_detail/" + goods_id + "/");
            }
            $scope.getselection = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_selection',
                    curpage: $scope.s_curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.s_curpage == 0) {
                            $scope.selection_list = json.datas.list;
                        }
                        else {
                            $.each(json.datas.list, function (i, item) {
                                $scope.selection_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.s_hasmore = json.hasmore;
                    }
                });
            }
            $scope.smore = function () {
                $scope.s_curpage++;
                $scope.getselection();
            }
            $scope.getselectiongoods = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'get_selection_goods'
                }, function (json) {
                    $scope.selection_goods = json.datas.goods_list;
                });
            }
            $scope.getrecbrandlist = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_brand_list',
                    type: 'recommend'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.recommend_brand_list = json.datas.list;
                    }
                });
            }
            $scope.getrecspecial = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_special',
                    type: 'recommend',
                    curpage: $scope.z_curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.z_curpage == 0) {
                            $scope.rec_special_list = json.datas.list;
                        }
                        else {
                            $.each(json.datas.list, function (i, item) {
                                $scope.rec_special_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.z_hasmore = json.hasmore;
                    }
                });
            }
            $scope.zmore = function () {
                $scope.z_curpage++;
                $scope.getrecspecial();
            }
            $scope.getspecial = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_special'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.special_list = json.datas.list;
                    }
                });
            }
            $scope.getrecrare = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_rare',
                    type: 'recommend',
                    curpage: $scope.r_curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.r_curpage == 0) {
                            $scope.rec_rare_list = json.datas.list;
                        }
                        else {
                            $.each(json.datas.list, function (i, item) {
                                $scope.rec_rare_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.r_hasmore = json.hasmore;
                    }
                });
            }
            $scope.rmore = function () {
                $scope.r_curpage++;
                $scope.getrecrare();
            }
            // $scope.getraregoods=function(){
            //     ClientOpt.opt({
            //         act:  'goods',
            //         op:  'get_rare_goods'
            //     }, function (json) {
            //         $scope.rare_goods=json.datas.goods_list;
            //     });
            // }
            $scope.getrare = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_rare'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.rare_list = json.datas.list;
                    }
                });
            }
            $scope.loadlunbo = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_lunbo_list'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.lunbo_list = json.datas.lunbo_list;
                    }
                });
            }
            $scope.lunboFinish = function () {
                new Swiper('#home_lunbo', {
                    pagination: '#home_lunbo_pagination',
                    observer: true,
                    autoplay: 3000,
                    observeParents: true
                });
            }
            $scope.tuiguanglist = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_tuiguang'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.tuiguang_list = json.datas.tuiguang;
                    }
                });
            }
            $scope.tuiguangFinish = function () {
                new Swiper('#tuiguang_lunbo', {
                    pagination: '#tuiguang_lunbo_pagination',
                    observer: true,
                    autoplay: 3000,
                    observeParents: true
                });
            }
            $scope.loadlguanggao = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_guanggao_list'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.guanggao_list = json.datas.guanggao_list;
                    }
                });
            }
            $scope.seasoninfo = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_season'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.season_info = json.datas.season;
                    }
                });
            }
            $scope.privatelist = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_private_list'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.private_title = json.datas.private_title;
                        $scope.private_list = json.datas.private_list;
                    }
                });
            }
            $scope.home_share = function () {
                new Swiper('.home_share', {
                    slidesPerView: 2,
                    slidesPerColumn: 1,
                    paginationClickable: true,
                    spaceBetween: 10
                });
            }
            $scope.classlist = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_class_list'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.class_list = json.datas.class_list;
                    }
                });
            }
            $scope.loadxinping = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_xinping'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.xinping = json.datas.xinping;
                    }
                });
            };
            $scope.xinpingFinish = function () {
                new Swiper('#home_xinping', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });
            }
            $scope.loadshiping = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_shiping'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.shiping = json.datas.shiping;
                    }
                });
            };
            $scope.shipingFinish = function () {
                new Swiper('.home_shiping', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });
            }
            $scope.loadjianren = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_jianren_list'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.jianren = json.datas.jianren;
                    }
                });
            }
            $scope.jianrenFinish = function () {
                new Swiper('#home_jianren', {
                    slidesPerView: 'auto',
                    centeredSlides: true,
                    initialSlide: 1,
                    spaceBetween: 20
                });
            }
            $scope.loadyouxuan = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_yx_title'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.yx_title = json.datas.title;
                    }
                });
                switch (parseInt(10 * Math.random())) {
                    case 0:
                        $scope.order_by = "goods_id desc";
                        break;
                    case 1:
                        $scope.order_by = "goods_name desc";
                        break;
                    case 2:
                        $scope.order_by = "goods_click desc";
                        break;
                    case 3:
                        $scope.order_by = "gc_id_3 desc";
                        break;
                    case 4:
                        $scope.order_by = "goods_price desc";
                        break;
                    case 5:
                        $scope.order_by = "vendor_id desc";
                        break;
                    case 6:
                        $scope.order_by = "inner_sn desc";
                        break;
                    case 7:
                        $scope.order_by = "goods_image desc";
                        break;
                    case 8:
                        $scope.order_by = "cross_sn desc";
                    case 9:
                        $scope.order_by = "goods_click desc";
                        break;
                }
                $scope.goodslist();
            }
            $scope.goodslist = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'goods_list',
                    group: "gc_id_3",
                    order_by: $scope.order_by,
                    curpage: $scope.yx_curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.yx_curpage == 0) {
                            $scope.goods_list = json.datas.goods_list;
                        }
                        else {
                            $.each(json.datas.goods_list, function (i, item) {
                                $scope.goods_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.yx_hasmore = json.hasmore;
                    }
                });
            }
            $scope.goods_more = function () {
                $scope.yx_curpage++;
                $scope.goodslist();
            }
            $scope.goodsFinish = function () {
                $($scope.rootEle).find(".esb").scroll(function () {
                    var viewH = $(this).height();//可见高度
                    var contentH = $(this).get(0).scrollHeight;//内容高度
                    var scrollTop = $(this).scrollTop();//滚动高度
                    if (contentH - viewH - scrollTop <= 0 && !$scope.yx_hasmore) {
                        $scope.mySwiper.slideTo(1, 700, false);
                        $scope.data.curTab = 1;
                        $scope.$apply();
                    }
                })
            }
            $scope.goodsFinish_01 = function () {
                $($scope.rootEle).find(".esb_01").scroll(function () {
                    var viewH = $(this).height();//可见高度
                    var contentH = $(this).get(0).scrollHeight;//内容高度
                    var scrollTop = $(this).scrollTop();//滚动高度
                    if (contentH - viewH - scrollTop <= 0) {
                        $scope.mySwiper.slideTo(2, 700, false);
                        $scope.data.curTab = 2;
                        $scope.$apply();
                    }
                })
            }
            $scope.goodsFinish_02 = function () {
                $($scope.rootEle).find(".esb_02").scroll(function () {
                    var viewH = $(this).height();//可见高度
                    var contentH = $(this).get(0).scrollHeight;//内容高度
                    var scrollTop = $(this).scrollTop();//滚动高度
                    if (contentH - viewH - scrollTop <= 0) {
                        $scope.mySwiper.slideTo(3, 700, false);
                        $scope.data.curTab = 3;
                        $scope.$apply();
                    }
                })
            }
            $scope.loadtehui = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_tehui'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.tehui = json.datas.tehui;
                    }
                });
            }
            $scope.follow = function (member_id) {
                $rootScope.isLogin(function () {
                    ClientOpt.opt({
                        act: 'goods',
                        op: 'save_follow_member',
                        member_id: member_id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $rootScope.mineReload = true;
                            MyDialog.tip("关注成功！");
                        }
                    });
                }, true);
            }
            $scope.gotoclass = function (gc_name) {
                event.stopPropagation();
                $rootScope.gc_name = gc_name;
                $rootScope.from_class = true;
                $rootScope.gotoPage('/tab/storelist_up');
            }
        }])
    .controller('FindCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#find[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

                var box = $(rootEle).find("#box");
                var items = box.children();
                var gap = 3;
                setTimeout(function () {
                    var itemWidth = 49;
                    var columns = 2;
                    var arr = [];
                    for (var i = 0; i < items.length; i++) {
                        if (i < columns) {
                            items[i].style.top = 0;
                            items[i].style.left = (itemWidth + gap) * i + '%';
                            arr.push(items[i].offsetHeight);
                        }
                        else {
                            var minHeight = arr[0];
                            var index = 0;
                            for (var j = 0; j < arr.length; j++) {
                                if (minHeight > arr[j]) {
                                    minHeight = arr[j];
                                    index = j;
                                }
                            }
                            items[i].style.top = arr[index] + 26 + 'px';
                            items[i].style.left = items[index].offsetLeft + 'px';
                            arr[index] = arr[index] + items[i].offsetHeight + 26;
                        }
                    }
                }, 5000)

                $(rootEle).find(".fx_title").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".fx_wrapper").eq(index).show().siblings('.fx_wrapper').hide(0);
                    $(rootEle).find(".fx_title").eq(index).addClass("fx_curr").siblings(".fx_title").removeClass("fx_curr");
                })
            }
        }])
    .controller('MeCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'JpushService', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, JpushService, StringUtil) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded && !$rootScope.mineReload) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.mineReload = false;
                $scope.is_login = 0;
                $rootScope.ismeLogin(function () {
                    $scope.init();
                });
            });
            $scope.init = function () {
                $scope.is_login = 1;
                ClientOpt.opt({ act: 'setting', op: 'index' }, function (json) {
                    //console.log(json);
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.info = json.datas.customer_info;
                        $rootScope.member_mobile = $scope.info.member_mobile;
                        $scope.share = json.datas.share;
                        $scope.collect = json.datas.collect;
                        $scope.follow = json.datas.follow;
                        //$scope.fans = json.datas.fans;
                        $scope.dzf = json.datas.dzf;
                        //$scope.dfh = json.datas.dfh;
                        $scope.dsh = json.datas.dsh;
                        //$scope.dpj = json.datas.dpj;
                        $scope.all = json.datas.all;
                    }
                });
            };
            $scope.logout = function () {
                MyDialog.confirm("退出提示", "确定要注销登录吗？", "确定了", "不了", function () {
                    ClientOpt.opt({ act: 'setting', op: 'logout' }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.error(json.datas.error);
                        }
                        else {
                            localStorage.removeItem('token');
                            localStorage.removeItem('rongcloud_token');
                            $rootScope.rongcloud_token = null;
                            JpushService.clearAlias();
                            JpushService.clearTags();
                            $ionicHistory.clearCache();
                            MyDialog.tip("成功退出！");
                            $rootScope.gobackPage("/tab/home");
                            $rootScope.mineReload = true;
                        }
                    });
                });
            };

        }])
    .controller('Photo_showCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#photo_show[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $scope.loadgoodsdetail();
            };
            $scope.loadgoodsdetail = function () {
                var url = $location.url().split("/");
                //console.log(url);
                $scope.goods_id = url[2];
                console.log($scope.goods_id);
                ClientOpt.opt({
                    act: 'goods',
                    op: 'goods_detail',
                    goods_id: $scope.goods_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        console.log(json);
                        $scope.goods_info = json.datas.goods_info;
                        $scope.goods_price = json.datas.goods_info.goods_price;
                        if ($scope.goods_pay_price > 0) {
                            $scope.goods_info.goods_pay_price = $scope.goods_pay_price;
                            $scope.isSelect = true;
                            $scope.tehui = true;
                        }
                    }
                });
            };
        }])
    .controller('Art_workshopCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#art_workshop[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                $scope.loadgoodsdetail();
                var rootEle = $scope.rootEle;
                $(rootEle).find(".aw_nav_list li").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".aw_c_list").eq(index).show().siblings('.aw_c_list').hide(0);
                    $(rootEle).find(".aw_title").eq(index).addClass("aw_curr").siblings(".aw_title").removeClass("aw_curr");
                })
            };
            $scope.loadgoodsdetail = function () {
                var url = $location.url().split("/");
                $scope.goods_id = url[2];
                ClientOpt.opt({
                    act: 'goods',
                    op: 'goods_detail',
                    goods_id: $scope.goods_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.goods_info = json.datas.goods_info;
                        $scope.goods_price = json.datas.goods_info.goods_price;
                        if ($scope.goods_pay_price > 0) {
                            $scope.goods_info.goods_pay_price = $scope.goods_pay_price;
                            $scope.isSelect = true;
                            $scope.tehui = true;
                        }
                    }
                });
            };
        }])
    .controller('GoodsdetailCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant) {
            $scope.goods_id = $state.params.goods_id;
            $scope.goods_price = $state.params.goods_price;
            $scope.getLocalTime = Util.getLocalTime;
            $scope.selectSpecText = "请选择商品规格";
            $scope.isSelect = false;
            $scope.select_spec = [];
            $scope.is_refresh = 1;
            $scope.tehui = false;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#goodsdetail[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });
            $scope.doRefresh = function () {
                $scope.init();
                $scope.$broadcast('scroll.refreshComplete');
            };
            $scope.loadgoodsdetail = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'goods_detail',
                    goods_id: $scope.goods_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.goods_info = json.datas.goods_info;
                        $scope.goods_price = json.datas.goods_info.goods_price;
                        if ($scope.goods_pay_price > 0) {
                            $scope.goods_info.goods_pay_price = $scope.goods_pay_price;
                            $scope.isSelect = true;
                            $scope.tehui = true;
                        }
                    }
                });
            };
            $scope.gotobuy = function () {
                $rootScope.isLogin(function () {
                    var order_amounts = $($scope.rootEle).find(".buy_num").text();
                    var pay_price = $($scope.rootEle).find(".ge_n_price").text();
                    // var size =$($scope.rootEle).find(".buy_num").text();
                    // var color =$($scope.rootEle).find(".buy_num").text();
                    var size = 'L';
                    var color = "黑色";
                    if ($scope.tehui) {
                        if ($scope.goods_info.is_buy == 1) {
                            //$rootScope.gotoPage('/order_confirm/3/'+$scope.goods_info.goods_id+'/'+$scope.goods_pay_price);
                            $rootScope.gotoPage('/order_confirm/3/' + $scope.goods_info.goods_id + '/');
                        }
                        else {
                            MyDialog.tip("没有达到指定会员等级");
                        }
                    }
                    else {
                        if ($scope.goods_info.spec_group) {
                            $scope.tobuy(1);
                            $scope.buy_type = 2;
                            $rootScope.gotoPage('/order_confirm/2/' + $scope.goods_info.goods_id + '/' + order_amounts + '/' + pay_price + '/' + size + '/' + color + '/');
                        }
                        else {
                            $rootScope.gotoPage('/order_confirm/2/' + $scope.goods_info.goods_id + '/' + order_amounts + '/' + pay_price + '/' + size + '/' + color + '/');
                        }
                    }
                }, true);
            };
            $scope.ontouch = function () {
                $scope.startTime = Date.parse(new Date());
            };
            $scope.onrelease = function () {
                $scope.endTime = Date.parse(new Date());
                if ($scope.endTime - $scope.startTime > 2000 && $scope.goods_info.is_buy == 1 && !$scope.tehui) {
                    event.stopPropagation();
                    $rootScope.isLogin(function () {
                        if ($scope.goods_info.spec_group) {
                            $scope.tobuy(1);
                            $scope.buy_type = 3;
                        }
                        else {
                            $rootScope.gotoPage('/order_confirm/3/' + $scope.goods_info.goods_id + '/');
                        }
                    }, true);
                }
            };
            $scope.move2car = function () {
                $rootScope.isLogin(function () {
                    $scope.buy_type = 1;
                    if ($scope.goods_info.spec_group) {
                        $scope.tobuy(1);
                    }
                    else {
                        $scope.isSelect = true;
                        $scope.sure_tobuy();
                    }
                }, true);
            };
            $scope.sure_tobuy = function () {
                $scope.tobuy(0);
                if ($scope.buy_type == 1 && $scope.isSelect) {
                    ClientOpt.opt({
                        act: 'jieorder',
                        op: 'addGoodsToYorder',
                        goods_id: $scope.goods_info.goods_id,
                        goods_pay_price: $scope.goods_info.goods_pay_price,
                        to_status: 1
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $rootScope.get_yorder_num();
                            MyDialog.tip("加入购物车成功！");
                        }
                    });
                }
                else if ($scope.buy_type == 2 && $scope.isSelect) {
                    $rootScope.gotoPage('/order_confirm/2/' + $scope.goods_info.goods_id + '/');
                }
                else if ($scope.buy_type == 3 && $scope.isSelect) {
                    $rootScope.gotoPage('/order_confirm/3/' + $scope.goods_info.goods_id + '/');
                }
            };
            $scope.toMainBigPic = function (pos, div) {
                var rootEle = $scope.rootEle;
                var pswpElement = $(rootEle).find('.pswp').get(0);
                var items = [];
                var getItems = function () {
                    var aDiv = $(rootEle).find("#" + div);
                    for (var i = 0; i < aDiv.find("img").length; i++) {
                        var img = aDiv.find("img");
                        var item = {
                            src: img[i].src,
                            w: img[i].naturalWidth,
                            h: img[i].naturalHeight
                        };
                        items.push(item);
                    }
                };
                getItems();
                // define options (if needed)
                var options = {
                    // history & focus options are disabled on CodePen
                    history: false,
                    focus: false,
                    index: pos,
                    showAnimationDuration: 0,
                    hideAnimationDuration: 0
                };
                var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
                gallery.init();
            };
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $scope.loadgoodsdetail();
                $(rootEle).find(".addb").scroll(function () {
                    $scope.thisDiv = this;
                    var scrollTop = $(this).scrollTop();
                    if (scrollTop < 10) {
                        $scope.is_refresh = 1;
                    } else {
                        $scope.is_refresh = 0;
                    }
                    $scope.$apply();
                    if (scrollTop < 44) {
                        $(rootEle).find(".hua_toggle").slideDown(100);
                    } else {
                        $(rootEle).find(".hua_toggle").slideUp(100);
                    }
                    if (scrollTop < 600) {
                        $(rootEle).find(".back_top").slideUp(100);
                    } else {
                        $(rootEle).find(".back_top").slideDown(100);
                    }
                })
                $(rootEle).find(".addc").scroll(function () {
                    $scope.thisDiv = this;
                    var scrollTop = $(this).scrollTop();
                    if (scrollTop < 10) {
                        $scope.is_refresh = 1;
                    } else {
                        $scope.is_refresh = 0;
                    }
                    $scope.$apply();
                    if (scrollTop < 600) {
                        $(rootEle).find(".back_top").slideUp(100);
                    } else {
                        $(rootEle).find(".back_top").slideDown(100);
                    }
                })
                $(rootEle).find(".back_top").click(function () {
                    $($scope.thisDiv).scrollTop(0);
                })
            };
            //弹窗选择规格确认购买
            $scope.hshow = function () {
                $($scope.rootEle).find(".ge_hei_box").addClass("hshow");
                $($scope.rootEle).find(".buy_num").text(1);
                $($scope.rootEle).find(".ge_n_price").text($scope.goods_price);
            };
            $scope.hhide = function () {
                $($scope.rootEle).find(".ge_hei_box").removeClass("hshow");
            };
            $scope.csize = false;
            $scope.ccolor=false;
            $scope.s_size = function () {
                if ($scope.csize)
                    $scope.csize = false;
                else
                    $scope.csize = true;
            }
            $scope.s_color = function () {
                if ($scope.ccolor)
                    $scope.ccolor = false;
                else
                    $scope.ccolor = true;
            }
            $scope.addnum = function (goods_price) {
                console.log(goods_price);
                var goods_num = $($scope.rootEle).find(".buy_num").text();
                $($scope.rootEle).find(".buy_num").text(parseInt(goods_num) + 1);
                var order_amount = (parseInt(goods_num) + 1) * parseFloat(goods_price);
                $($scope.rootEle).find(".ge_n_price").text(parseFloat(order_amount));
                //$scope.loadcouponlist($scope.order_amount);
            };
            $scope.reducenum = function (goods_price) {
                var goods_num = $($scope.rootEle).find(".buy_num").text();
                if (parseInt(goods_num) <= 1) {
                    return false;
                }
                $($scope.rootEle).find(".buy_num").text(parseInt(goods_num) - 1);
                var order_amount = (parseInt(goods_num) - 1) * parseFloat(goods_price);
                $($scope.rootEle).find(".ge_n_price").text('￥' + parseFloat(order_amount));
            };
            $scope.loadcouponlist = function (order_amount) {
                $scope.so_order_amount = order_amount;
                ClientOpt.opt({
                    act: 'setting',
                    op: 'get_coupon_list',
                    type: 1,
                    order_amount: order_amount
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        // $scope.coupon_list=json.datas.coupon_list;
                        // $scope.coupon_id='';
                        // if($scope.coupon_list.length>0){
                        //     $scope.couponText=$scope.coupon_list.length+"  张优惠卷可用";
                        // }
                        // else{
                        //     $scope.couponText="没有优惠卷可用";
                        // }
                        $scope.couponText = "没有优惠卷可用";
                    }
                });
            };
            $scope.share = function () {
                $rootScope.isLogin(function () {
                    $scope.init();
                    $($scope.rootEle).find("#share").removeClass("hide");
                }, true);
            };
            $scope.share_x = function () {
                $($scope.rootEle).find("#share").addClass("hide");
            };
            $scope.sharewx = function (type) {
                $scope.share_x();
                var t = parseInt(type);
                Wechat.isInstalled(function (installed) {
                    if (!installed) {
                        MyDialog.tip("尚未安装微信");
                        return false
                    }
                }, function (reason) {
                    MyDialog.tip('Failed' + reason);
                });
                Wechat.share({
                    message: {
                        title: $scope.goods_info.goods_name,
                        description: $scope.goods_info.goods_jingle,
                        thumb: $scope.goods_info.thumb,
                        media: {
                            type: Wechat.Type.WEBPAGE,
                            webpageUrl: "http://mall.apin.com.cn/weixinb/index.php?act=goods&op=goods&store_id=" + $scope.goods_info.store_id + "&goods_id=" + $scope.goods_id + "&cross_sn=" + $scope.goods_info.cross_sn
                        }
                    },
                    scene: t
                }, function () {
                    MyDialog.tip("分享成功");
                    $($scope.rootEle).find("#share").addClass("hide");
                }, function (reason) {
                    MyDialog.tip("分享失败: " + reason);
                    $($scope.rootEle).find("#share").addClass("hide");
                });
            };
            //Zhen.Liu
            $scope.poster = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'createQRCode',
                    goods_id: $scope.goods_id,
                    goods_name: $scope.goods_info.goods_name,
                    goods_image: $scope.goods_info.goodsImages[0],
                    goods_price: $scope.goods_info.goods_price,
                    cross_sn: $scope.goods_info.cross_sn
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if (!StringUtil.isEmpty(json.datas.qrcodeUrl)) {
                            Wechat.isInstalled(function (installed) {
                                if (!installed) {
                                    MyDialog.tip("尚未安装微信");
                                    return false
                                }
                            }, function (reason) {
                                MyDialog.tip('Failed' + reason);
                            });
                            Wechat.share({
                                message: {
                                    title: "天成联盟",
                                    description: $scope.goods_info.goods_name,
                                    thumb: $scope.goods_info.thumb,
                                    media: {
                                        type: Wechat.Type.IMAGE,
                                        image: json.datas.qrcodeUrl
                                    }
                                },
                                scene: Wechat.Scene.SESSION
                            }, function () {
                                MyDialog.tip("分享成功");
                                $($scope.rootEle).find("#share").addClass("hide");
                            }, function (reason) {
                                MyDialog.tip("分享失败: " + reason);
                                $($scope.rootEle).find("#share").addClass("hide");
                            });
                        }
                    }
                });
            };
            //Zhen.Liu
            //$scope.shareqq = function(type) {
            //    $scope.share_x();
            //    QQSDK.checkClientInstalled(
            //        function () {
            //            var args = {};
            //            args.client = QQSDK.ClientType.QQ;
            //            if(type==0){
            //                args.scene = QQSDK.Scene.QQ;
            //            }
            //            else{
            //                args.scene = QQSDK.Scene.QQZone;
            //            }
            //            args.url = "http://mall.apin.com.cn/weixinb/index.php?act=goods&op=goods&store_id="+$scope.goods_info.store_id+"&goods_id="+$scope.goods_id+"&cross_sn="+$scope.goods_info.cross_sn;
            //            args.title = "天成联盟";
            //            args.description = $scope.goods_info.goods_name;
            //            args.image = $scope.goods_info.thumb;
            //            QQSDK.shareNews(
            //                function () {
            //                    MyDialog.tip("分享成功");
            //                },
            //                function (reason) {
            //                    MyDialog.tip("分享失败: " + reason);
            //                }, args);
            //        },
            //        function () {
            //            MyDialog.tip("尚未安装腾讯QQ");
            //            return false;
            //        }
            //    );
            //}
            //$scope.sharewb = function() {
            //    $scope.share_x();
            //    WeiboSDK.checkClientInstalled(
            //        function () {
            //            var args = {};
            //            args.url = "http://mall.apin.com.cn/weixinb/index.php?act=goods&op=goods&store_id="+$scope.goods_info.store_id+"&goods_id="+$scope.goods_id+"&cross_sn="+$scope.goods_info.cross_sn;
            //            args.title = "天成联盟";
            //            args.description = $scope.goods_info.goods_name;
            //            args.image = $scope.goods_info.thumb;
            //            WeiboSDK.shareToWeibo(
            //                function () {
            //                    MyDialog.tip("分享成功");
            //                },
            //                function (reason) {
            //                    MyDialog.tip("分享失败: " + reason);
            //                }, args);
            //        },
            //        function () {
            //            MyDialog.tip("尚未安装新浪微博");
            //            return false;
            //        }
            //    );
            //}
            $scope.collect = function () {
                $rootScope.isLogin(function () {
                    ClientOpt.opt({
                        act: 'goods',
                        op: 'save_follow_goods',
                        goods_id: $scope.goods_info.goods_id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $scope.goods_info.is_follow = json.datas.is_follow;
                            MyDialog.tip(json.datas.msg);
                        }
                    });
                }, true);
            };
            $scope.follow = function () {
                $rootScope.isLogin(function () {
                    ClientOpt.opt({
                        act: 'goods',
                        op: 'save_follow_member',
                        member_id: $scope.goods_info.member_id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);

                        }
                        else {
                            $rootScope.mineReload = true;
                            MyDialog.tip("关注成功！");
                        }
                    });
                }, true);
            };
            $scope.goly = function () {
                $($scope.rootEle).find('#message').val("");
                $($scope.rootEle).find('#buy').hide();
                $($scope.rootEle).find('#ly').show();
            };
            $scope.hidely = function () {
                $($scope.rootEle).find('#ly').hide();
                $($scope.rootEle).find('#buy').show();
            };
            $scope.sendmessage = function () {
                $($scope.rootEle).find('#ly').hide();
                $($scope.rootEle).find('#buy').show();
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'saveMessage',
                    goods_id: $scope.goods_id,
                    message: $($scope.rootEle).find('#message').val()
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        MyDialog.tip("留言成功！");
                    }
                });
            };
            $scope.tobuy = function (a) {
                if (a == 0) {
                    $($scope.rootEle).find('.tobuy').hide();
                } else {
                    $($scope.rootEle).find('.tobuy').show();
                }
            };
            $scope.canshu = function (a) {
                if (a == 0) {
                    $($scope.rootEle).find('.canshu').hide();
                } else {
                    $($scope.rootEle).find('.canshu').show();
                }
            };
            $scope.hua_toggle = function () {
                $($scope.rootEle).find('.hua_toggle').hide();
            };
            $scope.toggle_detail = function (d) {
                var rootEle = $scope.rootEle;
                $(rootEle).find(".back_top").hide();
                if (d == 0) {
                    $(rootEle).find('.hz_contaner.cur .hz_menu_list li').removeClass("cur");
                    $(rootEle).find('.hz_contaner.cur .hz_menu_list li').eq(0).addClass("cur");
                    $(rootEle).find(".addb").show();
                    $(rootEle).find(".addc").hide();
                    $(rootEle).find('.footer').show();
                } else {
                    $(rootEle).find('.footer').hide();
                    $(rootEle).find('.hua_toggle').hide();
                    $(rootEle).find('.hz_contaner.cur .hz_menu_list li').removeClass("cur");
                    $(rootEle).find('.hz_contaner.cur .hz_menu_list li').eq(1).addClass("cur");
                    $(rootEle).find(".addb").hide();
                    $(rootEle).find(".addc").show();
                }
            };
            $scope.selectSpec = function (index, s) {
                $scope.select_spec.splice(index, 1, s);
                $scope.selectSpecText = "已经选择 " + $scope.select_spec.join(' ');
                if ($scope.select_spec.length == $scope.goods_info.spec_group.length) {
                    var goods_spec = $scope.select_spec.join(' ');
                    var g = $scope.goods_info.goods_spec[goods_spec];
                    $scope.goods_info.goodsImages = g.goodsImages;
                    $scope.goods_info.goods_id = g.goods_id;
                    $scope.goods_info.goods_name = g.goods_name;
                    $scope.goods_info.goods_image_url = g.goods_image_url;
                    $scope.goods_info.goods_price = g.goods_price;
                    $scope.goods_info.goods_pay_price = g.goods_pay_price;
                    $scope.goods_info.goods_factory_storage = g.goods_factory_storage;
                    $scope.isSelect = true;
                }
            };
            $scope.checkCur = function (s) {
                if ($.inArray(s, $scope.select_spec) == -1) {
                    return false;
                }
                else {
                    return true;
                }
            }
        }])
    .controller('0rder_confirmCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util) {
            $scope.type = $state.params.type;
            $scope.id = $state.params.id;
            $scope.goods_pay_price = $state.params.goods_pay_price;
            $scope.submitting_flag = false;
            $scope.address_info = {};
            $scope.order_submit = {};
            $scope.coupon_show = false;
            $scope.couponIds = [];
            $scope.min_amount = 0;
            //url参数
            var url = $location.url().split("/");
            //console.log(url);
            $scope.order_amounts = url[4];
            $scope.pay_price = url[5];
            $scope.size = url[6];
            $scope.color = decodeURI(url[7]);    //decodeURI解决中文乱码
            //console.log($scope.color);
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#order_confirm[nav-view='active']");
                $rootScope.isLogin(function () {
                    $scope.init();
                }, true);
            });
            $scope.init = function () {
                if ($scope.type == 1) {
                    $scope.loadyorderlist();
                }
                else if ($scope.type == 2) {
                    $scope.loadgoodsinfo();
                }
                else if ($scope.type == 3) {
                    $scope.loadgoodsinfo();
                }
                $scope.loadcustomeraddress();
            };
            $scope.addnum = function (goods) {
                event.stopPropagation();
                if (goods.yorder_goods_id) {
                    ClientOpt.opt({
                        act: 'jieorder',
                        op: 'modify_goods_num',
                        type: 'add',
                        yorder_goods_id: goods.yorder_goods_id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $scope.loadyorderlist();
                        }
                    });
                }
                else {
                    var goods_num = $($scope.rootEle).find(".buy_num").text();
                    $($scope.rootEle).find(".buy_num").text(parseInt(goods_num) + 1);
                    $scope.order_amount = (parseInt(goods_num) + 1) * parseFloat(goods.goods_pay_price);
                    $scope.loadcouponlist($scope.order_amount);
                }
            };
            $scope.reducenum = function (goods) {
                event.stopPropagation();
                if (goods.yorder_goods_id) {
                    if (parseInt(goods.goods_num) <= 1) {
                        return false;
                    }
                    ClientOpt.opt({
                        act: 'jieorder',
                        op: 'modify_goods_num',
                        type: 'reduce',
                        yorder_goods_id: goods.yorder_goods_id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $scope.loadyorderlist();
                        }
                    });
                }
                else {
                    var goods_num = $($scope.rootEle).find(".buy_num").text();
                    if (parseInt(goods_num) <= 1) {
                        return false;
                    }
                    $($scope.rootEle).find(".buy_num").text(parseInt(goods_num) - 1);
                    $scope.order_amount = (parseInt(goods_num) - 1) * parseFloat(goods.goods_pay_price);
                    $scope.loadcouponlist($scope.order_amount);
                }
            };
            $scope.loadgoodsinfo = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'goods_info',
                    goods_id: $scope.id,
                    type: $scope.type
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.yorder_list = [];
                        $scope.goods_info = json.datas.goods_info;
                        if ($scope.goods_pay_price > 0) {
                            $scope.goods_info.goods_pay_price = $scope.goods_pay_price;
                        }
                        $scope.goods_info['goods_num'] = 1;
                        // $scope.goods_info['order_amounts'] = $scope.order_amounts;
                        // $scope.goods_info['pay_price'] = $scope.pay_price;
                        // $scope.goods_info['size'] = $scope.size;
                        // $scope.goods_info['color'] = $scope.color;
                        $scope.yorder_list.push($scope.goods_info);
                        $scope.order_amount = $scope.goods_info.goods_pay_price;
                        $scope.loadcouponlist($scope.order_amount);
                    }
                });
            };
            $scope.loadyorderlist = function () {
                ClientOpt.opt({ act: 'jieorder', op: 'get_buy_list', cart_id: $scope.id }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.yorder_list = json.datas.yorder_list;
                        $scope.order_amount = json.datas.order_amount;
                        $scope.loadcouponlist($scope.order_amount);
                    }
                });
            };
            $scope.loadcustomeraddress = function () {
                ClientOpt.opt({
                    act: 'customer_address',
                    op: 'address_info'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.address_info = json.datas.address_info;
                    }
                });
            };
            //弹窗选择规格确认购买
            $scope.hshow = function () {
                $($scope.rootEle).find(".or_hei_box").addClass("hshow");
                // $($scope.rootEle).find(".buy_num").text(1);
                $scope.final_pay_price = $($scope.rootEle).find(".or_n_price").text();
            };
            //支付页面为另一个页面
            // $scope.pay=function () {
            //     if(StringUtil.isEmpty($scope.address_info.address)||StringUtil.isEmpty($scope.address_info.address_id)){
            //         MyDialog.tip("地址出错");
            //         return;
            //     }
            //     $scope.submitting_flag=true;
            //     if ($scope.type ==  2 || $scope.type ==  3) {
            //         var goods_num=$($scope.rootEle).find(".buy_amounts").text();
            //         var pay_price=$($scope.rootEle).find(".or_n_price").text();
            //         //var comment=$($scope.rootEle).find(".comment").val();
            //         ClientOpt.opt({
            //             act: 'member_buy',
            //             op: 'buy_goods',
            //             goods_id: $scope.id,
            //             goods_num: goods_num,
            //             couponIds: $scope.couponIds.toString(),
            //             goods_pay_price: pay_price,
            //             type: $scope.type,
            //             order_amount: pay_price,
            //             //comment: comment,
            //             address_id: $scope.address_info.address_id
            //         }, function (json) {
            //             $scope.submitting_flag=false;
            //             if (!StringUtil.isEmpty(json.datas.error)) {
            //                 MyDialog.tip(json.datas.error);
            //             }
            //             else {
            //                 $rootScope.get_yorder_num();
            //                 $ionicHistory.nextViewOptions({
            //                     historyRoot: true
            //                 });
            //                 var orderIds=json.datas.orderIds;
            //                 var order_amount=json.datas.order_amount;
            //                 $location.path("/recharge/"+orderIds+"/"+order_amount);
            //             }
            //         });
            //     }
            //     else {
            //         var cartList=[];
            //         $($scope.rootEle).find(".yorder_list").each(function(){
            //             var cartSa = $(this).find(".yorder_id").val();
            //             var cartId = $(this).find(".yorder_goods_id").val();
            //             var cartNum = $(this).find(".buy_num").text();
            //             var comment = $(this).find(".comment").val();
            //             var cart = cartSa+"|"+cartId+"|"+parseInt(cartNum)+"|"+comment;
            //             cartList.push(cart);
            //         });
            //         ClientOpt.opt({
            //             act: 'member_buy',
            //             op: 'buy_yorder_goods',
            //             cart_id: cartList.toString(),
            //             couponIds: $scope.couponIds.toString(),
            //             order_amount: $scope.order_amount,
            //             address_id: $scope.address_info.address_id
            //         }, function (json) {
            //             $scope.submitting_flag=false;
            //             if (!StringUtil.isEmpty(json.datas.error)) {
            //                 MyDialog.tip(json.datas.error);
            //             }
            //             else {
            //                 $rootScope.get_yorder_num();
            //                 $ionicHistory.nextViewOptions({
            //                     historyRoot: true
            //                 });
            //                 var orderIds=json.datas.orderIds;
            //                 var order_amount=json.datas.order_amount;
            //                 $location.path("/recharge/"+orderIds+"/"+order_amount);
            //             }
            //         });
            //     }
            // };

            //支付页面为弹窗
            $scope.pay = function () {
                if ($scope.type == 1) {
                    Wechat.isInstalled(function (installed) {
                        if (installed) {
                            ClientOpt.opt({
                                act: 'wxpay',
                                op: 'pay',
                                orderIds: $scope.orderIds,
                                order_amount: $scope.order_amount
                            }, function (json) {
                                if (!StringUtil.isEmpty(json.datas.error)) {
                                    MyDialog.error(json.datas.error);
                                }
                                else {
                                    var params = {
                                        partnerid: json.datas.partnerid,
                                        prepayid: json.datas.prepayid,
                                        noncestr: json.datas.noncestr,
                                        timestamp: json.datas.timestamp,
                                        sign: json.datas.sign
                                    };
                                    Wechat.sendPaymentRequest(params, function () {
                                        MyDialog.tip("支付成功");
                                        $rootScope.gotoPage('/myorder/0');
                                    }, function (reason) {
                                        MyDialog.tip("Failed: " + reason);
                                        $rootScope.gotoPage('/myorder/0');
                                    });
                                }
                            });
                        }
                        else {
                            MyDialog.tip("尚未安装微信");
                        }
                    }, function (reason) {
                    });
                }
                else if ($scope.type == 2) {
                    ClientOpt.opt({
                        act: 'alipay',
                        op: 'pay',
                        orderIds: $scope.orderIds,
                        order_amount: $scope.order_amount
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.error(json.datas.error);
                        }
                        else {
                            var payInfo = json.datas.info;
                            if (payInfo) {
                                cordova.plugins.alipay.payment(payInfo,
                                    function success() {
                                        MyDialog.tip("支付成功");
                                        $rootScope.gotoPage('/myorder/0');
                                    },
                                    function error(e) {
                                        MyDialog.error("error:状态代码:" + e.resultStatus + "   返回的结果数据:" + e.result + "   提示信息:" + e.memo);
                                        $rootScope.gotoPage('/myorder/0');
                                    });
                            }
                            else {
                                MyDialog.error("获取签名失败");
                                $rootScope.gotoPage('/myorder/0');
                            }
                        }
                    });
                }
                $rootScope.mineReload = true;
            };
            $scope.couponFinish = function () {
                new Swiper('#sell_juan_id', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });
            };
            $scope.loadcouponlist = function (order_amount) {
                $scope.so_order_amount = order_amount;
                ClientOpt.opt({
                    act: 'setting',
                    op: 'get_coupon_list',
                    type: 1,
                    order_amount: order_amount
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.coupon_list = json.datas.coupon_list;
                        $scope.coupon_id = '';
                        if ($scope.coupon_list.length > 0) {
                            $scope.couponText = $scope.coupon_list.length + "  张优惠卷可用";
                        }
                        else {
                            $scope.couponText = "没有优惠卷可用";
                        }
                    }
                });
            };
            $scope.showCoupon = function () {
                $scope.coupon_show = !$scope.coupon_show;
            };
            $scope.selectcoupon = function (coupon) {
                if ($.inArray(coupon.id, $scope.couponIds) != -1) {
                    var index = $scope.couponIds.indexOf(coupon.id);
                    $scope.couponIds.splice(index, 1);
                    if ($scope.couponIds.length > 0) {
                        $scope.couponText = "已选择 " + $scope.couponIds.length + " 张优惠卷";
                        $scope.order_amount = parseFloat($scope.order_amount) + parseFloat(coupon.coupon_amount);
                        $scope.min_amount = parseFloat($scope.min_amount) - parseFloat(coupon.min_amount);
                    }
                    else {
                        $scope.couponText = $scope.coupon_list.length + "  张优惠卷可用";
                        $scope.order_amount = $scope.so_order_amount;
                        $scope.min_amount = 0;
                    }
                }
                else {
                    if (parseFloat($scope.min_amount) + parseFloat(coupon.min_amount) > parseFloat($scope.so_order_amount)) {
                        MyDialog.tip("没有满足条件使用该优惠卷");
                    }
                    else {
                        $scope.couponIds.push(coupon.id);
                        $scope.couponText = "已选择 " + $scope.couponIds.length + " 张优惠卷";
                        $scope.order_amount = parseFloat($scope.order_amount) - parseFloat(coupon.coupon_amount);
                        $scope.min_amount = parseFloat($scope.min_amount) + parseFloat(coupon.min_amount);
                    }
                }
            };
            $scope.checkcur = function (coupon_id) {
                if ($.inArray(coupon_id, $scope.couponIds) == -1) {
                    return false;
                }
                else {
                    return true;
                }
            }
        }])
    .controller('RechargeCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.orderIds = $state.params.orderIds;
            $scope.order_amount = $state.params.order_amount;
            $scope.type = 1;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.order_sn = new Date().getTime();
            });
            $scope.goback = function () {
                $rootScope.gotoPage('/myorder/0');
            }
            $scope.switch = function (type) {
                $scope.type = type;
            }
            $scope.pay = function () {
                if ($scope.type == 1) {
                    Wechat.isInstalled(function (installed) {
                        if (installed) {
                            ClientOpt.opt({
                                act: 'wxpay',
                                op: 'pay',
                                orderIds: $scope.orderIds,
                                order_amount: $scope.order_amount
                            }, function (json) {
                                if (!StringUtil.isEmpty(json.datas.error)) {
                                    MyDialog.error(json.datas.error);
                                }
                                else {
                                    var params = {
                                        partnerid: json.datas.partnerid,
                                        prepayid: json.datas.prepayid,
                                        noncestr: json.datas.noncestr,
                                        timestamp: json.datas.timestamp,
                                        sign: json.datas.sign
                                    };
                                    Wechat.sendPaymentRequest(params, function () {
                                        MyDialog.tip("支付成功");
                                        $rootScope.gotoPage('/myorder/0');
                                    }, function (reason) {
                                        MyDialog.tip("Failed: " + reason);
                                        $rootScope.gotoPage('/myorder/0');
                                    });
                                }
                            });
                        }
                        else {
                            MyDialog.tip("尚未安装微信");
                        }
                    }, function (reason) {
                    });
                }
                else if ($scope.type == 2) {
                    ClientOpt.opt({
                        act: 'alipay',
                        op: 'pay',
                        orderIds: $scope.orderIds,
                        order_amount: $scope.order_amount
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.error(json.datas.error);
                        }
                        else {
                            var payInfo = json.datas.info;
                            if (payInfo) {
                                cordova.plugins.alipay.payment(payInfo,
                                    function success() {
                                        MyDialog.tip("支付成功");
                                        $rootScope.gotoPage('/myorder/0');
                                    },
                                    function error(e) {
                                        MyDialog.error("error:状态代码:" + e.resultStatus + "   返回的结果数据:" + e.result + "   提示信息:" + e.memo);
                                        $rootScope.gotoPage('/myorder/0');
                                    });
                            }
                            else {
                                MyDialog.error("获取签名失败");
                                $rootScope.gotoPage('/myorder/0');
                            }
                        }
                    });
                }
                $rootScope.mineReload = true;
            }
        }])
    .controller('WechatCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Constant', 'WebIMWidget',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Constant, WebIMWidget) {
            $scope.goods_id = $state.params.goods_id;
            $scope.send = {};
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.isLogin(function () {
                    $scope.loadgoodsinfo();
                });
            });
            $scope.loadgoodsinfo = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'goods_info',
                    goods_id: $scope.goods_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.goods_info = json.datas.goods_info;
                        $scope.targetType = 1; //1：私聊
                        $scope.targetId = $scope.goods_info.member_id;
                        $scope.seller_name = $scope.goods_info.seller_name;
                        $scope.member_avatar = $scope.goods_info.member_avatar;
                        startInit();
                    }
                });
            }
            function startInit() {
                var config = {
                    appkey: Constant.ry_appKey,
                    token: $rootScope.rongcloud_token,
                    displayConversationList: true,
                    style: {
                        left: 3,
                        bottom: 3,
                        width: 375
                    },
                    onSuccess: function (id) {
                    },
                    onError: function (error) {
                        MyDialog.tip(error);
                        $rootScope.goback();
                    }
                };
                RongDemo.common(WebIMWidget, config, $scope, ClientOpt);
            }
        }])
    .controller('Detail_messageCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#detail_message[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Shop_cartCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#shop_cart[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Mine_showCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup', 'JpushService', '$filter', '$ionicNativeTransitions',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup, $ionicNativeTransitions, $filter, JpushService) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded && !$rootScope.mineReload) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.mineReload = false;
                $scope.is_login = 0;
                $rootScope.isLogin(function () {
                    $scope.init();
                });
            });
            $scope.doRefresh = function () {
                $rootScope.isLogin(function () {
                    $scope.init();
                });
                $scope.$broadcast('scroll.refreshComplete');
            };
            $scope.init = function () {
                $scope.is_login = 1;
                ClientOpt.opt({ act: 'setting', op: 'index' }, function (json) {
                    console.log(json);
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        var rootEle = $scope.rootEle;
                        $(rootEle).find(".ms_nav_list li").click(function (event) {
                            var index = $(this).index();
                            $(rootEle).find(".ms_c_list").eq(index).show().siblings('.ms_c_list').hide(0);
                            $(rootEle).find(".ms_title").eq(index).addClass("ms_curr").siblings(".ms_title").removeClass("ms_curr");
                        });
                        $scope.info = json.datas.customer_info;
                        $rootScope.member_mobile = $scope.info.member_mobile;
                        $scope.share = json.datas.share;
                        $scope.collect = json.datas.collect;
                        $scope.follow = json.datas.follow;
                        //$scope.fans = json.datas.fans;
                        $scope.dzf = json.datas.dzf;
                        //$scope.dfh = json.datas.dfh;
                        $scope.dsh = json.datas.dsh;
                        //$scope.dpj = json.datas.dpj;
                        $scope.all = json.datas.all;
                    }
                });
            };
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#mine_show[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
        }])
    .controller('Mine_creditCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#mine_credit[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('StageCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#stage[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('RenewCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#renew[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $(rootEle).find(".rn_nav_list li").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".rn_c_list").eq(index).show().siblings('.rn_c_list').hide(0);
                    $(rootEle).find(".rn_title").eq(index).addClass("rn_curr").siblings(".rn_title").removeClass("rn_curr");
                })
            }
        }])
    .controller('Mine_serviceCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#mine_service[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('CollectionCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#collection[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Mine_newsCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#mine_news[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $(rootEle).find(".mn_nav_list li").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".mn_c_list").eq(index).show().siblings('.mn_c_list').hide(0);
                    $(rootEle).find(".mn_title").eq(index).addClass("mn_curr").siblings(".mn_title").removeClass("mn_curr");
                })
            }
        }])
    .controller('RegisterCtrl', ['$rootScope', '$scope', '$state', '$timeout', '$location', '$interval', '$ionicHistory', '$ionicPopup', '$ionicNativeTransitions', 'Util', 'StringUtil', 'clientSrv', 'ClientOpt', 'Constant', 'MyDialog',
        function ($rootScope, $scope, $state, $location, $timeout, $interval, $ionicHistory, $ionicPopup, $ionicNativeTransitions, Util, StringUtil, clientSrv, ClientOpt, Constant, MyDialog) {
            var isWebView = ionic.Platform.isWebView();
            $scope.a = "mobilemember_register";
            $scope.o = "index";
            //$scope.img_code="";
            $scope.client = {};
            $scope.$on('$ionicView.enter', function (scopes, states) {
                ClientOpt.opt({ act: 'login', op: 'nchash_init', a: $scope.a, o: $scope.o }, function (json) {
                    $scope.readonly = 0;
                    $scope.nchash = json.datas.nchash;
                    //$scope.refreshValidateCode();
                });
                //ClientOpt.opt({act: 'login', op: 'area_list'}, function (json) {
                //    if (!StringUtil.isEmpty(json.datas.error)) {
                //        MyDialog.tip(json.datas.error);
                //    }
                //    else{
                //        $scope.prov_list=json.datas.area_list;
                //    }
                //});
            });
            $scope.signup = function () {
                if (StringUtil.isEmpty($scope.client.mobile) || StringUtil.isEmpty($scope.client.password)
                    || StringUtil.isEmpty($scope.client.password_confirm)) {
                    $ionicPopup.alert({
                        title: '请填写手机号和密码!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                $scope.client.username = $scope.client.mobile;
                if ($scope.client.password != $scope.client.password_confirm) {
                    $ionicPopup.alert({
                        title: '两次密码不一致!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                //if (StringUtil.isEmpty($scope.client.verify_code)) {
                //    $ionicPopup.alert({
                //        title: '验证码不能为空!',
                //        okText: '确定', okType: 'button-light'
                //    });
                //    return;
                //}
                $scope.client = angular.extend($scope.client, { isWebView: isWebView, nchash: $scope.nchash });
                clientSrv.signup($scope.client);
            };
            //$scope.refreshValidateCode=function(){
            //    $scope.img_code=Constant.WebPath+"/shop/index.php?act=seccode&op=makecode&nchash="+$scope.nchash+"&ttt="+Math.random().toString(36).substr(2);
            //};
            $scope.verifyCodeText = "获取手机验证码";
            $scope.timeInterval = 60;
            $scope.getVerifyCode = function () {
                ClientOpt.opt({
                    act: 'login', op: 'get_verify',
                    nchash: $scope.nchash,
                    //captcha:$scope.client.img_code,
                    phone_num: $scope.client.mobile
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        var v = json.datas.error;
                        if (v === "-1") {
                            MyDialog.tip("验证码不正确");
                            $scope.client.img_code = "";
                            //$scope.refreshValidateCode();
                        }
                        else if (v === "-2")
                            MyDialog.tip("手机号码不正确");
                        else
                            MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.readonly = 1;
                        $scope.timer = $interval(function () {
                            if ($scope.timeInterval === 0) {
                                $scope.timeInterval = 60;
                                $scope.verifyCodeText = "获取手机验证码";
                                $interval.cancel($scope.timer);
                            }
                            else {
                                $scope.verifyCodeText = $scope.timeInterval + "s后重新获取";
                                $scope.timeInterval--;
                            }
                        }, 1000);
                    }
                });
            };
            $scope.checkphone = function () {
                ClientOpt.opt({
                    act: 'login',
                    op: 'check_phone',
                    phone: $scope.client.mobile
                }, function (json) {
                    $scope.client.cross_sn = json.datas.cross_sn;
                });
            };
            $scope.wxlogin = function () {
                $timeout(function () {
                    MyDialog.showLoading();
                    Wechat.isInstalled(function (installed) {
                        MyDialog.hideLoading();
                        if (!installed) {
                            MyDialog.tip("尚未安装微信");
                            return false;
                        }
                        Wechat.auth("snsapi_userinfo", function (response) {
                            clientSrv.wxsigno(response);
                        }, function (reason) {
                            MyDialog.tip(reason);
                        });
                    }, function (reason) {
                        // MyDialog.tip('Failed'+ reason);
                    });
                    MyDialog.hideLoading();
                });
            };
            $scope.qqlogin = function () {
                $timeout(function () {
                    MyDialog.showLoading();
                    QQSDK.checkClientInstalled(
                        function () {
                            var args = {};
                            args.client = QQSDK.ClientType.QQ;
                            QQSDK.ssoLogin(function (res) {
                                clientSrv.qqsigno(res);
                            }, function (reason) {
                                MyDialog.tip(reason);
                            }, args);
                        },
                        function () {
                            MyDialog.tip("尚未安装腾讯QQ");
                            return false;
                        }
                    );
                    MyDialog.hideLoading();
                });
            };
        }])
    .controller('LoginCtrl', ['$rootScope', '$scope', '$location', '$timeout', '$ionicHistory', '$ionicPopup', '$cookies', 'Util', 'StringUtil', 'clientSrv', 'MyDialog',
        function ($rootScope, $scope, $location, $timeout, $ionicHistory, $ionicPopup, $cookies, Util, StringUtil, clientSrv, MyDialog) {
            var isWebView = ionic.Platform.isWebView();
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if (window.cordova) {
                    Wechat.isInstalled(function (installed) {
                        if (installed) {
                            $scope.haswx = true;
                        }
                        else {
                            $scope.haswx = false;
                        }
                    }, function (reason) {
                    });
                }
            });
            $scope.client = {};
            $scope.client = angular.extend($scope.client, {
                //platform: platform,
                isWebView: isWebView
            });
            $scope.newClient = {};
            $scope.signon = function () {
                clientSrv.signon($scope.client);
            };
            $scope.toSignup = function () {
                $location.path('/register');
            };
        }])
    .controller('Mine_orderCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#mine_order[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $(rootEle).find(".rn_nav_list li").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".rn_c_list").eq(index).show().siblings('.rn_c_list').hide(0);
                    $(rootEle).find(".mo_title").eq(index).addClass("rn_curr").siblings(".mo_title").removeClass("rn_curr");
                })
            }
        }])
    .controller('Order_detailCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#order_detail[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $(rootEle).find(".rn_nav_list li").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".rn_c_list").eq(index).show().siblings('.rn_c_list').hide(0);
                    $(rootEle).find(".mo_title").eq(index).addClass("rn_curr").siblings(".mo_title").removeClass("rn_curr");
                })
            }
        }])
    .controller('Advance_payCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#advance_pay[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $(rootEle).find(".rn_nav_list li").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".rn_c_list").eq(index).show().siblings('.rn_c_list').hide(0);
                    $(rootEle).find(".mo_title").eq(index).addClass("rn_curr").siblings(".mo_title").removeClass("rn_curr");
                })
            }
        }])
    .controller('Mine_dataCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#mine_data[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Select_stageCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#select_stage[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Stage_detailCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#stage_detail[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Credit_recordCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#credit_record[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Mine_checkCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#mine_check[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;
                $(rootEle).find(".mk_nav_list li").click(function (event) {
                    var index = $(this).index();
                    $(rootEle).find(".mk_c_list").eq(index).show().siblings('.mk_c_list').hide(0);
                    $(rootEle).find(".mk_title").eq(index).addClass("mk_curr").siblings(".mk_title").removeClass("mk_curr");
                })
            }
        }])
    .controller('Confirm_stageCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#confirm_stage[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Replace_payCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#replace_pay[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Confirm_replaceCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#confirm_replace[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])
    .controller('Mine_detailCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded && !$rootScope.mineReload) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.mineReload = false;
                $scope.is_login = 0;
                $rootScope.isLogin(function () {
                    $scope.init();
                });
            });
            $scope.init = function () {
                $scope.is_login = 1;
                ClientOpt.opt({ act: 'setting', op: 'index' }, function (json) {
                    //console.log(json);
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.info = json.datas.customer_info;
                        $rootScope.member_mobile = $scope.info.member_mobile;
                        $scope.share = json.datas.share;
                        $scope.collect = json.datas.collect;
                        $scope.follow = json.datas.follow;
                        //$scope.fans = json.datas.fans;
                        $scope.dzf = json.datas.dzf;
                        //$scope.dfh = json.datas.dfh;
                        $scope.dsh = json.datas.dsh;
                        //$scope.dpj = json.datas.dpj;
                        $scope.all = json.datas.all;
                    }
                });
            };
        }])
    .controller('Personal_recordCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate', '$ionicPopup',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate, $ionicPopup) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#personal_record[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });
            $scope.init = function () {
                var rootEle = $scope.rootEle;

            }
        }])

    .controller('StoreListUpCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate) {
            $scope.gc_id_1 = '';
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#storelist_up[nav-view='active']");
                if ($scope.loaded && !$rootScope.shijiReload) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });


            $scope.init = function () {
                $scope.curpage = 0;
                var rootEle = $scope.rootEle;

                // 衣舍js


                $scope.loadfirstgoodsclass();
                $(rootEle).find(".sub_right").click(function () {
                    $(rootEle).find(".all_chose").show();
                });
                $(rootEle).find(".hei").click(function () {
                    $(rootEle).find(".all_chose").hide();
                });

                $(rootEle).find(".love_spite").click(function (event) {
                    if ($(this).hasClass("cur")) {
                        $(this).removeClass("cur");
                    } else {
                        $(this).addClass("cur");
                    }
                    event.stopPropagation();
                });
                $(rootEle).find(".hei_btn").click(function () {
                    if ($(this).hasClass("cur")) {
                        $(this).removeClass("cur");
                    } else {
                        $(this).addClass("cur");
                    }
                });
                $(rootEle).find(".color_chose_dd").click(function () {
                    if ($(this).hasClass("cur")) {
                        $(this).removeClass("cur");
                    } else {
                        $(this).addClass("cur");
                    }
                });
                $(rootEle).find(".all_chose_dt").click(function () {
                    if ($(this).hasClass("cur")) {
                        $(this).removeClass("cur");
                        $(this).children(".down_icon").removeClass("cur");
                        $(this).parents(".all_chose_dl").removeClass("cur");

                    } else {
                        $(this).addClass("cur");
                        $(this).children(".down_icon").addClass("cur");
                        $(this).parents(".all_chose_dl").addClass("cur");
                    }
                });
                new Swiper('.xuanyi_01', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });


                //衣舍js
                var nowing_01 = 0;
                var swiper_qh = new Swiper('#swiper_qh', {
                    onSlideChangeStart: function (aa) {
                        var nowing_01 = aa.activeIndex;
                        $(rootEle).find(".xuanyi_nav .hz_menu_list li.swiper_qh_01").eq(nowing_01).addClass("curr").siblings(".swiper_qh_01").removeClass("curr");
                    }
                })
                $(rootEle).find(".swiper_qh_01").click(function (event) {
                    var nowing_01 = $(this).index();
                    $(rootEle).find(".xuanyi_nav .hz_menu_list li.swiper_qh_01").eq(nowing_01).addClass("curr").siblings(".swiper_qh_01").removeClass("curr");
                    swiper_qh.slideTo(nowing_01, 700, false);
                })
            }

            $scope.loadfirstgoodsclass = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'get_first_goodsclass'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.first_gc_list = json.datas.gc_list;
                        if ($scope.first_gc_list.length > 0) {
                            $scope.gc_id_1 = $scope.first_gc_list[0].gc_id;
                        }
                        else {
                            $scope.gc_id_1 = '';
                        }
                    }
                });
            }
            $scope.gcFinish = function () {
                new Swiper(".sj_swiper_01", {
                    //loop : true
                    initialSlide: 1
                });
                new Swiper(".sj_swiper_02", {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });
                //var rootEle=$scope.rootEle;
                //var as=$(rootEle).find("#pagenavj").find("a");
                // var px=30;
                // var tt=new TouchSlider({id: 'slider_js','auto':'-1',fx:'ease-out',direction:'left',speed:500,timeout:5000,'before':function(index){
                //     as[this.p].className='';
                //     as[index].className='active';
                //     $scope.gc_id_1=as[index].getAttribute('data-value');
                //     var x = document.getElementById('pagenavj').scrollLeft;
                //     if(index>this.p){
                //         document.getElementById('pagenavj').scrollLeft=(x+px);
                //     }
                //     else if(this.p>index){
                //         document.getElementById('pagenavj').scrollLeft=(x-px);
                //     }
                //     this.p=index;
                // }});
                // tt.p = 0;
                // for(var i=0;i<as.length;i++){
                //     (function(){
                //         var j=i;
                //         as[j].tt = tt;
                //         as[j].onclick=function(){
                //             this.tt.slide(j);
                //             $scope.gc_id_1=as[j].getAttribute('data-value');
                //             return false;
                //         }
                //     })();
                // }
                // $ionicSlideBoxDelegate.update();
            }


        }])
    .controller('Wish_listCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, $state, $location, $timeout, $ionicHistory, $ionicModal, $ionicPopover, $cordovaBarcodeScanner, Util, StringUtil, ClientOpt, MyDialog, $sce, Constant, $ionicSlideBoxDelegate) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#wish_list[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.shijiReload = false;
                $scope.init();
            });


            $scope.init = function () {
                /*  -------------衣舍js----------------*/
                var rootEle = $scope.rootEle;
                /*整体切换*/
                var nowing = 0;
                var mySwiper = new Swiper('#btn_002', {
                    onSlideChangeEnd: function (swiper) {
                        nowing = swiper.activeIndex;
                        $(rootEle).find(".btn_002").eq(nowing).addClass("cur").siblings(".btn_001").removeClass("cur");
                    }

                })
                $(rootEle).find(".btn_002").click(function () {
                    var nowing = $(this).index();
                    $(rootEle).find(".btn_002").eq(nowing).addClass("cur").siblings(".btn_001").removeClass("cur");
                    mySwiper.slideTo(nowing, 700, false);

                })
                /*整体切换*/
                /*  尺码选择*/
                $(rootEle).find(".hei_btn").click(function () {
                    if ($(this).hasClass("cur")) {
                        $(this).removeClass("cur");
                    } else {
                        $(this).addClass("cur");
                    }
                });
                /*  尺码选择*/
                $(rootEle).find(".love_spite").click(function (event) {
                    if ($(this).hasClass("cur")) {
                        $(this).removeClass("cur");
                    } else {
                        $(this).addClass("cur");
                    }
                    event.stopPropagation();
                });


                new Swiper('.xuanyi_01', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });

                /*  衣舍js*/

            }
        }])
    .controller('NotificationCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$location', '$ionicPopup', '$cookies', '$ionicHistory', '$ionicScrollDelegate', '$timeout', '$ionicLoading', '$ionicNativeTransitions', '$sce', '$ionicModal', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', 'Constant',
        function ($rootScope, $scope, $state, $stateParams, $location, $ionicPopup, $cookies, $ionicHistory, $ionicScrollDelegate, $timeout, $ionicLoading, $ionicNativeTransitions, $sce, $ionicModal, Util, StringUtil, ClientOpt, MyDialog, Constant) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded && !$rootScope.notificationReload) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.notificationReload = false;
                //$rootScope.isLogin(function(){
                //    $scope.init();
                //});
            });
            $scope.doRefresh = function () {
                $scope.init();
                $scope.$broadcast('scroll.refreshComplete');
            };
            $scope.init = function () {
                $scope.loadnewcount();
                $scope.curpage = 0;
                $scope.loadportallist();
            }
            $scope.loadnewcount = function () {
                ClientOpt.opt({ act: 'normalnotify', op: 'get_new_count' }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.news = json.datas.news;
                    }
                });
            }
            $scope.loadportallist = function () {
                ClientOpt.opt({ act: 'normalnotify', op: 'get_portal_list', curpage: $scope.curpage }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.curpage == 0) {
                            $scope.portal_list = json.datas.portal_list;
                        }
                        else {
                            $.each(json.datas.portal_list, function (i, item) {
                                $scope.portal_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.hasmore = json.hasmore;
                    }
                });
            }
            $scope.loadMore = function () {
                $scope.curpage++;
                $scope.loadportallist();
            }
        }])
    .controller('MineCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Signon_newCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });

        }])
    .controller('DiscussCtrl', ['$rootScope', '$scope', '$state', '$location', '$timeout', '$ionicHistory', '$ionicModal', '$ionicPopover', '$cordovaBarcodeScanner', 'Util', 'StringUtil', 'ClientOpt', 'MyDialog', '$sce', 'Constant', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Personal_centerCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;

                $(".hei").click(function () {
                    $(".heibox").hide();
                })
            });
        }])
    .controller('Sub_detailCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Goods_listCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });



            $scope.init = function () {
                $scope.curpage = 0;
                var rootEle = $scope.rootEle;
                new Swiper('.xuanyi_01', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });
            }



        }])
    .controller('Kefu_serviceCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Sheet_manCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });



            $scope.init = function () {
                $scope.curpage = 0;
                var rootEle = $scope.rootEle;
                new Swiper('#home_lanmu_six_01', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });
            }
        }])
    .controller('FeedbackCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#feedback[nav-view='active']");
                $($scope.rootEle).find('#content').unbind().charCount({
                    allowed: 140,
                    warning: 50,
                    counterContainerID: 'srts',
                    firstCounterText: '还可以输入',
                    endCounterText: '字',
                    errorCounterText: '已经超出'
                });
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.submit = function () {
                var content = $($scope.rootEle).find('#content').val();
                if (content == '') {
                    MyDialog.tip("内容不能为空");
                    return;
                }
                ClientOpt.opt({
                    act: 'store',
                    op: 'save_feedback',
                    content: content
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        MyDialog.tip("反馈已经提交成功");
                        $rootScope.goback();
                    }
                });
            }
        }])
    .controller('SafeguardCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#feedback[nav-view='active']");
                $($scope.rootEle).find('#content').unbind().charCount({
                    allowed: 140,
                    warning: 50,
                    counterContainerID: 'srts',
                    firstCounterText: '还可以输入',
                    endCounterText: '字',
                    errorCounterText: '已经超出'
                });
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.submit = function () {
                var content = $($scope.rootEle).find('#content').val();
                if (content == '') {
                    MyDialog.tip("内容不能为空");
                    return;
                }
                ClientOpt.opt({
                    act: 'store',
                    op: 'save_feedback',
                    content: content
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        MyDialog.tip("反馈已经提交成功");
                        $rootScope.goback();
                    }
                });
            }
        }])
    .controller('Re_addressCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('Add_addressCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('Problem_listCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('Menber_centerCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('RewardCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('RepositCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('CouponCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('Menber_beCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });



            $scope.init = function () {
                $scope.curpage = 0;
                var rootEle = $scope.rootEle;
                var menber_be = new Swiper('.menber_be', {
                    pagination: '.swiper-pagination',
                    effect: 'coverflow',
                    grabCursor: true,
                    centeredSlides: true,
                    slidesPerView: 'auto',
                    initialSlide: 2 /*初始位置*/,
                    coverflow: {
                        rotate: 50,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: true
                    }
                })
            }
        }])
    .controller('Label_pageCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('ContactCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            var vm = $scope.vm = {};
            $scope.address = {};
            $scope.address.address_id = $state.params.address_id;
            $scope.flag = false;
        }])
    .controller('Size_detailsCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#Size_details[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });


            $scope.init = function () {
                /*  -------------衣舍js----------------*/

                new Swiper('#size_swiper', {
                    slidesPerView: 'auto',
                    paginationClickable: true,
                    freeMode: true
                });

                /*  衣舍js*/

            }
        }])
    .controller('Invit_friendsCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#Size_details[nav-view='active']");
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });

            $scope.init = function () {
                /*  -------------衣舍js----------------*/

                new Swiper('.invit_friends', {

                });

                /*  衣舍js*/

            }

        }])

    .controller('MarketCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {

        }])
    .controller('Shop_cartCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            $scope.buy = [];
            $scope.buy_num = 0;
            $scope.buy_price = 0;
            $rootScope.orderconfirmRoad = true;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#shop_cart[nav-view='active']");
                //$rootScope.isLogin(function(){
                //    $scope.init();
                //});
            });
            $scope.doRefresh = function () {
                $scope.init();
                $scope.$broadcast('scroll.refreshComplete');
            }
            $scope.init = function () {
                $scope.loadyorderlist();
                $scope.loadrecgoodslist();
            }
            $scope.cheackbuycur = function () {
                var r = true;
                if ($scope.yorder_list && $scope.yorder_list.length > 0) {
                    $.each($scope.yorder_list, function (i, item) {
                        r = $scope.cheackcur(item.goods_list.length, $scope.buy[item.yorder_id]) & r;
                    });
                    if (r == 1) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                return false;
            }
            $scope.cheackcur = function (l, o) {
                if (typeof o == 'object') {
                    var n = 0;
                    var r = true
                    for (var i in o) {
                        n++;
                        r = o[i] & r;
                    }
                    if (n == l && r == 1) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                return false;
            }
            $scope.addbuyyorder = function () {
                if ($scope.yorder_list && $scope.yorder_list.length > 0) {
                    var r = true;
                    $.each($scope.yorder_list, function (i, item) {
                        r = $scope.addyorder(item) & r;
                    });
                    $scope.buy = [];
                    $scope.buy_num = 0;
                    $scope.buy_price = 0;
                    if (r == 0) {
                        $.each($scope.yorder_list, function (i, item) {
                            if (item.goods_list && item.goods_list.length > 0) {
                                $scope.buy[item.yorder_id] = [];
                                $.each(item.goods_list, function (ii, it) {
                                    $scope.buy[item.yorder_id][it.yorder_goods_id] = true;
                                    $scope.buy_num += parseFloat(it.goods_num);
                                    $scope.buy_price += parseFloat(it.goods_price) * parseFloat(it.goods_num);
                                });
                            }
                        });
                    }
                }
            }
            $scope.addyorder = function (yorder) {
                if ($scope.buy[yorder.yorder_id] && $scope.buy[yorder.yorder_id].length > 0) {
                    var r = true;
                    $.each(yorder.goods_list, function (i, item) {
                        r = $scope.buy[yorder.yorder_id][item.yorder_goods_id] & r;
                    });
                    if (r == 1) {
                        $scope.buy[yorder.yorder_id] = [];
                        $.each(yorder.goods_list, function (i, item) {
                            $scope.buy_num -= parseFloat(item.goods_num);
                            $scope.buy_price -= parseFloat(item.goods_price) * parseFloat(item.goods_num);
                        });
                        return true;
                    }
                    else {
                        $.each(yorder.goods_list, function (i, item) {
                            if (!$scope.buy[yorder.yorder_id][item.yorder_goods_id]) {
                                $scope.buy[yorder.yorder_id][item.yorder_goods_id] = true;
                                $scope.buy_num += parseFloat(item.goods_num);
                                $scope.buy_price += parseFloat(item.goods_price) * parseFloat(item.goods_num);
                            }
                        });
                        return false;
                    }
                }
                else {
                    $scope.buy[yorder.yorder_id] = [];
                    $.each(yorder.goods_list, function (i, item) {
                        $scope.buy[yorder.yorder_id][item.yorder_goods_id] = true;
                        $scope.buy_num += parseFloat(item.goods_num);
                        $scope.buy_price += parseFloat(item.goods_price) * parseFloat(item.goods_num);
                    });
                    return false;
                }
            }
            $scope.addyordergoods = function (yorder_id, yorder_goods_id) {
                event.stopPropagation();
                var num = $(event.target).parents("li").find(".buy_num").text();
                var price = $(event.target).parents("li").find(".price_span").text();
                if ($scope.buy[yorder_id] && $scope.buy[yorder_id].length > 0) {
                    if ($scope.buy[yorder_id][yorder_goods_id]) {
                        $scope.buy[yorder_id][yorder_goods_id] = false;
                        $scope.buy_num -= parseFloat(num);
                        $scope.buy_price -= parseFloat(price) * parseFloat(num);
                    }
                    else {
                        $scope.buy[yorder_id][yorder_goods_id] = true;
                        $scope.buy_num += parseFloat(num);
                        $scope.buy_price += parseFloat(price) * parseFloat(num);
                    }
                }
                else {
                    $scope.buy[yorder_id] = [];
                    $scope.buy[yorder_id][yorder_goods_id] = true;
                    $scope.buy_num += parseFloat(num);
                    $scope.buy_price += parseFloat(price) * parseFloat(num);
                }
            }
            $scope.addnum = function (yorder_goods_id) {
                event.stopPropagation();
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'modify_goods_num',
                    type: 'add',
                    yorder_goods_id: yorder_goods_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.loadyorderlist();
                    }
                });
            }
            $scope.reducenum = function (goods_num, yorder_goods_id) {
                event.stopPropagation();
                if (goods_num <= 1) {
                    return false;
                }
                else {
                    ClientOpt.opt({
                        act: 'jieorder',
                        op: 'modify_goods_num',
                        type: 'reduce',
                        yorder_goods_id: yorder_goods_id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $scope.loadyorderlist();
                        }
                    });
                }
            }
            $scope.loadyorderlist = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_yorder_list'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.yorder_list = json.datas.yorder_list;
                    }
                });
            }
            $scope.loadrecgoodslist = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'get_rec_goods'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.goods_list = json.datas.goods_list;
                    }
                });
            };
            $scope.batchOrder = function () {
                var cartList = [];
                $($scope.rootEle).find(".listcart_circle.cur").each(function () {
                    var li = $(this).parents("li");
                    var cartSa = $(li).find(".seller_id").val();
                    var cartId = $(li).find(".yorder_goods_id").val();
                    var cart = cartSa + "|" + cartId;
                    cartList.push(cart);
                });
                if (cartList.length > 0) {
                    $location.path("/order_confirm//" + cartList.toString());
                }
            };
        }])
    .controller('Confirm_orderCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util) {
            $scope.goods_id = $state.params.goods_id;

        }])
    .controller('WechatCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Constant', 'WebIMWidget',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Constant, WebIMWidget) {
            $scope.goods_id = $state.params.goods_id;
            $scope.send = {};
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $rootScope.isLogin(function () {
                    $scope.loadgoodsinfo();
                });
            });
            $scope.loadgoodsinfo = function () {
                ClientOpt.opt({
                    act: 'goods',
                    op: 'goods_info',
                    goods_id: $scope.goods_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.goods_info = json.datas.goods_info;
                        $scope.targetType = 1; //1：私聊
                        $scope.targetId = $scope.goods_info.member_id;
                        $scope.seller_name = $scope.goods_info.seller_name;
                        $scope.member_avatar = $scope.goods_info.member_avatar;
                        startInit();
                    }
                });
            }
            function startInit() {
                var config = {
                    appkey: Constant.ry_appKey,
                    token: $rootScope.rongcloud_token,
                    displayConversationList: true,
                    style: {
                        left: 3,
                        bottom: 3,
                        width: 375
                    },
                    onSuccess: function (id) {
                    },
                    onError: function (error) {
                        MyDialog.tip(error);
                        $rootScope.goback();
                    }
                };
                RongDemo.common(WebIMWidget, config, $scope, ClientOpt);
            }
        }])
    .controller('Order_detailCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util) {
            $scope.order_id = $state.params.order_id;
            $scope.getLocalTime = Util.getLocalTime;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });
            $scope.init = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_order_info',
                    order_id: $scope.order_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.order_info = json.datas.order_info;
                    }
                });
            }
        }])
    .controller('Receipt_addresCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.init();
            });
            $scope.init = function () {
                ClientOpt.opt({
                    act: 'customer_address',
                    op: 'address_list'
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.address_list = json.datas.address_list;
                    }
                });
            }
            $scope.del_address = function (address_id) {
                MyDialog.confirm("注意", "确定要删除地址吗?", "确定", "我再想想", function () {
                    ClientOpt.opt({
                        act: 'customer_address',
                        op: 'address_del',
                        address_id: address_id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $scope.init();
                        }
                    });
                });
            }
            $scope.default = function (address_id) {
                ClientOpt.opt({
                    act: 'customer_address',
                    op: 'change_default',
                    address_id: address_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.init();
                    }
                });
            }
        }])
    .controller('Jren_detailCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            $scope.$on('$ionicView.enter', function (scopes, states) {

            });
        }])
    .controller('Jren_centerCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil) {
            $scope.$on('$ionicView.enter', function (scopes, states) {

            });
        }])
    .controller('HtmlContentCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.url = $state.params.p;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.init();
            });
            $scope.init = function () {
                var url = decodeURIComponent(decodeURIComponent($scope.url));
                // var url='http://127.0.0.1/supercmf/public/index.php/portal/article/index/id/33.html';
                $scope.wzURL = $sce.trustAsResourceUrl(url);
            }
            $scope.gotoGoodsDetail = function (goodsId) {
                $rootScope.gotoPage("/goods_detail/" + goodsId);
            }
            $scope.goback = function () {
                $rootScope.goback();
            }

            $scope.loadHtml = function (url) {
                $rootScope.loadHtml(url);
            }
        }])
    // .controller('MyorderCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
    //     function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
    //         $scope.type = $state.params.type;
    //         $scope.all_curpage = 0;
    //         $scope.dzf_curpage = 0;
    //         $scope.dfh_curpage = 0;
    //         $scope.dsh_curpage = 0;
    //         $scope.dpj_curpage = 0;
    //         $scope.$on('$ionicView.enter', function (scopes, states) {
    //             $scope.rootEle = $("#myorder[nav-view='active']");
    //             $scope.init();
    //         });
    //         $scope.init = function () {
    //             $scope.loadallorderlist();
    //             $scope.loaddzforderlist();
    //             $scope.loaddfhorderlist();
    //             $scope.loaddshorderlist();
    //             $scope.loaddpjorderlist();
    //             var rootEle = $scope.rootEle;
    //             var as = $(rootEle).find("#pagenavi_mo").find("a");
    //             var tt = new TouchSlider({
    //                 id: 'slider_myorder', 'auto': '-1', fx: 'ease-out', direction: 'left', speed: 500, timeout: 5000, 'before': function (index) {
    //                     as[this.p].className = '';
    //                     as[index].className = 'active';
    //                     $scope.type = index;
    //                     this.p = index;
    //                 }
    //             });
    //             tt.p = $scope.type;
    //             for (var i = 0; i < as.length; i++) {
    //                 (function () {
    //                     var j = i;
    //                     as[j].tt = tt;
    //                     as[j].onclick = function () {
    //                         this.tt.slide(j);
    //                         $scope.type = j;
    //                         return false;
    //                     }
    //                 })();
    //             }
    //             as[$scope.type].tt.slide($scope.type);
    //         }
    //         $scope.loadallorderlist = function () {
    //             ClientOpt.opt({
    //                 act: 'jieorder',
    //                 op: 'get_order_list',
    //                 curpage: $scope.all_curpage,
    //                 type: 0
    //             }, function (json) {
    //                 if (!StringUtil.isEmpty(json.datas.error)) {
    //                     MyDialog.tip(json.datas.error);
    //                 }
    //                 else {
    //                     if ($scope.all_curpage == 0) {
    //                         $scope.all_order_list = json.datas.order_list;
    //                     }
    //                     else {
    //                         $.each(json.datas.order_list, function (i, item) {
    //                             $scope.all_order_list.push(item);
    //                         });
    //                         $scope.$broadcast('scroll.infiniteScrollComplete');
    //                     }
    //                     $scope.all_hasmore = json.hasmore;
    //                 }
    //             });
    //         }
    //         $scope.loaddzforderlist = function () {
    //             ClientOpt.opt({
    //                 act: 'jieorder',
    //                 op: 'get_order_list',
    //                 curpage: $scope.dzf_curpage,
    //                 type: 1
    //             }, function (json) {
    //                 if (!StringUtil.isEmpty(json.datas.error)) {
    //                     MyDialog.tip(json.datas.error);
    //                 }
    //                 else {
    //                     if ($scope.dzf_curpage == 0) {
    //                         $scope.dzf_order_list = json.datas.order_list;
    //                     }
    //                     else {
    //                         $.each(json.datas.order_list, function (i, item) {
    //                             $scope.dzf_order_list.push(item);
    //                         });
    //                         $scope.$broadcast('scroll.infiniteScrollComplete');
    //                     }
    //                     $scope.dzf_hasmore = json.hasmore;
    //                 }
    //             });
    //         }
    //         $scope.loaddfhorderlist = function () {
    //             ClientOpt.opt({
    //                 act: 'jieorder',
    //                 op: 'get_order_list',
    //                 curpage: $scope.dfh_curpage,
    //                 type: 2
    //             }, function (json) {
    //                 if (!StringUtil.isEmpty(json.datas.error)) {
    //                     MyDialog.tip(json.datas.error);
    //                 }
    //                 else {
    //                     if ($scope.dfh_curpage == 0) {
    //                         $scope.dfh_order_list = json.datas.order_list;
    //                     }
    //                     else {
    //                         $.each(json.datas.order_list, function (i, item) {
    //                             $scope.dfh_order_list.push(item);
    //                         });
    //                         $scope.$broadcast('scroll.infiniteScrollComplete');
    //                     }
    //                     $scope.dfh_hasmore = json.hasmore;
    //                 }
    //             });
    //         }
    //         $scope.loaddshorderlist = function () {
    //             ClientOpt.opt({
    //                 act: 'jieorder',
    //                 op: 'get_order_list',
    //                 curpage: $scope.dsh_curpage,
    //                 type: 3
    //             }, function (json) {
    //                 if (!StringUtil.isEmpty(json.datas.error)) {
    //                     MyDialog.tip(json.datas.error);
    //                 }
    //                 else {
    //                     if ($scope.dsh_curpage == 0) {
    //                         $scope.dsh_order_list = json.datas.order_list;
    //                     }
    //                     else {
    //                         $.each(json.datas.order_list, function (i, item) {
    //                             $scope.dsh_order_list.push(item);
    //                         });
    //                         $scope.$broadcast('scroll.infiniteScrollComplete');
    //                     }
    //                     $scope.dsh_hasmore = json.hasmore;
    //                 }
    //             });
    //         }
    //         $scope.loaddpjorderlist = function () {
    //             ClientOpt.opt({
    //                 act: 'jieorder',
    //                 op: 'get_order_list',
    //                 curpage: $scope.dpj_curpage,
    //                 type: 4
    //             }, function (json) {
    //                 if (!StringUtil.isEmpty(json.datas.error)) {
    //                     MyDialog.tip(json.datas.error);
    //                 }
    //                 else {
    //                     if ($scope.dpj_curpage == 0) {
    //                         $scope.dpj_order_list = json.datas.order_list;
    //                     }
    //                     else {
    //                         $.each(json.datas.order_list, function (i, item) {
    //                             $scope.dpj_order_list.push(item);
    //                         });
    //                         $scope.$broadcast('scroll.infiniteScrollComplete');
    //                     }
    //                     $scope.dpj_hasmore = json.hasmore;
    //                 }
    //             });
    //         }
    //         $scope.loadallmore = function () {
    //             $scope.all_curpage++;
    //             $scope.loadallorderlist();
    //         }
    //         $scope.loaddzfmore = function () {
    //             $scope.dzf_curpage++;
    //             $scope.loaddzforderlist();
    //         }
    //         $scope.loaddfhmore = function () {
    //             $scope.dfh_curpage++;
    //             $scope.loaddfhorderlist();
    //         }
    //         $scope.loaddshmore = function () {
    //             $scope.dsh_curpage++;
    //             $scope.loaddshorderlist();
    //         }
    //         $scope.loaddpjmore = function () {
    //             $scope.dpj_curpage++;
    //             $scope.loaddpjorderlist();
    //         }
    //     }])
    .controller('MyorderCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce', '$interval',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce, $interval) {
            $scope.type = $state.params.type;
            $scope.showbox = 0;
            $scope.all_curpage = 0;
            $scope.dzf_curpage = 0;
            $scope.dfh_curpage = 0;
            $scope.dsh_curpage = 0;
            $scope.dpj_curpage = 0;
            $scope.orderIds = [];
            $scope.order_amount = 0;
            $scope.couponText = "";
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#myorder[nav-view='active']");
                $scope.init();
            });
            $scope.goback = function () {
                $rootScope.mineReload = true;
                $rootScope.gotoPage('/tab/myself');
            }
            $scope.selectcircle = function (order_id, order_amount) {
                if ($.inArray(order_id, $scope.orderIds) != -1) {
                    var index = $scope.orderIds.indexOf(order_id);
                    $scope.orderIds.splice(index, 1);
                    $scope.order_amount -= parseFloat(order_amount);
                }
                else {
                    $scope.orderIds.push(order_id);
                    $scope.order_amount += parseFloat(order_amount);
                }
                $scope.loadcouponlist($scope.order_amount);
            }
            $scope.checkcircle = function (order_id) {
                if ($.inArray(order_id, $scope.orderIds) == -1) {
                    return false;
                }
                else {
                    return true;
                }
            }
            $scope.selectall = function () {
                if ($scope.orderIds.length > 0) {
                    if ($scope.orderIds.length != $scope.dzf_order_list.length) {
                        $scope.orderIds = [];
                        $scope.order_amount = 0;
                        $.each($scope.dzf_order_list, function (i, item) {
                            $scope.orderIds.push(item.order_id);
                            $scope.order_amount += parseFloat(item.order_amount);
                        });
                    }
                    else {
                        $scope.orderIds = [];
                        $scope.order_amount = 0;
                    }
                }
                else {
                    $scope.order_amount = 0;
                    $.each($scope.dzf_order_list, function (i, item) {
                        $scope.orderIds.push(item.order_id);
                        $scope.order_amount += parseFloat(item.order_amount);
                    });
                }
                $scope.loadcouponlist($scope.order_amount);
            }
            $scope.loadcouponlist = function (order_amount) {
                ClientOpt.opt({
                    act: 'setting',
                    op: 'get_order_coupon',
                    orderIds: $scope.orderIds.toString(),
                    order_amount: order_amount
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.coupon_list = json.datas.coupon_list;
                        if ($scope.coupon_list.length > 0) {
                            $scope.couponText = "已使用" + $scope.coupon_list.length + "张优惠卷";
                        }
                        else {
                            $scope.couponText = "";
                        }
                        $scope.pay_order_amount = json.datas.order_amount;
                    }
                });
            }
            $scope.mergepay = function () {
                if ($scope.orderIds.length > 0) {
                    $rootScope.gotoPage("/recharge/" + $scope.orderIds.toString() + "/" + $scope.pay_order_amount);
                }
                else {
                    MyDialog.tip("请选择订单");
                }
            }
            $scope.remindfh = function () {
                MyDialog.tip("已经提醒卖家发货，请耐心等待");
            }
            $scope.confirmsh = function (order_id) {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'confirm_order',
                    order_id: order_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $rootScope.mineReload = true;
                        MyDialog.tip("确认收货成功");
                        $rootScope.gotoPage('/tab/myself');
                    }
                });
            }
            $scope.init = function () {
                $scope.loadallorderlist();
                $scope.loaddzforderlist();
                $scope.loaddfhorderlist();
                $scope.loaddshorderlist();
                $scope.loaddpjorderlist();
                var rootEle = $scope.rootEle;
                var as = $(rootEle).find("#pagenavi_mo").find("a");
                var tt = new TouchSlider({
                    id: 'slider_myorder', 'auto': '-1', fx: 'ease-out', direction: 'left', speed: 500, timeout: 5000, 'before': function (index) {
                        as[this.p].className = '';
                        as[index].className = 'active';
                        $scope.type = index;
                        this.p = index;
                    }
                });
                tt.p = $scope.type;
                for (var i = 0; i < as.length; i++) {
                    (function () {
                        var j = i;
                        as[j].tt = tt;
                        as[j].onclick = function () {
                            this.tt.slide(j);
                            $scope.type = j;
                            return false;
                        }
                    })();
                }
                as[$scope.type].tt.slide($scope.type);
            }
            $scope.loadallorderlist = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_order_list',
                    curpage: $scope.all_curpage,
                    type: 0
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.all_curpage == 0) {
                            $scope.all_order_list = json.datas.order_list;
                        }
                        else {
                            $.each(json.datas.order_list, function (i, item) {
                                $scope.all_order_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.all_hasmore = json.hasmore;
                        $interval(function () {
                            $.each($scope.all_order_list, function (i, item) {
                                $scope.all_order_list[i].re_time--;
                                if ($scope.all_order_list[i].re_time == 0) {
                                    $scope.all_curpage = 0;
                                    $scope.loadallorderlist();
                                }
                            });
                        }, 1000);
                    }
                });
            }
            $scope.couponFinish = function () {
                new Swiper('#hongbao_id', {
                    slidesPerView: 'auto',
                    spaceBetween: 10
                });
            }
            $scope.loaddzforderlist = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_order_list',
                    curpage: $scope.dzf_curpage,
                    type: 1
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.dzf_curpage == 0) {
                            $scope.dzf_order_list = json.datas.order_list;
                        }
                        else {
                            $.each(json.datas.order_list, function (i, item) {
                                $scope.dzf_order_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.dzf_hasmore = json.hasmore;
                        $interval(function () {
                            $.each($scope.dzf_order_list, function (i, item) {
                                $scope.dzf_order_list[i].re_time--;
                                if ($scope.dzf_order_list[i].re_time == 0) {
                                    $scope.dzf_curpage = 0;
                                    $scope.loaddzforderlist();
                                }
                            });
                        }, 1000);
                    }
                });
            }
            $scope.loaddfhorderlist = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_order_list',
                    curpage: $scope.dfh_curpage,
                    type: 2
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.dfh_curpage == 0) {
                            $scope.dfh_order_list = json.datas.order_list;
                        }
                        else {
                            $.each(json.datas.order_list, function (i, item) {
                                $scope.dfh_order_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.dfh_hasmore = json.hasmore;
                    }
                });
            }
            $scope.loaddshorderlist = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_order_list',
                    curpage: $scope.dsh_curpage,
                    type: 3
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.dsh_curpage == 0) {
                            $scope.dsh_order_list = json.datas.order_list;
                        }
                        else {
                            $.each(json.datas.order_list, function (i, item) {
                                $scope.dsh_order_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.dsh_hasmore = json.hasmore;
                    }
                });
            }
            $scope.loaddpjorderlist = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_order_list',
                    curpage: $scope.dpj_curpage,
                    type: 4
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.dpj_curpage == 0) {
                            $scope.dpj_order_list = json.datas.order_list;
                        }
                        else {
                            $.each(json.datas.order_list, function (i, item) {
                                $scope.dpj_order_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.dpj_hasmore = json.hasmore;
                    }
                });
            }
            $scope.loadallmore = function () {
                $scope.all_curpage++;
                $scope.loadallorderlist();
            }
            $scope.loaddzfmore = function () {
                $scope.dzf_curpage++;
                $scope.loaddzforderlist();
            }
            $scope.loaddfhmore = function () {
                $scope.dfh_curpage++;
                $scope.loaddfhorderlist();
            }
            $scope.loaddshmore = function () {
                $scope.dsh_curpage++;
                $scope.loaddshorderlist();
            }
            $scope.loaddpjmore = function () {
                $scope.dpj_curpage++;
                $scope.loaddpjorderlist();
            }
            $scope.pay = function (order_id, order_sn, order_amount) {
                $rootScope.gotoPage("/recharge/" + order_id + "/" + order_amount);
            }
            $scope.deleteorder = function (order_id) {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'delete_order',
                    order_id: order_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        MyDialog.tip("取消订单成功");
                        $rootScope.gotoPage('/tab/myself');
                    }
                });
            }
            $scope.timetrans = function (result) {
                var h = Math.floor(result / 3600);
                var m = Math.floor((result / 60 % 60));
                var s = Math.floor((result % 60));
                return h + " : " + m + " : " + s;
            }
            $scope.pay_he = function (a) {
                $scope.showbox = parseInt(a);
            }
        }])
    .controller('SettingCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce', 'JpushService', '$cordovaAppVersion', 'AppUpdateService',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce, JpushService, $cordovaAppVersion, AppUpdateService) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $cordovaAppVersion.getVersionNumber().then(function (version) {
                    $scope.version = version;
                });
            });
            $scope.checkVersion = function () {
                AppUpdateService.checkVersion($rootScope).then(function (data) {
                }, function (error) {
                    MyDialog.tip(error, 1000);
                });
            }
            $scope.logout = function () {
                MyDialog.confirm("退出提示", "确定要注销登录吗？", "确定了", "不了", function () {
                    ClientOpt.opt({ act: 'setting', op: 'logout' }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.error(json.datas.error);
                        }
                        else {
                            localStorage.removeItem('token');
                            localStorage.removeItem('rongcloud_token');
                            $rootScope.rongcloud_token = null;
                            JpushService.clearAlias();
                            JpushService.clearTags();
                            $ionicHistory.clearCache();
                            MyDialog.tip("成功退出！", function () {
                                $rootScope.gobackPage("/home");
                            })
                        }
                    });
                });
            }
            $scope.doClear = function () {
                $ionicHistory.clearCache();
                $ionicHistory.clearHistory();
                MyDialog.tip("清除缓存成功");
            }
            $(".hei").click(function () {
                $(".heibox").hide();
            })
        }])
    .controller('Account_setingCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Phone_modifyCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce', '$interval',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce, $interval) {
            $scope.a = "mobilemember_modify";
            $scope.o = "index";
            $scope.client = {};
            $scope.verifyCodeText = "获取验证码";
            $scope.timeInterval = 60;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                ClientOpt.opt({ act: 'login', op: 'modify_init', a: $scope.a, o: $scope.o }, function (json) {
                    $scope.readonly = 0;
                    $scope.nchash = json.datas.nchash;
                });
            });
            $scope.getVerifyCode = function () {
                ClientOpt.opt({ act: 'login', op: 'get_modify_verify', nchash: $scope.nchash, phone_num: $scope.client.mobile }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        var v = json.datas.error;
                        if (v === "-2")
                            MyDialog.tip("手机号码不正确");
                        else if (v === "-3")
                            MyDialog.tip("短信验证码已经下发，请过5分钟后再操作");
                        else
                            MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.timer = $interval(function () {
                            if ($scope.timeInterval === 0) {
                                $scope.timeInterval = 60;
                                $scope.verifyCodeText = "获取手机验证码";
                                $interval.cancel($scope.timer);
                            }
                            else {
                                $scope.verifyCodeText = $scope.timeInterval + "s后重新获取";
                                $scope.timeInterval--;
                            }
                        }, 1000);
                    }
                });
            };
            $scope.sure = function () {
                if (StringUtil.isEmpty($scope.client.mobile) || StringUtil.isEmpty($scope.client.password)) {
                    $ionicPopup.alert({
                        title: '请填写手机号和密码!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                if (StringUtil.isEmpty($scope.client.verify_code)) {
                    $ionicPopup.alert({
                        title: '验证码不能为空!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                ClientOpt.opt({
                    act: 'login',
                    op: 'phone_modify',
                    nchash: $scope.nchash,
                    password: $scope.client.password,
                    verify_code: $scope.client.verify_code,
                    mobile: $scope.client.mobile
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $rootScope.member_mobile = $scope.client.mobile;
                        MyDialog.tip("成功！");
                        $rootScope.goback();
                    }
                });
            };
        }])
    .controller('Password_gaiCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.client = {};
            $scope.$on('$ionicView.enter', function (scopes, states) {
            });
            $scope.sure = function () {
                if (StringUtil.isEmpty($scope.client.old_password)) {
                    $ionicPopup.alert({
                        title: '请输入旧密码!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                if (StringUtil.isEmpty($scope.client.new_password)) {
                    $ionicPopup.alert({
                        title: '新密码不能为空!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                if ($scope.client.new_password != $scope.client.confirm_password) {
                    $ionicPopup.alert({
                        title: '新密码跟确认密码不一致!',
                        okText: '确定', okType: 'button-light'
                    });
                    return;
                }
                ClientOpt.opt({
                    act: 'login',
                    op: 'modify_password',
                    password: $scope.client.old_password,
                    new_password: $scope.client.new_password
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        MyDialog.tip("成功！");
                        $rootScope.goback();
                    }
                });
            };
        }])
    .controller('Privacy_setCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Hname_listCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Sixin_setCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Personal_gaiCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Name_gaiCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('IntroductionCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Sex_gaiCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('Friend_shareCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('About_usCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
        }])
    .controller('FansCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.curpage = 0;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });
            $scope.doRefresh = function () {
                $scope.curpage = 0;
                $scope.init();
                $scope.$broadcast('scroll.refreshComplete');
            }
            $scope.init = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_fans_list',
                    curpage: $scope.curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.curpage == 0) {
                            $scope.fans_list = json.datas.fans_list;
                        }
                        else {
                            $.each(json.datas.fans_list, function (i, item) {
                                $scope.fans_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.hasmore = json.hasmore;
                    }
                });
            }
            $scope.more = function () {
                $scope.curpage++;
                $scope.init();
            }
            $scope.cancelFollow = function (id) {
                event.stopPropagation();
                MyDialog.confirm("取消确认", "确定要取消关注吗？", "是的", "我再想想", function () {
                    ClientOpt.opt({
                        act: 'store',
                        op: 'cancelFollow',
                        id: id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            MyDialog.tip("删除成功！");
                            $scope.curpage = 0;
                            $scope.init();
                            $rootScope.mineReload = true;
                        }
                    });
                });
            }
        }])
    .controller('FollowCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.curpage = 0;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
            });
            $scope.doRefresh = function () {
                $scope.curpage = 0;
                $scope.init();
                $scope.$broadcast('scroll.refreshComplete');
            }
            $scope.init = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_follow_list',
                    curpage: $scope.curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.curpage == 0) {
                            $scope.follow_list = json.datas.follow_list;
                        }
                        else {
                            $.each(json.datas.follow_list, function (i, item) {
                                $scope.follow_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.hasmore = json.hasmore;
                    }
                });
            }
            $scope.more = function () {
                $scope.curpage++;
                $scope.init();
            }
            $scope.cancelFollow = function (id) {
                event.stopPropagation();
                MyDialog.confirm("取消确认", "确定要取消关注吗？", "是的", "我再想想", function () {
                    ClientOpt.opt({
                        act: 'store',
                        op: 'cancelFollow',
                        id: id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            MyDialog.tip("删除成功！");
                            $scope.curpage = 0;
                            $scope.init();
                            $rootScope.mineReload = true;
                        }
                    });
                });
            }
        }])
    .controller('CollectCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.arr = [{ b: 'ss', d: 'cc', a: 12 }, { b: 'c', d: 'ccc', a: 14, c: 18.0, time: 12345432324321 }];
            $scope.curTab = 1;
            $scope.collect_curpage = 0;
            $scope.share_curpage = 0;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.loadcollectlist();
                $scope.loadsharelist();
            });
            $scope.show = function (curTab) {
                $scope.curTab = curTab;
            }
            $scope.doRefresh = function () {
                $scope.collect_curpage = 0;
                $scope.share_curpage = 0;
                $scope.loadcollectlist();
                $scope.loadsharelist();
                $scope.$broadcast('scroll.refreshComplete');
            }
            $scope.loadcollectlist = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_collect_list',
                    curpage: $scope.collect_curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.collect_curpage == 0) {
                            $scope.collect_list = json.datas.collect_list;
                        }
                        else {
                            $.each(json.datas.collect_list, function (i, item) {
                                $scope.collect_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.collect_hasmore = json.hasmore;
                    }
                });
            };
            $scope.loadsharelist = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_share_list',
                    curpage: $scope.share_curpage
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.share_curpage == 0) {
                            $scope.share_list = json.datas.share_list;
                        }
                        else {
                            $.each(json.datas.share_list, function (i, item) {
                                $scope.share_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.share_hasmore = json.hasmore;
                    }
                });
            };
            $scope.collect_more = function () {
                $scope.collect_curpage++;
                $scope.loadcollectlist();
            }
            $scope.share_more = function () {
                $scope.share_curpage++;
                $scope.loadsharelist();
            }
            $scope.deletecollect = function (id) {
                event.stopPropagation();
                MyDialog.confirm("删除确认", "确定要删除这条记录吗？", "删除", "我再想想", function () {
                    ClientOpt.opt({
                        act: 'store',
                        op: 'deleteCollect',
                        id: id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            MyDialog.tip("删除成功！");
                            $scope.collect_curpage = 0;
                            $scope.loadcollectlist();
                            $rootScope.mineReload = true;
                        }
                    });
                });
            }
        }])
    .controller('ReleaseCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$location', '$ionicPopup', '$cookies', '$ionicHistory', '$ionicModal', '$ionicScrollDelegate', '$timeout', '$ionicLoading', '$ionicNativeTransitions', 'Util', '$ionicPopover', 'StringUtil', 'ClientOpt', 'MyDialog', 'YorderUtil', 'AppUpdateService', 'JpushService', '$ionicActionSheet', 'Constant', '$cordovaCamera', '$cordovaImagePicker', '$cordovaFileTransfer',
        function ($rootScope, $scope, $state, $stateParams, $location, $ionicPopup, $cookies, $ionicHistory, $ionicModal, $ionicScrollDelegate, $timeout, $ionicLoading, $ionicNativeTransitions, Util, $ionicPopover, StringUtil, ClientOpt, MyDialog, YorderUtil, AppUpdateService, JpushService, $ionicActionSheet, Constant, $cordovaCamera, $cordovaImagePicker, $cordovaFileTransfer) {
            $scope.id = $state.params.id;
            $scope.share = {};
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if (!StringUtil.isEmpty($scope.id)) {
                    ClientOpt.opt({
                        act: 'store',
                        op: 'get_myshare_info',
                        id: $scope.id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            $scope.info = json.datas.info;
                            $scope.share.title = $scope.info.title;
                            $scope.share.content = $scope.info.content;
                            $scope.share.image_url = $scope.info.image_url;
                            $scope.share.image = $scope.info.image;
                        }
                    });
                }
            });
            $scope.selectImg = function () {
                $ionicActionSheet.show({
                    buttons: [{
                        text: '相册'
                    }, {
                        text: '拍照'
                    }
                    ],
                    titleText: '选择图片',
                    cancelText: '取消',
                    cancel: function () {
                    },
                    buttonClicked: function (index) {
                        switch (index) {
                            case 0:
                                $scope.pickImage();
                                break;
                            case 1:
                                $scope.takePhoto();
                                break;
                            default:
                                break;
                        }
                        return true;
                    }
                });
            };
            $scope.pickImage = function () {
                var options = {
                    maximumImagesCount: 1,
                    width: 800,
                    height: 800,
                    quality: 80
                };
                $cordovaImagePicker.getPictures(options)
                    .then(function (results) {
                        $scope.upImage(results[0]);
                    }, function (error) {
                        MyDialog.tip(error);
                    });
            };
            $scope.takePhoto = function () {
                var options = {
                    //这些参数可能要配合着使用，比如选择了sourcetype是0，destinationtype要相应的设置
                    quality: 100,                                            //相片质量0-100
                    destinationType: Camera.DestinationType.FILE_URI,        //返回类型：DATA_URL= 0，返回作为 base64 編碼字串。 FILE_URI=1，返回影像档的 URI。NATIVE_URI=2，返回图像本机URI (例如，資產庫)
                    sourceType: Camera.PictureSourceType.CAMERA,             //从哪里选择图片：PHOTOLIBRARY=0，相机拍照=1，SAVEDPHOTOALBUM=2。0和1其实都是本地图库
                    allowEdit: false,                                        //在选择之前允许修改截图
                    encodingType: Camera.EncodingType.JPEG,                   //保存的图片格式： JPEG = 0, PNG = 1
                    targetWidth: 800,                                        //照片宽度
                    targetHeight: 800,                                       //照片高度
                    mediaType: 0,                                             //可选媒体类型：圖片=0，只允许选择图片將返回指定DestinationType的参数。 視頻格式=1，允许选择视频，最终返回 FILE_URI。ALLMEDIA= 2，允许所有媒体类型的选择。
                    cameraDirection: 0,                                       //枪后摄像头类型：Back= 0,Front-facing = 1
                    popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: true                                   //保存进手机相册
                };
                $cordovaCamera.getPicture(options).then(function (imageData) {
                    $scope.upImage(imageData);
                }, function (err) {
                    MyDialog.tip(err);
                });
            };
            $scope.upImage = function (imageUrl) {
                MyDialog.showLoading("正在上传图片……");
                document.addEventListener('deviceready', function () {
                    var url = Constant.WebPath + Constant.BackendModule + '/index.php?act=store&op=upload_image&platform=' + $rootScope.platform_name + '&token=' + localStorage.getItem('token');
                    var options = { chunkedMode: false };
                    $cordovaFileTransfer.upload(url, imageUrl, options)
                        .then(function (result) {
                            var data = JSON.parse(result.response);
                            if (data.error !== undefined) {
                                MyDialog.error("上传失败");
                            }
                            else {
                                MyDialog.tip("上传成功");
                                $scope.share.image_url = imageUrl;
                                $scope.share.image = data.filename;
                            }
                        }, function (err) {
                            MyDialog.error(err);
                        }, function (progress) {
                        });
                }, false);
                MyDialog.hideLoading();
            };
            $scope.submit = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'save_myshare',
                    title: $scope.share.title,
                    image: $scope.share.image,
                    content: $scope.share.content,
                    id: $scope.id,
                    status: 1
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        MyDialog.tip("发布成功！");
                        $rootScope.mineReload = true;
                        $rootScope.goback();
                    }
                });
            }
            $scope.gotocg = function () {
                if (StringUtil.isEmpty($scope.id) && ($scope.share.title || $scope.share.image || $scope.share.content)) {
                    MyDialog.confirm("提示", "要保存草稿吗？", "保存", "不保存",
                        function () {
                            ClientOpt.opt({
                                act: 'store',
                                op: 'save_myshare',
                                title: $scope.share.title,
                                image: $scope.share.image,
                                content: $scope.share.content,
                                id: $scope.id,
                                status: 0
                            }, function (json) {
                                if (!StringUtil.isEmpty(json.datas.error)) {
                                    MyDialog.tip(json.datas.error);
                                }
                                else {
                                    $rootScope.mineReload = true;
                                    $rootScope.goback();
                                }
                            });
                        },
                        function () {
                            $rootScope.goback();
                        }
                    );
                }
                else {
                    $rootScope.goback();
                }
            }
        }])
    .controller('MyshareCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.curpage = 0;
            $scope.curTab = 1;
            $scope.getLocalTime = Util.getLocalTime;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
                $scope.init();
                $scope.loadcg();
            });
            $scope.doRefresh = function () {
                $scope.curpage = 0;
                $scope.init();
                $scope.loadcg();
                $scope.$broadcast('scroll.refreshComplete');
            }
            $scope.show = function (curTab) {
                $scope.curTab = curTab;
            }
            $scope.init = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_myshare_list',
                    curpage: $scope.curpage,
                    status: 1
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        if ($scope.curpage == 0) {
                            $scope.share_list = json.datas.share_list;
                        }
                        else {
                            $.each(json.datas.share_list, function (i, item) {
                                $scope.share_list.push(item);
                            });
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                        }
                        $scope.hasmore = json.hasmore;
                    }
                });
            }
            $scope.more = function () {
                $scope.curpage++;
                $scope.init();
            }
            $scope.delete = function (id) {
                MyDialog.confirm("删除确认", "确定要删除这条记录吗？", "删除", "我再想想", function () {
                    ClientOpt.opt({
                        act: 'store',
                        op: 'deleteMyshare',
                        id: id
                    }, function (json) {
                        if (!StringUtil.isEmpty(json.datas.error)) {
                            MyDialog.tip(json.datas.error);
                        }
                        else {
                            MyDialog.tip("删除成功！");
                            $scope.curpage = 0;
                            $scope.init();
                            $rootScope.mineReload = true;
                        }
                    });
                });
            }
            $scope.loadcg = function () {
                ClientOpt.opt({
                    act: 'store',
                    op: 'get_myshare_list',
                    status: 0
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.cg_share_list = json.datas.share_list;
                    }
                });
            }
        }])
    .controller('Evaluate_pjCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.order_id = $state.params.order_id;
            $scope.getLocalTime = Util.getLocalTime;
            $scope.$on('$ionicView.enter', function (scopes, states) {
                $scope.rootEle = $("#evaluate_pj[nav-view='active']");
                $scope.init();
            });
            $scope.init = function () {
                ClientOpt.opt({
                    act: 'jieorder',
                    op: 'get_order_info',
                    order_id: $scope.order_id
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $scope.order_info = json.datas.order_info;
                    }
                });
            }
            $scope.choose = function () {
                $(event.target).parents("ul").find("span").removeClass("cur");
                $(event.target).parents("li").find("span").addClass("cur");
            }
            $scope.submit = function () {
                var rootEle = $scope.rootEle;
                var geval_goods = [];
                $(rootEle).find(".goods").each(function () {
                    var order_goods_id = $(this).find(".order_goods_id").val();
                    var goods_id = $(this).find(".goods_id").val();
                    var goods_name = $(this).find(".goods_name").val();
                    var geval_scores = $(this).find("ul").find(".cur").attr("data-value");
                    var geval_content = $(this).find(".geval_content").val();
                    var geval = order_goods_id + "$|$" + goods_id + "$|$" + goods_name + "$|$" + geval_scores + "$|$" + geval_content;
                    geval_goods.push(geval);
                });
                ClientOpt.opt({
                    act: 'goods',
                    op: 'geval_goods_save',
                    order_id: $scope.order_id,
                    geval_goods: geval_goods.toString()
                }, function (json) {
                    if (!StringUtil.isEmpty(json.datas.error)) {
                        MyDialog.tip(json.datas.error);
                    }
                    else {
                        $rootScope.gotoPage('/myorder/0');
                    }
                });
            }
        }])
    .controller('Fans_listCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.doRefresh = function () {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }])
    .controller('Trade_infoCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.doRefresh = function () {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }])
    .controller('Private_letterCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.doRefresh = function () {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }])
    .controller('Leaving_listCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.doRefresh = function () {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }])
    .controller('BelikeCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.doRefresh = function () {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }])
    .controller('NotifyinfoCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.doRefresh = function () {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }])
    .controller('Tuikuan_detailCtrl', ['$rootScope', '$scope', '$state', '$ionicHistory', '$location', '$ionicModal', '$ionicNativeTransitions', '$filter', 'MyDialog', 'ClientOpt', 'StringUtil', 'Util', '$sce',
        function ($rootScope, $scope, $state, $ionicHistory, $location, $ionicModal, $ionicNativeTransitions, $filter, MyDialog, ClientOpt, StringUtil, Util, $sce) {
            $scope.$on('$ionicView.enter', function (scopes, states) {
                if ($scope.loaded) {
                    return;
                }
                $scope.loaded = true;
            });
            $scope.doRefresh = function () {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }])
    ;
