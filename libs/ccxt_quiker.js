'use strict';

module.exports = class ccxt_quiker {
    constructor(__exchange_id) {
        this.ccxt = require('ccxt');
        this.__exchange = new this.ccxt[__exchange_id]({ 'verbose': false });
        (async() => {
            this.__marketslist = await this.get_markets_list();
            this.__marketscount = await this.__marketslist.length;
            this.__ratelimit = await this.__exchange.rateLimit;
            this.__exchangeid = await this.__exchange.id;
            this.__exchangename = await this.__exchange.name;
            this.__symbols = await this.__exchange.symbols;
            this.__currencies = await this.__exchange.currencies;
        })();
    }

    get_rateLimit() {
        return this.__exchange.rateLimit;
    }

    get_periods() {
        return this.__exchange.timeframes;
    }

    get_periodsKeys() {
        return Object.keys(this.__exchange.timeframes);
    }

    exchange_hasFetchOHLCV() {
        return this.__exchange.hasFetchOHLCV;
    }

    exchange_hasFetchTickers() {
        return this.__exchange.hasFetchTickers;
    }

    async get_markets_list() {
        return new Promise((resolve, reject) => {
            (async() => {
                try {
                    let markets_list = await this.__exchange.load_markets();
                    let list = [];
                    for (let symbol in markets_list) {
                        list.push(symbol);
                    }
                    resolve(list);
                } catch (err) {
                    reject(err);
                }
            })();
        });
    }

    async load_markets() {
        return new Promise((resolve, reject) => {
            try {
                let markets = this.__exchange.load_markets();
                resolve(markets);
            } catch (err) {
                reject(err);
            }
        });
    }

    async prices_currencies() {
        return new Promise((resolve, reject) => {
            try {
                let prices = this.__exchange.fetchTickers();
                resolve(prices);
            } catch (err) {
                reject(err);
            }
        });
    }

    // price_currency get currency prices by symbol
    async price_currency(__symbol) {
        return new Promise((resolve, reject) => {
            try {
                let prices = this.__exchange.fetchTicker(__symbol);
                resolve(prices);
            } catch (err) {
                reject(err);
            }
        });
    }

    // OHLCV Candlestick Charts
    async OHLCV_currency(__symbol, __timeframe) {
        return new Promise((resolve, reject) => {
            if (this.__exchange.hasFetchOHLCV) {
                try {
                    let OHLCV = this.__exchange.fetchOHLCV(__symbol, __timeframe);
                    resolve(OHLCV);
                } catch (err) {
                    reject(err);
                }
            } else {
                console.log(' dont have OHLCV');
                reject('Error ' + this.__exchange.id + ' : OHLCV not available');
            }
        });
    }

    async currency_trades(__symbol) {
        return new Promise((resolve, reject) => {
            try {
                let trades = this.__exchange.fetchTrades(__symbol);
                resolve(trades);
            } catch (err) {
                reject(err);
            }
        });
    }

    async currency_orderbook(__symbol) {
        return new Promise((resolve, reject) => {
            try {
                let orderbook = this.__exchange.fetchOrderBook(__symbol);
                resolve(orderbook);
            } catch (err) {
                reject(err);
            }
        });
    }
}



/* Error:
[1508064079916] (T)  collecting trade for pair BAY/BTC on the exchange bittrex
TypeError: Cannot convert undefined or null to object
    at Function.values (<anonymous>)
    at Exchange.parseTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:885:23)
    at Exchange.fetchTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:6178:21)
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:188:7)
(node:13980) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): TypeError: Cannot convert undefined or null to object
(node:13980) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
^C

================
Verbose:
[1508079405373] (T)  collecting trade for pair BAY/BTC on the exchange bittrex
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTS
Request:
 { 'User-Agent': 'ccxt/1.9.74 (+https://github.com/kroitor/ccxt) Node.js/8.6.0 (JavaScript)' } undefined
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTS
Response:
{"success":true,"message":"","result":null}
TypeError: Cannot convert undefined or null to object
    at Function.values (<anonymous>)
    at Exchange.parseTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:885:23)
    at Exchange.fetchTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:6178:21)
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:188:7)
(node:11188) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): TypeError: Cannot convert undefined or null to object
(node:11188) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

Resolved:
 * async fetchTrades(symbol, params = {}) {}
 * check the line 6178 for more details
 * 
 * Result:
[1508080775534] (T)  collecting trade for pair XLM/BTC on the exchange bittrex
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTA
Request:
 { 'User-Agent': 'ccxt/1.9.74 (+https://github.com/kroitor/ccxt) Node.js/8.6.0 (JavaScript)' } undefined
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTA
Response:
{"success":true,"message":"","result":null}
[1508080777353] (T)  collecting trade for pair BTA/BTC on the exchange bittrex
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=USDT-BTC
Request:
 { 'User-Agent': 'ccxt/1.9.74 (+https://github.com/kroitor/ccxt) Node.js/8.6.0 (JavaScript)' } undefined
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=USDT-BTC
Response:
{"success":true,"message":"","result":[{"Id":19950453,"TimeStamp":"2017-10-15T15:19:14.653","Quantity":0.02064490,"P
*/