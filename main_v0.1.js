// We will begin the first version by developping app for collecting data from Bittrex
// The next version of the app chould accept the others platform of exchange

const ccxt_quiker = require('./libs/ccxt_quiker.js');
const easy_mongo = require('./libs/easy_mongo.js');
const time_tools = require('./libs/time_tools.js');


let ccxt_exchange = new ccxt_quiker(exchange);
let time_t = new time_tools();
let easy_db = new easy_mongo('mongodb://localhost:27017/' + database);

console.log('[' + date_time_now() + '] Start coinsDataCollector');

/**
 * Step 0: executed one time at the starting of nodejs
 */

async function check_mandatory(__platform) {}

/**
 * Step 1: Connect to the database
 */

/**
 * Step 2: Collecting data and save every collected data in the apropriate collection
 **/

/*
    async function load_markets()                           ok
    async function prices_currencies()                      ok
    async function price_currency(__symbol)                 ok
    async function OHLCV_currency(__symbol, __timeframe)    ok
    async function currency_trades(__symbol)                ok
    async function currency_orderbook(__symbol)             ok
*/

(async() => {
    // variable declaration
    let exchange = 'poloniex';
    let database = 'cryptocurrency';
    let collection_info = 'exchange_info';
    let collection_pricing = 'exchange_pricing';
    let collection_ohlcv = 'exchange_ohlcv';
    let collection_trade = 'exchange_trade';
    let collection_orderbook = 'exchange_orderbook';


    time_t.start_timing();

    let rateLimit = ccxt_exchange.get_rateLimit(); // get rate limit for the exchange

    // connect to mongodb 
    let connecting = await easy_db.connect().then((result) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] YAHHH Connected to database ' + database);
    }).catch((err) => {
        console.log('ERROR');
    });

    /**
     * if we can't gate rate limit we will define it for 2seconds (2000ms)
     * it's important to wait every ratelimite to avoid ip ban from exchange
     */
    if (!rateLimit) {
        rateLimit = 2000;
    }

    console.log('');
    console.log('[' + time_t.date_time_epoch_ms() + '] Exchange Rate Limit = ' + rateLimit + 'ms');
    time_t.checkpoint_timming('connecting to database');
    // collect markets infos 'all markets existing in the exchange'
    let markets = await ccxt_exchange.load_markets().then((result) => {
        // save in database
        // markets_informations to save on exchange_info collection
        let _markets_info = {
            _id: exchange + '_informations',
            exchange: exchange,
            name: exchange,
            collect_date: time_t.date_now(),
            collect_time: time_t.time_now(),
            epoch_ms: time_t.date_time_epoch_ms()
        };
        _markets_info.markets_info = result;
        _markets_info.markets_count = ccxt_exchange.__marketscount;
        _markets_info.markets_pairs = ccxt_exchange.__symbols;
        _markets_info.markets_list = ccxt_exchange.__marketslist;
        _markets_info.markets_currencies = ccxt_exchange.__currencies;
        //easy_db.insert_doc(collection_info, _markets_info);
        easy_db.updateOne(collection_info, { _id: _markets_info._id }, _markets_info);
        console.log('[' + time_t.date_time_epoch_ms() + '] collecting markets informations for exchange ' + exchange + ' [collection: ' + collection_info + ']');
    }).catch((err) => {
        console.log('error : ' + err);
    });
    time_t.checkpoint_timming('collect markets informations');

    // collect currencies pricing on exchange 'all currencies existing in the exchange'

    await time_t.__u_sleep(rateLimit);
    let icoprices = await ccxt_exchange.prices_currencies().then((result) => {
        // ico pricing to save on exchange_pricing
        let _currencies_prices = {
            _id: exchange + '_pricing',
            exchange: exchange,
            name: exchange,
            collect_date: time_t.date_now(),
            collect_time: time_t.time_now(),
            epoch_ms: time_t.date_time_epoch_ms()
        };
        _currencies_prices.pricing = result;
        //easy_db.insert_doc(collection_pricing, _currencies_prices);
        easy_db.updateOne(collection_pricing, { _id: _currencies_prices._id }, _currencies_prices);
        console.log('[' + time_t.date_time_epoch_ms() + '] collecting currencies pricing on exchange ' + exchange + ' [collection: ' + collection_pricing + ']');
    }).catch((err) => {
        console.log(err);
    });

    time_t.checkpoint_timming('collect ico markets prices');

    /**
     * we chould get every ohlcv for pair currencies and store it on the collection: collection_ohlcv
     */
    let period = '1m';
    let counter = 0;
    console.log('');
    console.log('[' + time_t.date_time_epoch_ms() + '] collecting ohlcv ' + period + ' period for all ico (' + ccxt_exchange.__marketscount + ') this operation can take more than ' + ((ccxt_exchange.__marketscount * rateLimit) / 1000) / 60 + 'm');
    for (let pair_currencies in ccxt_exchange.__marketslist) {
        await time_t.__u_sleep(rateLimit);
        let icoOHLCV = await ccxt_exchange.OHLCV_currency(ccxt_exchange.__marketslist[pair_currencies], period).then((result) => {
            counter += 1;
            let _ohlcv = {
                _id: exchange + '_' + ccxt_exchange.__marketslist[pair_currencies] + '_' + period,
                name: ccxt_exchange.__marketslist[pair_currencies],
                type: 'ohlcv',
                exchange: exchange,
                collect_date: time_t.date_now(),
                collect_time: time_t.time_now(),
                epoch_ms: time_t.date_time_epoch_ms(),
                period: period,
                statistics: result
            };
            //easy_db.insert_doc(collection_ohlcv, { _id: exchange + '_' + ccxt_exchange.__marketslist[pair_currencies] + '_' + period, statistics: result });
            easy_db.updateOne(collection_ohlcv, { _id: _ohlcv._id }, _ohlcv);
            console.log('[' + time_t.date_time_epoch_ms() + '] (' + counter + '/' + ccxt_exchange.__marketscount + ') period = ' + period + ' collecting ohlcv for pair ' + ccxt_exchange.__marketslist[pair_currencies] + ' on the exchange ' + exchange);
        }).catch((err) => {
            console.log(err);
        });
    }

    time_t.checkpoint_timming('collect ohlcv of all ico');

    counter = 0;
    console.log('');
    console.log('[' + time_t.date_time_epoch_ms() + '] collecting trading actions for all ico (' + ccxt_exchange.__marketscount + ') this operation can take more than ' + ((ccxt_exchange.__marketscount * rateLimit) / 1000) / 60 + 'm');
    for (let pair_currencies in ccxt_exchange.__marketslist) {
        await time_t.__u_sleep(rateLimit);
        let icoTrade = await ccxt_exchange.currency_trades(ccxt_exchange.__marketslist[pair_currencies]).then((result) => {
            counter += 1;
            let _trade = {
                _id: exchange + '_' + ccxt_exchange.__marketslist[pair_currencies],
                name: ccxt_exchange.__marketslist[pair_currencies],
                type: 'trade',
                exchange: exchange,
                collect_date: time_t.date_now(),
                collect_time: time_t.time_now(),
                epoch_ms: time_t.date_time_epoch_ms(),
                trading: result
            };
            //easy_db.insert_doc(collection_trade, { _id: exchange + '_' + ccxt_exchange.__marketslist[pair_currencies], trading: result });
            easy_db.updateOne(collection_trade, { _id: _trade._id }, _trade);
            console.log('[' + time_t.date_time_epoch_ms() + '] (' + counter + '/' + ccxt_exchange.__marketscount + ')  collecting trade for pair ' + ccxt_exchange.__marketslist[pair_currencies] + ' on the exchange ' + exchange);
        }).catch((err) => {
            console.log(err);
        });
    }
    time_t.checkpoint_timming('collect trading of all ico');

    counter = 0;
    console.log('');

    console.log('[' + time_t.date_time_epoch_ms() + '] collecting orderbook for all ico (' + ccxt_exchange.__marketscount + ') this operation can take more than ' + ((ccxt_exchange.__marketscount * rateLimit) / 1000) / 60 + 'm');
    for (let pair_currencies in ccxt_exchange.__marketslist) {
        await time_t.__u_sleep(rateLimit);
        let icoTrade = await ccxt_exchange.currency_orderbook(ccxt_exchange.__marketslist[pair_currencies]).then((result) => {
            counter += 1;
            let _orderbook = {
                _id: exchange + '_' + ccxt_exchange.__marketslist[pair_currencies],
                name: ccxt_exchange.__marketslist[pair_currencies],
                type: 'orderbook',
                exchange: exchange,
                collect_date: time_t.date_now(),
                collect_time: time_t.time_now(),
                epoch_ms: time_t.date_time_epoch_ms(),
                orderbook: result
            };
            //easy_db.insert_doc(collection_orderbook, { _id: exchange + '_' + ccxt_exchange.__marketslist[pair_currencies], orderbook: result });
            easy_db.updateOne(collection_orderbook, { _id: _orderbook._id }, _orderbook);
            console.log('[' + time_t.date_time_epoch_ms() + '] (' + counter + '/' + ccxt_exchange.__marketscount + ')  collecting orderbook for pair ' + ccxt_exchange.__marketslist[pair_currencies] + ' on the exchange ' + exchange);
        }).catch((err) => {
            console.log(err);
        });
    }

    time_t.checkpoint_timming('collect orderbooks of all ico');

    console.log('[' + time_t.date_time_epoch_ms() + '] End of execution');
    time_t.end_timing();
    time_t.timing_report();
    easy_db.disconnect();
})();


/*
var test01 = new User({ name: 'ATam84' });
test01.save((err, success) => {
    if (err) return console.error(err);
    console.log('[' + date_time_now() + '] Data save succesfuly ' + test01._id + ' ID: ' + success);
});
*/

/**
 * Step 3: Close connection to the data bases
 **/


/**
 * Step 4: create a loop and exec the previous steps 1, 2, 3 every 5min with sleeping for 2 seconds between requests
 **/




/**
 * this will help to get the price of pair currencies, i choise to not use this functionnality because all informations are present on collection_pricing using await ccxt_exchange.prices_currencies()
await time_t.__u_sleep(rateLimit);
let icoprice = await ccxt_exchange.price_currency('ADA/BTC').then((result) => {
    console.log('[' + time_t.date_time_epoch_ms() + '] Result of currency ADA/BTC prices');
    console.log(result);
}).catch((err) => {
    console.log(err);
});
*/

//
// TEST AND EXAMPLES
// Test And Examples
//
//console.log(await ccxt_exchange.__marketslist);                  ok
//console.log(await ccxt_exchange.__marketscount);                 ok
//console.log('exchange id: ' + ccxt_exchange.__exchangeid);       ok
//console.log('exchange name: ' + ccxt_exchange.__exchangename);   ok
//console.log('pair ids: ' + ccxt_exchange.__symbols);             ok
//console.log('currencies: ' + ccxt_exchange.__currencies);        ok
//
//markets = {_id: xxx, _platform: bittrex, marketscount: xx, markets_list: [], symbols: [], currencies: []}
//currencies = {_id: xxx, _platform: bittrex, _symbol: xxxx, pricing: []}
//ohlcv = {_id: xxx, _platform: bittrex, _symbol: xxxx, pricing: []}
/*
await __u_sleep(rateLimit);
let markets_list = await ccxt_exchange.get_markets_list().then((result) => {
    console.log('[' + date_time_epoch() + '] Markets list');
    console.log(result);
    // save in database
}).catch((err) => {
    console.log('error : ' + err);
});
*/