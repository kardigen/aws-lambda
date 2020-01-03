'use strict';

const _EMAIL_PATTERN = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
module.exports.EMAIL_PATTERN = _EMAIL_PATTERN;

const _MIN_PASS_LENGTH = 8;
module.exports.MIN_PASS_LENGTH = _MIN_PASS_LENGTH;

const _AUTOSEND_EMAIL_ADDRESS = "Enigmata.pl <no-reply@enigmata.pl>";
module.exports.AUTOSEND_EMAIL_ADDRESS = _AUTOSEND_EMAIL_ADDRESS;

const _PAYMENTS_EMAIL_ADDRESS = "Enigmata.pl <payments@enigmata.pl>";
module.exports.PAYMENTS_EMAIL_ADDRESS = _PAYMENTS_EMAIL_ADDRESS;

const _INFO_EMAIL_ADDRESS = "Enigmata.pl <info@enigmata.pl>";
module.exports.INFO_EMAIL_ADDRESS = _INFO_EMAIL_ADDRESS;
