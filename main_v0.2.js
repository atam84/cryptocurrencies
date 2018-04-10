// We will begin the first version by developping app for collecting data from Bittrex
// The next version of the app chould accept the others platform of exchange

const ccxt_quiker = require('./libs/ccxt_quiker.js');
const easy_mongo = require('./libs/easy_mongo.js');
const time_tools = require('./libs/time_tools.js');
const version = 'v 0.2.0 beta';


/*
    cli management :
    command line options
        node sc_name [exchange] [command]
            [exchange] == exchange id
            [command]  == list <exchange>|<ico>
                       == -exchange-id- collect
                       == -exchange-id- info

        sc bittrex --info
        sc bittrex --collect
        sc bittrex --currencies-info
        sc --list --exchange
        sc bittrex --list --markets
        sc --data-date
        __exchange: {
            id: String,
            name: String,
            orderbook: {
                markets_id: {
                    begin: D,
                    end: D
                    begin_timestamp: D,
                    end_timestamp: D,
                }
            }
        }
*/
// variable declaration
let exchange = 'bittrex';
let database = 'cryptocurrency';
let collection_info = 'exchange_info';
let collection_pricing = 'exchange_pricing';
let collection_ohlcv = 'exchange_ohlcv';
let collection_trade = 'exchange_trade';
let collection_orderbook = 'exchange_orderbook';
let rateLimit = undefined;

let ccxt_exchange = new ccxt_quiker(exchange);
let time_t = new time_tools();
let easy_db = new easy_mongo('mongodb://localhost:27017/' + database);



console.log('[' + time_t.date_time_now() + '] Start coinsDataCollector');

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

async function markets_informations() {
    var __promise = new Promise((resolve, reject) => {
        console.log('');
        console.log('[' + time_t.date_time_epoch_ms() + '] Exchange Rate Limit = ' + rateLimit + 'ms');
        // collect markets infos 'all markets existing in the exchange'
        ccxt_exchange.load_markets().then((result) => {
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
            resolve(true);
        }).catch((err) => {
            console.log('error : ' + err);
            reject(err);
        });
    });
    return __promise;
}

async function currencies_pricing() {
    var __promise = new Promise((resolve, reject) => {
        ccxt_exchange.prices_currencies().then((result) => {
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
            resolve(true);
        }).catch((err) => {
            console.log(err);
            reject(err);
        });
    });
    return __promise;
}

async function all_ico_statistics(period, __pause = 1000) {
    /**
     * we chould get every ohlcv for pair currencies and store it on the collection: collection_ohlcv
     */
    return new Promise((resolve, reject) => {
        (async() => {
            let counter = 0;
            console.log('');
            console.log('[' + time_t.date_time_epoch_ms() + '] collecting ohlcv ' + period + ' period for all ico (' + ccxt_exchange.__marketscount + ') this operation can take more than ' + ((ccxt_exchange.__marketscount * __pause) / 1000) / 60 + 'm');
            for (let pair_currencies in ccxt_exchange.__marketslist) {
                await time_t.__u_sleep(__pause);
                await _ico_statistics(ccxt_exchange.__marketslist[pair_currencies], period);
            }
            resolve(true);
        })();
    });
}

async function _ico_statistics(__ico_pair, period) {
    return new Promise((resolve, reject) => {
        ccxt_exchange.OHLCV_currency(__ico_pair, period).then((result) => {
            let _ohlcv = {
                _id: exchange + '_' + __ico_pair + '_' + period,
                name: __ico_pair,
                type: 'ohlcv',
                exchange: exchange,
                collect_date: time_t.date_now(),
                collect_time: time_t.time_now(),
                epoch_ms: time_t.date_time_epoch_ms(),
                period: period,
                statistics: result
            };
            easy_db.updateOne(collection_ohlcv, { _id: _ohlcv._id }, _ohlcv);
            console.log('[' + time_t.date_time_epoch_ms() + '] (S) period = ' + period + ' collecting ohlcv for pair ' + __ico_pair + ' on the exchange ' + exchange);
            resolve(true);
        }).catch((err) => {
            console.error('! Err: ' + err);
            reject(err);
        });
    });
}

async function all_ico_trading(__pause = 1000) {
    /**
     *
     */
    return new Promise((resolve, reject) => {
        (async() => {
            let counter = 0;
            console.log('');
            console.log('[' + time_t.date_time_epoch_ms() + '] collecting trading actions for all ico (' + ccxt_exchange.__marketscount + ') this operation can take more than ' + ((ccxt_exchange.__marketscount * __pause) / 1000) / 60 + 'm');
            for (let pair_currencies in ccxt_exchange.__marketslist) {
                await time_t.__u_sleep(__pause);
                await _ico_trading(ccxt_exchange.__marketslist[pair_currencies]);
            }
            resolve(true);
        })();
    });
}

async function _ico_trading(__ico_pair) {
    return new Promise((resolve, reject) => {
        //try {
        ccxt_exchange.currency_trades(__ico_pair).then((result) => {
            let _trade = {
                _id: exchange + '_' + __ico_pair,
                name: __ico_pair,
                type: 'trade',
                exchange: exchange,
                collect_date: time_t.date_now(),
                collect_time: time_t.time_now(),
                epoch_ms: time_t.date_time_epoch_ms(),
                trading: result
            };
            //easy_db.insert_doc(collection_trade, { _id: exchange + '_' + __ico_pair, trading: result });
            easy_db.updateOne(collection_trade, { _id: _trade._id }, _trade);
            console.log('[' + time_t.date_time_epoch_ms() + '] (T)  collecting trade for pair ' + __ico_pair + ' on the exchange ' + exchange);
            resolve(true);
        }).catch((err) => {
            console.error(err);
            reject(err);
        });
        /*} catch(err) {

        }*/
    });
}

async function all_ico_orderbooks(__pause = 1000) {
    /**
     *
     */
    return new Promise((resolve, reject) => {
        (async() => {
            let counter = 0;
            console.log('');
            console.log('[' + time_t.date_time_epoch_ms() + '] collecting orderbook for all ico (' + ccxt_exchange.__marketscount + ') this operation can take more than ' + ((ccxt_exchange.__marketscount * __pause) / 1000) / 60 + 'm');
            for (let pair_currencies in ccxt_exchange.__marketslist) {
                await time_t.__u_sleep(__pause);
                await _ico_orderbook(ccxt_exchange.__marketslist[pair_currencies]);
            }
            resolve(true);
        })();
    });
}

async function _ico_orderbook(__ico_pair) {
    return new Promise((resolve, reject) => {
        ccxt_exchange.currency_orderbook(__ico_pair).then((result) => {
            let _orderbook = {
                _id: exchange + '_' + __ico_pair,
                name: __ico_pair,
                type: 'orderbook',
                exchange: exchange,
                collect_date: time_t.date_now(),
                collect_time: time_t.time_now(),
                epoch_ms: time_t.date_time_epoch_ms(),
                orderbook: result
            };
            //easy_db.insert_doc(collection_orderbook, { _id: exchange + '_' + __ico_pair, orderbook: result });
            easy_db.updateOne(collection_orderbook, { _id: _orderbook._id }, _orderbook);
            console.log('[' + time_t.date_time_epoch_ms() + '] (B)  collecting orderbook for pair ' + __ico_pair + ' on the exchange ' + exchange);
            resolve(true);
        }).catch((err) => {
            console.log(err);
            reject(err);
        });
    });
}


(async() => {
    time_t.start_timing();
    rateLimit = ccxt_exchange.get_rateLimit(); // get rate limit for the exchange
    // connect to mongodb
    let connecting = await easy_db.connect().then((result) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] YAHHH Connected to database ' + database);
    }).catch((err) => {
        console.log('ERROR');
    });

    /* if we can't gate rate limit we will define it for 1seconds (1000ms), it's important to wait every ratelimite to avoid ip ban from exchange */
    if (!rateLimit) {
        rateLimit = 1500;
    }

    await markets_informations();
    time_t.checkpoint_timing('Markets informations');
    await time_t.__u_sleep(rateLimit);
    await currencies_pricing();
    time_t.checkpoint_timing('Currencies pricing');

    if (ccxt_exchange.exchange_hasFetchOHLCV()) {
        await all_ico_statistics('1m', rateLimit);
        time_t.checkpoint_timing('ICOs statistics ohlcv');
    }

    /*
    console.dir(await ccxt_exchange.get_periodsKeys());
    console.dir(await ccxt_exchange.get_periods());
    console.dir(' * ' + Object.keys(await ccxt_exchange.get_periods()));
    */

    if (ccxt_exchange.exchange_hasFetchTickers()) {
        await all_ico_trading(rateLimit);
        time_t.checkpoint_timing('ICOs trading');
    }

    await time_t.__u_sleep(rateLimit);
    await all_ico_orderbooks(rateLimit);
    time_t.checkpoint_timing(' ICOs orderbooks');

    console.log('[' + time_t.date_time_epoch_ms() + '] End of execution');
    time_t.end_timing();
    time_t.timing_report();

    /**
     * disconnect from the database
     */
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
