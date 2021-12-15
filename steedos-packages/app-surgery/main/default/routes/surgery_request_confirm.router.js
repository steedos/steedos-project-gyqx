const express = require("express");
const router = express.Router();
const core = require('@steedos/core');
const objectql = require('@steedos/objectql');
/**
 * 手术请领单确认
 * body {
 *  recordId 手术请领单ID
 * }
 */
router.post('/api/surgery/request/confirm', core.requireAuthentication, async function (req, res) {
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
        const requestDetailObj = objectql.getObject('surgery_request_details__c');
        const distributionObj = objectql.getObject('surgery_distribution__c');
        const distributionDetailObj = objectql.getObject('surgery_distribution_details__c');

        const requestDoc = await requestObj.findOne(recordId);
        if (!requestDoc) {
            throw new Error(`根据ID ${recordId} 未找到记录，请确认。`);
        }

        // 生成新记录
        const now = new Date();
        const baseInfo = {
            created: now,
            modified: now
        }
        const requestDetailDocs = await requestDetailObj.find({ filters: [['surgery_request__c', '=', recordId]] });
        const disNewDoc = await distributionObj.insert({
            ...requestDoc,
            'surgery_request__c': recordId,
            ...baseInfo,
        })
        for (const doc of requestDetailDocs) {
            delete doc.surgery_request__c;
            await distributionDetailObj.insert({
                ...doc,
                'surgery_distribution__c': disNewDoc._id,
                ...baseInfo,
            })
        }

        // 更新手术请领单状态
        await requestObj.update(requestDoc._id, { state__c: '已审核' });

        res.status(200).send({ success: true, message: 'router ok' });
    } catch (error) {
        res.status(200).send({ success: false, error: error.message });
    }
});
exports.default = router;