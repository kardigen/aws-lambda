'use strict';

const PAYMENT_STATUS_TYPES =
    {
        'init'                  : 'init',
        'PreStart'              : 'init',
        'Start'                 : 'init',
        'PositiveAuthorization' : 'init',
        'PositiveFinish'        : 'success',
        'NegativeAuthorization' : 'error',
        'Abort'                 : 'error',
        'Fraud'                 : 'error',
        'NegativeFinish'        : 'error',
        'TimeExceeded'          : 'error',
        'CriticalError'         : 'error'
    };

class PaymentStatus {

    static getPaymentStatusTypes() {
        return PAYMENT_STATUS_TYPES;
    }

    static findPaymentStatusByCode(code) {
        return this.getPaymentStatusTypes()[code];
    }
}

module.exports = PaymentStatus;