const express = require("express");
const router = express.Router();
const core = require('@steedos/core');
const objectql = require('@steedos/objectql');
/**
 * 配货单单确认
 * body {
 *  recordId 配货单ID
 * }
 */
router.post('/api/surgery/distribution/confirm', core.requireAuthentication, async function (req, res) {
    try {
        // const userSession = req.user;
        // const spaceId = userSession.spaceId;
        // const userId = userSession.userId;
        // const isSpaceAdmin = userSession.is_space_admin;
        const { recordId } = req.body;
        if (!recordId) {
            throw new Error('参数 recordId 为空。');
        }
        const requestObj = objectql.getObject('surgery_request__c');
        const distributionObj = objectql.getObject('surgery_distribution__c');
        const distributionDetailObj = objectql.getObject('surgery_distribution_details__c');
        const outObj = objectql.getObject('surgery_out__c');
        const outDetailObj = objectql.getObject('surgery_out_details__c');

        const distributionDoc = await distributionObj.findOne(recordId);
        if (!distributionDoc) {
            throw new Error(`根据ID ${recordId} 未找到记录，请确认。`);
        }

        // 生成新记录
        const now = new Date();
        const baseInfo = {
            created: now,
            modified: now
        }
        const distributionDetailDocs = await distributionDetailObj.find({ filters: [['surgery_distribution__c', '=', recordId]] });
        const disNewDoc = await outObj.insert({
            ...distributionDoc,
            ...baseInfo,
        })
        for (const doc of distributionDetailDocs) {
            delete doc.surgery_distribution__c;
            await outDetailObj.insert({
                ...doc,
                'surgery_out__c': disNewDoc._id,
                ...baseInfo,
            })
        }

        // 更新手术请领单状态
        await requestObj.update(distributionDoc.surgery_request__c, { state__c: '已配货' });

        res.status(200).send({ success: true, message: 'router ok' });
    } catch (error) {
        res.status(200).send({ success: false, error: error.message });
    }
});
exports.default = router;