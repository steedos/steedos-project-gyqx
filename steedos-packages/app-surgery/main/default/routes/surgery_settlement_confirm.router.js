const express = require("express");
const router = express.Router();
const core = require('@steedos/core');
const objectql = require('@steedos/objectql');
/**
 * 结算单确认
 * body {
 *  recordId 结算单ID
 * }
 */
router.post('/api/surgery/settlement/confirm', core.requireAuthentication, async function (req, res) {
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
        const settlementObj = objectql.getObject('surgery_settlement__c');

        const settlementDoc = await settlementObj.findOne(recordId);
        if (!settlementDoc) {
            throw new Error(`根据ID ${recordId} 未找到记录，请确认。`);
        }

        // 更新手术请领单状态
        await requestObj.update(settlementDoc.surgery_request__c, { state__c: '已结算' });

        res.status(200).send({ success: true, message: 'router ok' });
    } catch (error) {
        res.status(200).send({ success: false, error: error.message });
    }
});
exports.default = router;