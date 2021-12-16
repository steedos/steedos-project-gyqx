const objectql = require('@steedos/objectql');
const _ = require('lodash');
// 销售明细
module.exports = {
    listenTo: 'sale_detail__c',
// 新建时校验
    beforeInsert: async function () {
        await _checkClassifyAndRisk(this.doc, this.id);
    },
// 编辑时校验
    beforeUpdate: async function () {
        await _checkClassifyAndRisk(this.doc, this.id);
    },
};

async function _checkClassifyAndRisk(doc, id) {
    if (doc.sale__c && doc.product__c) {
        //获取主表信息：销售记录
        let sale = await objectql.getObject('sale__c').findOne(doc.sale__c, { fields: ['customer__c'] });
        // 获取公司新旧配置
        let customer = await objectql.getObject('customer__c').findOne(sale.customer__c, { fields: ['check_new__c', 'check_old__c'] });
        // 获取商品信息
        let product = await objectql.getObject('product__c').findOne(doc.product__c, { fields: ['product_type_new__c', 'risk_new__c', 'product_type__c', 'risk__c'] });

        let checkNewPassed = null;

        //需要校验新分类
        if (customer.check_new__c) {
            checkNewPassed = await checkNew(sale, product);
        }

        //新分类校验通过，直接返回, 不再继续校验
        if (checkNewPassed) {
            return true;
        }

        let checkOldPassed = null;

        //需要校验旧分录
        if (customer.check_old__c) {
            checkOldPassed = await checkOld(sale, product);
        }

        if (checkOldPassed) {
            return true;
        }

        if (_.isNull(checkNewPassed) && _.isNull(checkOldPassed)) {
            throw new objectql.SteedosError(`新旧分类校验`, `新、旧分类均至少需要校验1项, 请调整客户信息`)
        }

        if (_.isNull(checkNewPassed) && !_.isNull(checkOldPassed)) {
            throw new objectql.SteedosError(`新旧分类校验`, `旧分类验未通过`)
        }

        if (!_.isNull(checkNewPassed) && !_.isNull(checkOldPassed)) {
            throw new objectql.SteedosError(`新旧分类校验`, `新、旧分类校验均未通过`)
        }

    }
}

/**
 * 获取经营范围
 * @param {*} customer__c ：客户标识
 * @param {*} isNew ：是否新分类
 * @param {*} risk ：风险等级标识
 */
async function getBusinessScope(customer__c, isNew, risk) {
    let scopes = [];
    let key = '';
    if (isNew) {
        switch (risk) {
            case '001':
                key = 'first_new__c';
                break;
            case '002':
                key = 'second_new__c';
                break;
            case '003':
                key = 'third_new__c';
                break;
        }
    } else {
        switch (risk) {
            case '001':
                key = 'first__c';
                break;
            case '002':
                key = 'second__c';
                break;
            case '003':
                key = 'third__c';
                break;
        }
    }

    if (!key) {
        return scopes
    }

    const records = await objectql.getObject('customer_certification__c').find(customer__c, { filters: [['cretification__c', '=', '营业执照']], fields: [key] });

    _.each(records, (record) => {
        scopes = scopes.concat(record[key] || [])
    })

    return scopes;
}

/**
 * 新分类校验
 * @param {*} sale 销售信息
 * @param {*} product 产品信息
 * @returns 
 */
async function checkNew(sale, product) {
    const { product_type_new__c, risk_new__c } = product;
    const scopes = await getBusinessScope(sale.customer__c, true, risk_new__c);
    return _.includes(scopes, product_type_new__c)
}

/**
 * 旧分类校验
 * @param {*} sale 销售信息
 * @param {*} product  产品信息
 * @returns 
 */
async function checkOld(sale, product) {
    const { product_type__c, risk__c } = product;
    const scopes = await getBusinessScope(sale.customer__c, false, risk__c);
    return _.includes(scopes, product_type__c)
}