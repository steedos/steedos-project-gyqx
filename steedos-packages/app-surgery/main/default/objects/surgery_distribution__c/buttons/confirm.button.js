module.exports = {
    confirm: function (object_name, record_id) {
        $(document.body).addClass('loading');
        let url = '/api/surgery/distribution/confirm';
        let options = {
            type: 'post',
            async: true,
            data: JSON.stringify({
                recordId: record_id
            }),
            success: function (data) {
                toastr.success('已确认。');
                $(document.body).removeClass('loading');
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.error(XMLHttpRequest.responseJSON);
                toastr.error(XMLHttpRequest.responseJSON.error.replace(/:/g, '：'))
                $(document.body).removeClass('loading');
            }
        };
        Steedos.authRequest(url, options);
    },
    confirmVisible: function (object_name, record_id, permissions, record) {
        // const doc = Creator.odata.get(object_name, record_id, 'state__c');
        // TODO 何时显示
        return true;
    }
}