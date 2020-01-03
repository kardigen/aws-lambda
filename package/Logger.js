const caller = require('caller-id');

const DELIM = "|#>";

const LOGGING_SYMBOL = Symbol.for("pl.enigmata.logging");

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

const globalSymbols = Object.getOwnPropertySymbols(global);
const hasSymbol = (globalSymbols.indexOf(LOGGING_SYMBOL) > -1);

if (!hasSymbol) {
    class Logger {

        constructor() {
            this.logCollector = console;
            this.logContext = {};
            this.debugEnabled = true;
        }

        _log(prefix, callerName, data) {
            let msgObject = {};
            if (typeof(data) !== "object") {
                msgObject = {message: data};
            } else {
                msgObject = data;
            }
            this.logCollector.log(
                prefix + DELIM + callerName + DELIM +
                JSON.stringify(this.logContext) + DELIM +
                JSON.stringify(msgObject))
        }

        _logDebug(callerName, data) {
            if (this.debugEnabled) {
                let msgObject = {};
                if (typeof(data) !== "object") {
                    msgObject = {message: data};
                } else {
                    msgObject = data;
                }
                this.logCollector.log("DEBUG" + DELIM +
                    callerName + DELIM +
                    "\nCONTEXT=" + JSON.stringify(this.logContext, null, 2) +
                    "\nDATA=" + JSON.stringify(msgObject, null, 2))
            }
        }

        set eid(eid) {
            this.logContext.eid = eid;
        }

        set riddleId(riddleId) {
            this.logContext.riddleId = riddleId;
        }

        setLogCollector(collector) {
            this.logCollector = collector;
        }

        setDebugEnabled(enabled) {
            this.debugEnabled = enabled;
        }

        setLogContext(obj) {
            this.logContext = {...this.logContext, ...obj};
        }

        clearContext() {
            this.logContext = {};
        }
    }

    global[LOGGING_SYMBOL] = new Logger();
}

module.exports = {
    info: function (data) {
        global[LOGGING_SYMBOL]._log("INFO", caller.getString(), data);
    },
    debug: function (data) {
        global[LOGGING_SYMBOL]._logDebug(caller.getString(), data);
    },
    error: function (data) {
        global[LOGGING_SYMBOL]._log("ERROR", caller.getString(), data);
    },
    warning: function (data) {
        global[LOGGING_SYMBOL]._log("WARN", caller.getString(), data);
    },
    logConfig(){
        return global[LOGGING_SYMBOL];
    },
    LOG_DELIMITER: DELIM
};
