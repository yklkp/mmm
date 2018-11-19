angular.module('TaxApp', [])
.directive("timelineaxis", function () {
    return {
        restrict: 'AE',
        transclude: true,
        template: '<div class="timeaxis-warpper" ><ul class="timeaxis" ng-transclude></ul></div>'
    };
})

.directive("timeaxisItem", function () {
    return {
        require: '^timeaxis',
        restrict: 'AE',
        transclude: true,
        template: '<li ng-class-even="\'timeaxis-inverted\'" ng-transclude ></li>'
    };
})

.directive("timeaxisPoint", function () {
    return {
        require: '^timeaxisItem',
        restrict: 'AE',
        transclude: true,
        template: '<div  class="timeaxis-point"><span></span></div>'
    };
})


.directive("timeaxisPanel", function () {
    return {
        require: '^timeaxis',
        restrict: 'AE',
        transclude: true,
        template: '<div class="timeaxis-panel" ng-transclude></div>'
    };
})


.directive("timeaxisHide", function () {
    return {
        require: '^timeaxisWarpper',
        restrict: 'AE',
        transclude: true,
        template: '<span class="glyphicon glyphicon-menu-up"></span>'
    };
})
;

