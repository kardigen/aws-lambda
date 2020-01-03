'use strict';

const {debug, info, error, logConfig} = require('./Logger');

const crypto = require('crypto');

class CashBillAuthService {

    static createSignature(data, secret) {
        const dataToSign =
            data +
            secret;

        debug({dataToSign});
        return crypto.createHash('sha1', 'utf-8')
            .update(dataToSign)
            .digest('hex');
    }

    static createNotificationSignature(data, secret) {
        return crypto.createHash('md5')
            .update(data.cmd + data.args + secret)
            .digest('hex');
    }

    static checkNotificationSignature(data, secret) {
        const signature = CashBillAuthService.createNotificationSignature(data, secret);
        return signature === data.sign;
    }

}

module.exports = CashBillAuthService;