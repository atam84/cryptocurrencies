// We will begin the first version by developping app for collecting data from Bittrex
// The next version of the app chould accept the others platform of exchange
const __ccxt = require('ccxt');
//const __db = require('mongodb').MongoClient;
const __db_uri = 'mongodb://localhost:27017/cryptocurrency';

var dbClient = require('mongoose');
var Schema = mongoose.Schema;
var dataSchema = new Schema({}, { strict: false });
var User = mongoose.model('User', dataSchema);

let __u_sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('[' + date_time_now() + '] Start coinsDataCollector');


dbClient.connect(__db_uri);

var __db = dbClient.connection;
__db.on('error', console.error.bind(console, 'connection error:'));
__db.once('open', function() {
    console.log('[' + date_time_now() + '] Connected to Mongodb database');
});

/*
class Database_Mongo {
    //const __db_uri = 'mongodb://localhost:27017/cryptocurrency';
    constructor(uri, database, login, passwd, verbose) {
        this.dbclient = require('mongodb').MongoClient;
        this.dburi = uri + '/' + database;
        this.dbconnector = null;
    }

    async connection() {
        this.dbconnector = await this.dbclient.connect(this.dburi);
        console.dir(this.dbconnector);
    }

    async disconnect() {
        let __close = await this.dbconnector.close();
    }

    async createcollection(collectionname) {
        let __create_collection = await this.dbconnector.createCollection(collectionname);

    }
}

let isdb = new Database_Mongo('mongodb://localhost:27017', 'cryptocurrency');
isdb.connection();
isdb.createcollection('ATam84');
isdb.disconnect();
*/


let __bittrex = new __ccxt.bittrex();
// let __exchangeid = 'bittrex';
// let __exchange = new ccxt[__exchangeid]();

// list of supported exchange by the ccxt module
//console.log(ccxt.exchanges);

function date_time_now() {
    let D = new Date();
    return D.getDate() + "/" + (D.getMonth() + 1) + "/" + D.getFullYear() + " @ " + D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds();
}

function u_sleep(miliscondes) {
    (async() => {
        await sleeping(miliscondes);
    })();
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
/*
console.log(date_time_now() + 'i go to sleep 2000ms');
(async() => {
    await __u_sleep(2000);
    console.log(date_time_now() + 'i m wakeup');
    platform_infos(__bittrex);
})();
*/

/*
__db.connect(__db_uri, function(err, db) {
    if (err) throw err;
    console.dir(db);
    db.createCollection("customers", function(err, res) {
        if (err) throw err;
        console.log("Collection created!");
        db.collection("customers").insertOne({ name: "Company Inc", address: "Highway 37" }, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });
});
*/




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