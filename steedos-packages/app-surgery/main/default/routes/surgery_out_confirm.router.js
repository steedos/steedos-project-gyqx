const express = require("express");
const router = express.Router();
const core = require('@steedos/core');
const objectql = require('@steedos/objectql');
/**
 * 出库单确认
 * body {
 *  recordId 出库单ID
 * }
 */
router.post('/api/surgery/out/confirm', core.requireAuthentication, async function (req, res) {
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
        const outObj = objectql.getObject('surgery_out__c');
        const outDetailObj = objectql.getObject('surgery_out_details__c');
        const receiveObj = objectql.getObject('surgery_receive__c');
        const receiveDetailObj = objectql.getObject('surgery_receive_details__c');

        const outDoc = await outObj.findOne(recordId);
        if (!outDoc) {
            throw new Error(`根据ID ${recordId} 未找到记录，请确认。`);
        }

        // 生成新记录
        const now = new Date();
        const baseInfo = {
            created: now,
            modified: now
        }
        const outDetailDocs = await outDetailObj.find({ filters: [['surgery_out__c', '=', recordId]] });
        const disNewDoc = await receiveObj.insert({
            ...outDoc,
            ...baseInfo,
        })
        for (const doc of outDetailDocs) {
            delete doc.surgery_out__c;
            await receiveDetailObj.insert({
                ...doc,
                'surgery_receive__c': disNewDoc._id,
                ...baseInfo,
            })
        }

        // 更新手术请领单状态
        await requestObj.update(outDoc.surgery_request__c, { state__c: '已出库' });

        res.status(200).send({ success: true, message: 'router ok' });
    } catch (error) {
        res.status(200).send({ success: false, error: error.message });
    }
});
exports.default = router;