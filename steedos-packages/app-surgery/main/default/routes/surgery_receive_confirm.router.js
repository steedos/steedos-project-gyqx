const express = require("express");
const router = express.Router();
const core = require('@steedos/core');
const objectql = require('@steedos/objectql');
/**
 * 签收单确认
 * body {
 *  recordId 签收单ID
 * }
 */
router.post('/api/surgery/receive/confirm', core.requireAuthentication, async function (req, res) {
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
        const receiveObj = objectql.getObject('surgery_receive__c');
        const receiveDetailObj = objectql.getObject('surgery_receive_details__c');
        const returnObj = objectql.getObject('surgery_return__c');
        const returnDetailObj = objectql.getObject('surgery_return_details__c');

        const receiveDoc = await receiveObj.findOne(recordId);
        if (!receiveDoc) {
            throw new Error(`根据ID ${recordId} 未找到记录，请确认。`);
        }

        // 生成新记录
        const now = new Date();
        const baseInfo = {
            created: now,
            modified: now
        }
        const receiveDetailDocs = await receiveDetailObj.find({ filters: [['surgery_receive__c', '=', recordId]] });
        const disNewDoc = await returnObj.insert({
            ...receiveDoc,
            ...baseInfo,
        })
        for (const doc of receiveDetailDocs) {
            delete doc.surgery_receive__c;
            await returnDetailObj.insert({
                ...doc,
                'surgery_return__c': disNewDoc._id,
                ...baseInfo,
            })
        }

        // 更新手术请领单状态
        await requestObj.update(receiveDoc.surgery_request__c, { state__c: '已签收' });

        res.status(200).send({ success: true, message: 'router ok' });
    } catch (error) {
        res.status(200).send({ success: false, error: error.message });
    }
});
exports.default = router;