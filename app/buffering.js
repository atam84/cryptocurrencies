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

// load_markets get all markets available in the platform, the list of markets will be refreshed every 24h and stored on the collection platformsmarkets
function load_markets(__ccxt) {
    (async() => {
        let markets = await __ccxt.load_markets();
        console.log('Platform : ' + __ccxt.id);
        console.log('Markets :');
        console.log(markets);
    })();
}
var load_markets = new Promise((resolve, reject) => {
    let markets = await __ccxt.load_markets();
});
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