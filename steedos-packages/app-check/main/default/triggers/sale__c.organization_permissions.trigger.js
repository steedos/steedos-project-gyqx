const objectql = require('@steedos/objectql');
const auth = require('@steedos/auth');
const _ = require('lodash');
module.exports = {
    listenTo: 'sale__c',

    beforeInsert: async function () {
        //从trigger的上下文(this) 中获取用户Id, 工作区Id, 当前添加的记录
        const { userId, spaceId, doc } = this;
        //获取当前用户的session
        const userSession = await auth.getSessionByUserId(userId, spaceId);

        //设置记录的组织字段值
        doc.organization = _.pick(userSession.organization, '_id');
        doc.organizations = _.map(userSession.organizations, '_id');
    },

    beforeAggregate: async function () {
        //从trigger的上下文(this) 中获取用户Id, 工作区Id, 查询信息
        const { userId, spaceId, query } = this;
        //获取当前用户的session
        const userSession = await auth.getSessionByUserId(userId, spaceId);

        if (userSession) {
            //再原来查询的过滤条件上添加组织级权限限制
            query.filters = [query.filters, 'and', [['organization', '=', userSession.organization._id], 'or', ['organizations', '=', userSession.organization._id]]]
        }
    },
    beforeFind: async function () {
        //从trigger的上下文(this) 中获取用户Id, 工作区Id, 查询信息
        const { userId, spaceId, query } = this;
        //获取当前用户的session
        const userSession = await auth.getSessionByUserId(userId, spaceId);

        if (userSession) {
            //再原来查询的过滤条件上添加组织级权限限制
            query.filters = [query.filters, 'and', [['organization', '=', userSession.organization._id], 'or', ['organizations', '=', userSession.organization._id]]]
        }
    }
}