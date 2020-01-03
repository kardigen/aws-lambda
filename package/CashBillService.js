'use strict';
const querystring = require('querystring');
const CashBillAuthService = require('./CashBillAuthService');
const httpRequest = require('request');
const {debug, info, error, logConfig} = require('./Logger');

class CashBillService {

    constructor(serviceUrl, shopId, secretPhrase){
        this.serviceUrl = serviceUrl;
        this.shopId = shopId;
        this.secretPhrase = secretPhrase;
    }

    promiseStartPayment(data, redirectUrl) {
        try {
            const request = {
                'title': data.title,
                'description': data.description,
                'amount.value': data.value,
                'amount.currencyCode': data.currency,
                'additionalData': data.additionalData,
                'referer': data.transactionId,
                'returnUrl': redirectUrl,
                'languageCode': 'PL'
            };

            const requestSignatureSequence =
                request['title'] +
                request['amount.value'] +
                request['amount.currencyCode'] +
                request['returnUrl'] +
                request['description'] +
                request['additionalData']  +
                request['languageCode'] +
                request['referer'];

            request['sign'] = CashBillAuthService.createSignature(requestSignatureSequence, this.secretPhrase);

            const url = this.serviceUrl + "/payment/" + this.shopId;
            info({message: 'Starting payment', url, request});
            const encodedRequest = querystring.stringify(request);
            debug({message: 'Encoded request', encodedRequest});
            return new Promise((resolve, reject)=> {
                try{
                    httpRequest.post({url: url, body: encodedRequest, headers:{'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'}},
                        function (err, httpResponse, body) {
                            try {
                                debug({err, httpResponse, body});
                                if (err) {
                                    reject(err);
                                }
                                resolve(JSON.parse(body));
                            } catch (e) {
                                error({message: 'PromiseStartPayment request post exception.', exception: e});
                                reject(e);
                            }
                        });
                } catch (e) {
                    error({message: 'PromiseStartPayment request exception.', exception: e});
                    reject(e);
                }
            });
        }
        catch (e) {
            return Promise.reject(e);
        }
    }


    promiseGetPaymentStatus(transactionId){
        try {
            const signature = CashBillAuthService.createSignature(transactionId, this.secretPhrase);
            const url = this.serviceUrl + "/payment/" + this.shopId + "/" + transactionId + '?sign=' + signature;
            info({message: 'Get payment status', url});
            return new Promise((resolve, reject) => {
                try {
                    httpRequest.get({url: url},
                        function (err, httpResponse, body) {
                            try {
                                debug({err, httpResponse, body});
                                if (err) {
                                    reject(err);
                                }
                                resolve(JSON.parse(body));
                            } catch (e) {
                                error({message: 'promiseGetPaymentStatus request post exception.', exception: e});
                                reject(e);
                            }
                        });
                } catch (e) {
                    error({message: 'promiseGetPaymentStatus request exception.', exception: e});
                    reject(e);
                }
            });
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}

module.exports = CashBillService;
