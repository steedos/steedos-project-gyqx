const objectql = require('@steedos/objectql');
// 销售明细
module.exports = {
    listenTo: 'sale_detail__c',
// 新建时校验
    beforeInsert: async function () {
        console.log('====>',this);
        await _checkClassifyAndRisk(this.doc, this.id);
    },
// 编辑时校验
    beforeUpdate: async function () {
        await _checkClassifyAndRisk(this.doc, this.id);
    },
};

async function _checkClassifyAndRisk(doc, id) {
    if (doc.sale__c && doc.product__c) {
        let steedosSchema = objectql.getSteedosSchema();
        let sale = await steedosSchema.getObject('sale__c').findOne(doc.sale__c, { fields: ['customer__c'] });
        let customer = await steedosSchema.getObject('customer__c').findOne(sale.customer__c, { fields: ['check_new__c'] });
        let product = await steedosSchema.getObject('product__c').findOne(doc.product__c, { fields: ['product_type_new__c','risk_new__c'] });
        console.log('sale====>',sale,product,customer);
        // 客户类型为校验新分类&商品新风险等级为001
        if (customer.check_new__c && product.risk_new__c == '001') {
            //根据商品获取新产品分类product_type_new__c
            //根据客户获取营业执照类型的新Ⅰ类经营范围
            console.log('11====>');
            //新建提交时，查customer_certification__c表提示not find user permission
            let customer_certification = await steedosSchema.getObject('customer_certification__c').find(sale.customer__c, {filters: [['cretification__c','=','营业执照']], fields: ['first_new__c'] });
            console.log('22====>',customer_certification);
            let same = _.intersection(product.product_type_new__c, customer_certification.first_new__c);
            console.log('product====>',product,customer_certification,same);
            same.sort();
            same.join(",");
            product.product_type_new__c.sort();
            product.product_type_new__c.join(",");
            console.log('same====>',product,same);
            if (same != product.product_type_new__c) {
                throw new Error('新旧分类校验不通过，请完善相关资料。');
            }
        }
    }
}