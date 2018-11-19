(function () {
window.RongDemo = {
    common: function (WebIMWidget, config, $scope, ClientOpt) {
        var ClientOpt=ClientOpt;
        WebIMWidget.init(config);
        WebIMWidget.setUserInfoProvider(function(targetId,obj){
            ClientOpt.opt({
                act:  'goods',
                op:  'member_info',
                member_id: targetId
            }, function (json) {
                obj.onSuccess({name:json.datas.member_name,userId:json.datas.member_id,portraitUri:json.datas.member_avatar});
            });
        });
        WebIMWidget.show();
        WebIMWidget.setConversation(WebIMWidget.EnumConversationType.PRIVATE,$scope.targetId,$scope.seller_name);
    }
}
})()