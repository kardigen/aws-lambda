'use strict';

const AWS = require('aws-sdk');
const PaymentNotificationService = require('./PaymentNotificationService');
const CashBillService = require('./CashBillService');
const {debug, info, error, logConfig} = require('./Logger');

const ENIGMATA_WEBSITE = process.env.destination_url;
const TESTING_MODE  = process.env.testing_mode === 'true';
const PAYMENT_SECRET = process.env.payment_secret;
const PAYMENT_SHOP_ID = process.env.payment_shop_id;
const PAYMENT_SERVICE = process.env.payment_service_url;

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({region: "eu-west-1"});

const cbService = new CashBillService(PAYMENT_SERVICE, PAYMENT_SHOP_ID, PAYMENT_SECRET);

logConfig().setDebugEnabled(process.env.debug_log_enabled === 'true');
info("DEBUG log is: " + (process.env.debug_log_enabled === 'true'));

module.exports.paymentStatusChanged = (event, context, callback) => {
    logConfig().clearContext();
    debug({event, context});
    const badRequestResponse = {
        statusCode: 400 ,
        body: "",
    };

    if(event.queryStringParameters){
        new PaymentNotificationService(dynamoDB, ses, cbService, PAYMENT_SECRET, TESTING_MODE)
            .handlePaymentNotification(event.queryStringParameters, (result) => {
                debug({result});
                const response = {
                    statusCode: 200,
                    body: "OK"
                };

                info({message:"Sending response.", response});
                callback(null, response);
            })
    }
    else {
        error("No query params - returning 400");
        callback(null, badRequestResponse);
    }
};
