'use strict';

angular.module('mobistore.directives', [])

.directive('hideTabBar', ['$rootScope', function($rootScope) {
    return {
        restrict: 'A',
        link: function($scope, $el) {
            $rootScope.hideTabs = true;
            $scope.$on('$destroy', function() {
                $rootScope.hideTabs = false;
            });
        }
    };
}])
    .directive('myRepeatFinished', ['$rootScope', function($rootScope) {
        return {
            link: function(scope,element,attr) {
                if(scope.$last == true){
                    scope.$eval( attr.myRepeatFinished );
                }
            }
        };
    }])
    .directive('myRepeatRow', ['$rootScope', function($rootScope) {
        return {
            link: function(scope,element,attr) {
                scope.$eval( attr.myRepeatRow );
            }
        };
    }])
    .directive('goodsdetailimgresize',['$window', function ($window) {
    return {
        link: function(scope, element) {
            element.addClass("empty");
            element.bind("load" , function(e){
                var height=element.height();
                var width=element.width();
                var pEle=element.parent();
                // var pWidth=pEle.width();
                var w = angular.element($window);
                var pWidth=w.width();
                var pHeight=pEle.height();
                var m=width/pWidth;
                var n=height/pHeight
                if(m>=1&&n<=1)
                {
                    width=Math.ceil(width/m);
                    height=Math.ceil(height/m);
                    element.width(width);
                    element.height(height);
                }
                else if(m<=1&&n>=1)
                {
                    width=Math.ceil(width/n);
                    height=Math.ceil(height/n);
                    element.width(width);
                    element.height(height);
                }
                else if(m>=1&&n>=1 || m<1 && n<1)
                {
                    var getMAX=Math.max(m,n);
                    width=Math.ceil(width/getMAX);
                    height=Math.ceil(height/getMAX);
                    element.width(width);
                    element.height(height);
                }
                if(height<pHeight)
                {
                    var getDistance=Math.floor((pHeight-height)/2);
                    element.css("margin-top",getDistance+"px");
                }
                element.removeClass("empty");
            });
        }
    }
}])
    .directive('goodslistimgresize',function () {
        return {
            link: function(scope, element) {
                // element.addClass("empty");
                element.bind("load" , function(e){
                    var height=element.height();
                    var width=element.width();
                    var pEle=element.parent();
                    var pWidth=pEle.width();
                    var pHeight=pEle.height();
                    var m=width/pWidth;
                    var n=height/pHeight;
                    if(m>=1&&n<=1)
                    {
                        width=Math.ceil(width/m);
                        height=Math.ceil(height/m);
                        element.width(width);
                        element.height(height);
                    }
                    else if(m<=1&&n>=1)
                    {
                        width=Math.ceil(width/n);
                        height=Math.ceil(height/n);
                        element.width(width);
                        element.height(height);
                    }
                    else if(m>=1&&n>=1 || m<1 && n<1)
                    {
                        var getMAX=Math.max(m,n);
                        width=Math.ceil(width/getMAX);
                        height=Math.ceil(height/getMAX);
                        element.width(width);
                        element.height(height);
                    }
                    if(height<pHeight)
                    {
                        var getDistance=Math.floor((pHeight-height)/2);
                        element.css("margin-top",getDistance+"px");
                    }
                    // element.removeClass("empty");
                });
            }
        }
    })
    .directive('scrollHeightMine',function($window){
        return{
            restrict:'AE',
            link:function(scope,element,attr){
                element[0].style.height=($window.innerHeight-350)+'px';
            }
        }
    })
    .directive('slideboxDynamicHeight',
        ['$timeout', '$ionicSlideBoxDelegate', '$ionicScrollDelegate',
            function ($timeout, $ionicSlideBoxDelegate, $ionicScrollDelegate) {
                return {
                    require: ['^ionSlideBox'],
                    link: function(scope, elem, attrs, slider) {
                        scope.$watch(function() {
                            return slider[0].__slider.selected();
                        }, function(val) {
                            //getting the heigh of the container that has the height of the viewport
                            var parents=elem.parent().parent()[0];
                            var curEle=elem[0];
                            var  ind=elem.attr("data-index");
                            if(ind==undefined){
                                parents.style.height = "auto";
                            }
                            else if(ind==val){
                                var newHeight = window.getComputedStyle(curEle, null).getPropertyValue("height");
                                if (newHeight && newHeight!=="0px") {
                                    parents.style.height = newHeight;
                                }
                            }
                        });
                    }
                };
            }]);
;
