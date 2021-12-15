const express = require("express");
const router = express.Router();
const core = require('@steedos/core');
const objectql = require('@steedos/objectql');
/**
 * 扫码返库单确认
 * body {
 *  recordId 扫码返库单ID
 * }
 */
router.post('/api/surgery/return/confirm', core.requireAuthentication, async function (req, res) {
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
        const returnObj = objectql.getObject('surgery_return__c');
        const returnDetailObj = objectql.getObject('surgery_return_details__c');
        const settlementObj = objectql.getObject('surgery_settlement__c');
        const settlementDetailObj = objectql.getObject('surgery_settlement_details__c');

        const returnDoc = await returnObj.findOne(recordId);
        if (!returnDoc) {
            throw new Error(`根据ID ${recordId} 未找到记录，请确认。`);
        }

        // 生成新记录
        const now = new Date();
        const baseInfo = {
            created: now,
            modified: now
        }
        const returnDetailDocs = await returnDetailObj.find({ filters: [['surgery_return__c', '=', recordId]] });
        const disNewDoc = await settlementObj.insert({
            ...returnDoc,
            ...baseInfo,
        })
        for (const doc of returnDetailDocs) {
            delete doc.surgery_return__c;
            await settlementDetailObj.insert({
                ...doc,
                'surgery_settlement__c': disNewDoc._id,
                ...baseInfo,
            })
        }

        // 更新手术请领单状态
        await requestObj.update(returnDoc.surgery_request__c, { state__c: '已还回' });

        res.status(200).send({ success: true, message: 'router ok' });
    } catch (error) {
        res.status(200).send({ success: false, error: error.message });
    }
});
exports.default = router;