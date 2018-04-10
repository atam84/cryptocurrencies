// We will begin the first version by developping app for collecting data from Bittrex
// The next version of the app chould accept the others platform of exchange
const __ccxt = require('ccxt');


console.log('* [' + date_time_now() + '] Start coinsDataCollector');


let __bittrex = new __ccxt.bittrex();
// let __exchangeid = 'bittrex';
// let __exchange = new ccxt[__exchangeid]();

// list of supported exchange by the ccxt module
//console.log(ccxt.exchanges);

function date_time_now() {
    let D = new Date();
    return D.getDate() + "/" + (D.getMonth() + 1) + "/" + D.getFullYear() + " @ " + D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds();
}

function platform_infos(__ccxt) {
    console.log('Market id : ' + __ccxt.id);
    console.log('Market Fees :  Maker - ' + __ccxt.fees.trading.maker + ' - Taker - ' + __ccxt.fees.trading.taker);
    console.log('Timeout : ' + __ccxt.timeout);
    console.log('Version : ' + __ccxt.version);
    console.log('API: ');
    console.log('V2 : ' + JSON.stringify(__ccxt.api.v2));
    console.log('Public : ' + JSON.stringify(__ccxt.api.public));
    console.log('Account : ' + JSON.stringify(__ccxt.api.account));
    console.log('Account : ' + JSON.stringify(__ccxt.api.market));
}

platform_infos(__bittrex);

/**  End point Methods
    V2 : 
        get:["currencies/GetBTCPrice","market/GetTicks","market/GetLatestTick","Markets/GetMarketSummaries","market/GetLatestTick"]
    Public : 
        get:["currencies","markethistory","markets","marketsummaries","marketsummary","orderbook","ticker"]
    Account : 
        get:["balance","balances","depositaddress","deposithistory","order","orderhistory","withdrawalhistory","withdraw"]
    Account : 
        get:["buylimit","buymarket","cancel","openorders","selllimit","sellmarket"]
**/

// load_markets get all markets available in the platform, the list of markets will be refreshed every 24h and stored on the collection platformsmarkets
function load_markets(__ccxt) {
    (async() => {
        let markets = await __ccxt.load_markets();
        console.log('Platform : ' + __ccxt.id);
        console.log('Markets :');
        console.log(markets);
    })();
}
// work fine (OK) : load_markets(__bittrex);

// prices_currencies get all currencies prices
function prices_currencies(__ccxt) {
    (async() => {
        let prices = await __ccxt.fetchTickers();
        console.log(prices);
    })();
}
// work fine (OK) : prices_currencies(__bittrex);

// price_currency get currency prices by symbol
function price_currency(__ccxt, __symbol) {
    (async() => {
        let prices = await __ccxt.fetchTicker(__symbol);
        console.log(__symbol + ':');
        console.log(prices);
    })();
}
// work fine (OK) :  price_currency(__bittrex, 'ADA/BTC');


// OHLCV Candlestick Charts
function OHLCV_currency(__ccxt, __symbol, __timeframe) {
    if (__ccxt.hasFetchOHLCV) {
        console.log(__ccxt.id + ' has OHLCV');
        (async() => {
            let OHLCV = await __ccxt.fetchOHLCV(__symbol, __timeframe);
            console.dir(OHLCV);
        })();
    } else {
        console.log(__ccxt.id + ' dont have OHLCV');
    }
}
// work fine (OK) : OHLCV_currency(__bittrex, 'ADA/BTC', '1m');

/*
[
    [
        1504541580000, // UTC timestamp in milliseconds
        4235.4,        // (O)pen price
        4240.6,        // (H)ighest price
        4230.0,        // (L)owest price
        4230.7,        // (C)losing price
        37.72941911    // (V)olume
    ],
    ...
]
*/

function currency_trades(__ccxt, __symbol) {
    (async() => {
        let trades = await __ccxt.fetchTrades(__symbol);
        console.log(__symbol);
        console.log(trades);
    })();
}
// work fine (OK) : currency_trades(__bittrex, 'ADA/BTC');


function currency_orderbook(__ccxt, __symbol) {
    (async() => {
        let orderbook = await __ccxt.fetchOrderBook(__symbol);
        console.log(__symbol);
        console.log(orderbook);
    })();
}
// work fine (OK) : currency_orderbook(__bittrex, 'ADA/BTC');


/*
 *
    async function get_markets(_ccxt_exchange) {
        // the function souldby executed every 24h to get markets
        console.log(_ccxt_exchange.id);
        let __markets = await _ccxt_exchange.load_markets();
        let __markets_list = await Object.keys(__markets);
        console.log(' - Markets : ' + __markets_list.length);
    }

    async function get_market(_ccxt_exchange, _market_symbol) {
        let __market = await _ccxt_exchange.market(_market_symbol);
        console.dir(__market);
    }

    get_markets(__bittrex);
    get_market(__bittrex, 'STRAT/BTC');
 *
**/