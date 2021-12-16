const objectql = require('@steedos/objectql');

const checkStatus = async function (record, isDeleted) {
    const { risk__c, company_code__c, supplier__c, batch_type__c, customer__c } = record;
    let { certification__c, validate__c } = record;

    // 定义唯一查询：公司编码+供应商分类（或者客户分类或者公司批零类型）+风险等级
    const uniqueFilters = [];

    uniqueFilters.push(['company_code__c', '=', company_code__c]);
    uniqueFilters.push(['risk__c', '=', risk__c]);

    if (supplier__c) {
        uniqueFilters.push(['supplier__c', '=', supplier__c]);
    } else if (batch_type__c) {
        uniqueFilters.push(['batch_type__c', '=', batch_type__c]);
    } else if (customer__c) {
        uniqueFilters.push(['customer__c', '=', customer__c]);
    }


    if (isDeleted) {
        const records = await objectql.getObject('configuration_table__c').find({ filters: uniqueFilters })
        if (!records || records.length === 1) {
            return;
        } else {
            //优先取 范围效期校验 = Y
            let peerRecord = _.find(records, (record) => {
                return record.validate__c === 'Y';
            })
            if (!peerRecord) {
                peerRecord = records[0];
            }
            certification__c = peerRecord.certification__c;
            validate__c = peerRecord.validate__c;
        }
    }


    //【必有证照校验】中如果有维护O，则需要至少有两行是O
    if (certification__c === 'O') {
        uniqueFilters.push(['certification__c', '=', certification__c])
        const recordsCount = await objectql.getObject('configuration_table__c').count({ filters: uniqueFilters });
        if (recordsCount < 2) {
            await objectql.getObject('configuration_table__c').updateMany(uniqueFilters, { states__c: 'invalid', remark__c: '需要至少有两行是O' });
        } else {
            await objectql.getObject('configuration_table__c').updateMany(uniqueFilters, { states__c: 'valid', remark__c: '' });
        }
    }

    //【范围效期校验】中如果有维护O，则需要至少有两行是O；
    if (validate__c === 'O') {
        uniqueFilters.push(['validate__c', '=', validate__c])
        const recordsCount = await objectql.getObject('configuration_table__c').count({ filters: uniqueFilters });
        if (recordsCount < 2) {
            await objectql.getObject('configuration_table__c').updateMany(uniqueFilters, { states__c: 'invalid', remark__c: '需要至少有两行是O' });
        } else {
            await objectql.getObject('configuration_table__c').updateMany(uniqueFilters, { states__c: 'valid', remark__c: '' });
        }
    }

    //【范围效期校验】中如果有维护Y，则有且只能有一个Y，且不能有为O的行；
    if (validate__c === 'Y') {
        const recordsCountY = await objectql.getObject('configuration_table__c').count({ filters: uniqueFilters.concat(['validate__c', '=', validate__c]) });
        if (recordsCountY != 1) {
            await objectql.getObject('configuration_table__c').updateMany(uniqueFilters, { states__c: 'invalid', remark__c: '有且只能有一个Y，且不能有为O的行' });
        }

        const recordsCountO = await objectql.getObject('configuration_table__c').count({ filters: uniqueFilters.concat(['validate__c', '=', 'O']) });
        if (recordsCountO != 0) {
            await objectql.getObject('configuration_table__c').updateMany(uniqueFilters, { states__c: 'invalid', remark__c: '有且只能有一个Y，且不能有为O的行' });
        }

        if (recordsCountY === 1 && recordsCountO === 0) {
            await objectql.getObject('configuration_table__c').updateMany(uniqueFilters, { states__c: 'valid', remark__c: '' });
        }
    }
}

module.exports = {
    listenTo: 'configuration_table__c',
    //添加记录后执行
    afterInsert: async function () {
        const { id } = this;
        const record = await objectql.getObject('configuration_table__c').findOne(id);
        await checkStatus(record);
    },
    //修改记录后执行
    afterUpdate: async function () {
        const { id } = this;
        const record = await objectql.getObject('configuration_table__c').findOne(id);
        await checkStatus(record);
    },
    //删除记录后执行
    afterDelete: async function () {
        const { previousDoc } = this;
        await checkStatus(previousDoc, true);
    },

}