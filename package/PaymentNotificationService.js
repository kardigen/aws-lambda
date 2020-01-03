'use strict';
const CashBillAuthService = require('./CashBillAuthService');
const PaymentStatus = require('./PaymentStatus');
const Constants = require('./Constants');
const {debug, info, error, logConfig} = require('./Logger');

class PaymentNotificationService {

    constructor(dbClient, ses, cbService, paymentSecret, debug_set_state){
        this.db = dbClient;
        this.ses = ses;
        this.cbService = cbService;
        this.paymentSecret = paymentSecret;
        this._debug_set_state = debug_set_state;
    }

    createResponse(status) {
        return {
            "status": status
        };
    }

    handlePaymentNotification(queryStringParameters, callback) {
        info({message:'Request query parameters', queryStringParameters});
        const isRequestValid = queryStringParameters
            && queryStringParameters.cmd === 'transactionStatusChanged'
            && queryStringParameters.args
            && queryStringParameters.sign;

        if(isRequestValid){
            info("Request structure is valid");
            const params = queryStringParameters;
            if(CashBillAuthService.checkNotificationSignature(params, this.paymentSecret) || this._debug_set_state){

                let checkStatePromise;
                if( this._debug_set_state && params.state ){
                    info({message:"DEBUG MODE - setting payment state",  state: params.state});
                    const ids = params.args.split(':');
                    if(ids.length === 2) {
                        const eid = ids[0];
                        const transactionId = ids[1];
                        info({message:'Parsed IDs', eid, transactionId});
                        logConfig().setLogContext({eid, transactionId});
                        checkStatePromise = Promise.resolve({paymentState: params.state, eid: eid, transactionId: transactionId,
                            internalTransactionId: "", details:{}})
                    } else {
                        checkStatePromise = Promise.reject({
                            message: "Invalid payment notification args",
                            args: params.args
                        });
                    }
                } else {
                    const transactionId = params.args;
                    checkStatePromise = this.cbService.promiseGetPaymentStatus(transactionId)
                        .then()
                        .then((payment) => {
                            info({message: 'CB Service returned', payment});
                            const additionalData = JSON.parse(payment.additionalData);
                            logConfig().setLogContext({eid: additionalData.eid, transactionId});
                            return {paymentState: payment.status, eid: additionalData.eid, transactionId: transactionId,
                                internalTransactionId: additionalData.transactionId , details: payment};
                        });
                }

                checkStatePromise
                    .then((context) => {
                        debug({context});
                        let creditsUpdate = false;

                        info({message:'Received payment state', paymentState: context.paymentState});
                        if(PaymentStatus.findPaymentStatusByCode(context.paymentState) === 'success'){
                            info("Received PositiveFinish payment state - updating credits");
                            creditsUpdate = true;
                            context = Object.assign({}, context, {creditsUpdate: creditsUpdate});
                        }

                        return this
                            .promiseSaveTransactionState(context.eid, context.transactionId, context.paymentState, context.creditsUpdate)
                            .then( user => {
                                debug({user});
                                return Object.assign({}, context, {user: user})})
                    })
                    .then((context) => {
                        debug({context});
                        if(context.creditsUpdate){
                            return this.promiseSendPaymentConfirmationEmail(context.user)
                                .then(()=>{ return context; })
                        } else {
                            return context;
                        }
                    })
                    .then((context) => {
                        debug({context});
                        info("Request success - creating response 200");
                        callback(this.createResponse(200));
                    })
                    .catch((errorMsg)=>{
                        error({message:"Error occurred - creating response 200.", queryStringParameters, errorMsg});
                        callback(this.createResponse(200));
                    });
            } else {
                error({message: "Signature is invalid - creating response 200", queryStringParameters});
                callback(this.createResponse(200));
            }
        } else {
            error({message: "Request structure is invalid - creating response 200", queryStringParameters});
            callback(this.createResponse(200));
        }
    }


    promiseSaveTransactionState(eid, transactionId, state, creditsUpdate) {
        debug({eid, transactionId, state, creditsUpdate});
        let updateExpression = "SET currentCreditPlan.payment.statusCode = :payment_statusCode";
        if(creditsUpdate) {
            updateExpression += ", userStatistics.credits = userStatistics.credits + currentCreditPlan.creditPlan.credits"
        }

        const conditionExpression =
            "currentCreditPlan.payment.externalTransactionId = :externalTransactionId " +
            "AND currentCreditPlan.payment.statusCode <> :payment_statusCode_cond";

        const values = {
            ':payment_statusCode': state,
            ':payment_statusCode_cond': state,
            ':externalTransactionId': transactionId
        };

        const params = {
            TableName: "Users",
            Key: {"eid": eid},
            UpdateExpression: updateExpression,
            ConditionExpression: conditionExpression,
            ExpressionAttributeValues: values,
            ReturnValues: "ALL_NEW"
        };

        info({message:"Updating user in db.", params});
        return this.db.update(params)
            .promise()
            .then((data) => {
                info({message:"Update user success.", result:data});
                return data && data.Attributes;
            })
    }

    promiseSendPaymentConfirmationEmail(user){
        debug({user});

        const params = {
            "Source": Constants.AUTOSEND_EMAIL_ADDRESS,
            "Template": "PaymentConfirmation",
            "ConfigurationSetName": "",
            "Destination": { "ToAddresses": [ user.login ] },
            "TemplateData": JSON.stringify({
                "nick": user.nick ,
                "plan": user.currentCreditPlan.creditPlan.header + " " + user.currentCreditPlan.creditPlan.headerHint,
                "credit_amount":  user.currentCreditPlan.creditPlan.credits })
        };

        info({message:"Sending payment confirmation email.", params});
        return this.ses.sendTemplatedEmail(params)
            .promise()
    }
}

module.exports = PaymentNotificationService;