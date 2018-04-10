// We will begin the first version by developping app for collecting data from Bittrex
// The next version of the app chould accept the others platform of exchange

const ccxt_quiker = require('./libs/ccxt_quiker.js');
const easy_mongo = require('./libs/easy_mongo.js');
const time_tools = require('./libs/time_tools.js');
const __argv = require('yargs').argv;
const asTable = require('as-table').configure({ delimiter: ' | ' });
const version = 'v 0.2.4 beta';
const ansi = require('ansicolor');
const asciichart = require('asciichart');


// variable declaration
let exchange = 'bitfinex2';
let database = 'cryptocurrency';
let collection_info = 'exchange_info';
let collection_pricing = 'exchange_pricing';
let collection_ohlcv = 'exchange_ohlcv';
let collection_trade = 'exchange_trade';
let collection_orderbook = 'exchange_orderbook';
let rateLimit = 1000;

let ccxt_exchange = undefined;
let __icoBase = undefined;
let time_t = new time_tools();



function smart_date_time(dd) {
    let D = new Date(dd);
    return D.getDate() + "/" + (D.getMonth() + 1) + " @ " + D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds();
}

function epoch_smart_date_time(dd) {
    let D = new Date(dd);
    return D.getDate() + "/" + (D.getMonth() + 1) + " @ " + D.getHours() + ":" + D.getMinutes();
}

function avrage(__array) {
    let __array_count = __array.length;
    let countUp = 0;
    for (let i = 0; i < __array_count; i++) {
        countUp += parseFloat(__array[i]);
    }
    return (countUp / __array_count).toFixed(8);
}

function nim_max(__array) {
    let __array_count = __array.length;
    let sorted_array = __array.sort(function(a, b) { return a - b });
    return '[min: ' + sorted_array[0].toFixed(8) + ' - max: ' + sorted_array[__array_count - 1].toFixed(8) + ']';

}

function epoch_period(__array) {
    let __array_count = __array.length;
    let sorted_array = __array.sort(function(a, b) { return a - b });
    return sorted_array[__array_count - 1] - sorted_array[0];
}

function ms_2period_human(__first, __last) {
    let __begin = 0;
    let __end = 0;
    let __period = 0;
    if (__first > __last) {
        __begin = __first;
        __end = __last;
    } else {
        __begin = __last;
        __end = __first;
    }
    __period = (__begin - __end) / 1000; // period in seconds
    if (__period <= 59) {
        return __period.toFixed(2) + ' seconds';
    }

    if (__period >= 60 && __period < 3600) {
        // 3600 = 60m * 60s
        return (__period / 60).toFixed(2) + ' minutes';
    }

    if (__period >= 3600 && __period < 86400) {
        // 86400 = 24h * 60m * 60s
        return ((__period / 60) / 60).toFixed(2) + ' hours';
    }

    if (__period >= 86400) {
        // 86400 = 24h * 1d
        return (((__period / 24) / 60) / 60).toFixed(2) + ' days';
    }
}

function orderbook_analyses(__ico_orderbook, booksize = 'full', returnTableToo = true) {
    console.log(typeof(booksize));
    console.dir(booksize);

    bids_count = __ico_orderbook.bids.length;
    asks_count = __ico_orderbook.asks.length;
    if (booksize === 'full') {
        bids_count = __ico_orderbook.bids.length;
        asks_count = __ico_orderbook.asks.length;
    } else if (bids_count <= asks_count) {
        if (bids_count <= booksize) {
            bids_count = bids_count;
            asks_count = bids_count;
        } else {
            bids_count = booksize;
            asks_count = booksize;
        }
    } else {
        if (asks_count <= booksize) {
            bids_count = asks_count;
            asks_count = asks_count;
        } else {
            bids_count = booksize;
            asks_count = booksize;
        }
    }
    let __asTable = [];
    let bids = {
        pricing: [],
        pricing_sum: 0,
        volume_sum: 0
    }
    let bids_tab = {
        type: 'bids',
        booksize: booksize,
        volume_sum: 0,
        pricing_avg: 0,
        pricing_min_max: '',
        _count: 0
    }
    let asks = {
        pricing: [],
        pricing_sum: 0,
        volume_sum: 0
    }
    let asks_tab = {
        type: 'asks',
        booksize: booksize,
        volume_sum: 0,
        pricing_avg: 0,
        pricing_min_max: '',
        _count: 0
    }
    for (let i = 0; i < bids_count; i++) {
        bids.pricing.push(__ico_orderbook.bids[i][0]);
        bids.pricing_sum = bids.pricing_sum + __ico_orderbook.bids[i][0];
        bids.volume_sum = bids.volume_sum + __ico_orderbook.bids[i][1]
    }

    for (let i = 0; i < asks_count; i++) {
        asks.pricing.push(__ico_orderbook.asks[i][0]);
        asks.pricing_sum = asks.pricing_sum + __ico_orderbook.asks[i][0];
        asks.volume_sum = asks.volume_sum + __ico_orderbook.asks[i][1]
    }

    if (returnTableToo) {
        bids_tab.pricing_avg = (bids.pricing_sum / bids_count).toFixed(8);
        bids_tab.pricing_min_max = nim_max(bids.pricing);
        bids_tab.volume_sum = bids.volume_sum.toFixed(8);
        bids_tab._count = bids_count;

        asks_tab.pricing_avg = (asks.pricing_sum / asks_count).toFixed(8);
        asks_tab.pricing_min_max = nim_max(asks.pricing);
        asks_tab.volume_sum = asks.volume_sum.toFixed(8);
        asks_tab._count = asks_count;

        __asTable.push(bids_tab);
        __asTable.push(asks_tab);

        return {
            bids: bids_tab,
            asks: asks_tab,
            asTable: __asTable
        }
    } else {
        return {
            bids: bids_tab,
            asks: asks_tab,
        }
    }
}

function badge(position, _timeStamp, open, close, high, low, volume) {
    /*
    Candlestick Patterns
       D1               D2                  D3                   D4                  D5                  D6

        |                                    |                    |                                                          <----- High
        |                |                   |                    |                                              
       +-+              +-+                 +-+                  +-+                 +-+                 +-+                 <----- Open
       | |              | |                 | |                  | |                 | |                 | |     
       | |              | |                 | |                  | |                 | |                 | |     
       | |              | |                 | |                  | |                 | |                 | |     
       +-+              +-+                 +-+                  +-+                 +-+                 +-+                 <----- Close
        |                |                   |                                        |                          
        |                |                                                            |                                      <----- Low
    */
    let feed_data = {
        position: position,
        timestamp: _timeStamp,
        time: epoch_smart_date_time(_timeStamp),
        open: open,
        close: close,
        high: high,
        low: low,
        volume: volume,
        symbol: undefined,
        gain: undefined,
        loss: undefined,
        avg_gain: undefined,
        avg_loss: undefined,
        RS: undefined,
        RSI: undefined
    }
    if (open > close) {
        // open superior to close ==> closed low (down)
        if (high > open && low < close) {
            // D1 or D2 or D3
            ho = high - open;
            cl = close - low;
            if (ho === cl) {
                // D1
                feed_data.symbol = 'D1';
            }
            if (ho < cl) {
                // D2
                feed_data.symbol = 'D2';
            }
            if (ho > cl) {
                // D3
                feed_data.symbol = 'D3';
            }
        } else if (low === close && high > open) {
            // D4
            feed_data.symbol = 'D4';
        } else if (high === open && low < close) {
            // D5
            feed_data.symbol = 'D5';
        } else if (high === open && low === close) {
            // D6
            feed_data.symbol = 'D6';
        }
    }

    /*
    Candlestick Patterns
    U1               U2                  U3                   U4                  U5                  U6

        |                                    |                    |                                                     <----- High
        |                |                   |                    |                                              
       +-+              +-+                 +-+                  +-+                 +-+                 +-+            <----- Close
       | |              | |                 | |                  | |                 | |                 | |     
       | |              | |                 | |                  | |                 | |                 | |     
       | |              | |                 | |                  | |                 | |                 | |     
       +-+              +-+                 +-+                  +-+                 +-+                 +-+            <----- Open
        |                |                   |                                        |                          
        |                |                                                            |                                 <----- Low
    */

    if (open < close) {
        // open inferior to close ===> closed high (up)
        if (high > close && low < open) {
            // U1 or U2 or U3
            hc = high - close;
            ol = open - low;
            if (hc === ol) {
                // U1
                feed_data.symbol = 'U1';
            }
            if (hc < ol) {
                // U2
                feed_data.symbol = 'U2';
            }
            if (hc > ol) {
                // U3
                feed_data.symbol = 'U3';
            }
        } else if (low === open && high > close) {
            // U4
            feed_data.symbol = 'U4';
        } else if (high === close && low < open) {
            // U5
            feed_data.symbol = 'U5';
        } else if (high === close && low === open) {
            // U6
            feed_data.symbol = 'U6';
        }
    }
    /*
    Candlestick Pattern
    S1             S2                S3              S4                S5            S6

        |                               |               |                                                 <----- High
        |                               |               |                                    
        |                               |               |                                    
        |             |                 |               |                                    
      __|__         __|__             __|__           __|__             _____          _____               <----- Open and close
        |             |                 |                                 |                    
        |             |                 |                                 |                    
        |             |                                                   |                    
        |             |                                                   |                                 <----- Low
    */

    if (open === close) {
        // open equal to close ===> closed in same value (stable)
        stagnation = open;
        if (high > stagnation && low < stagnation) {
            // S1 or S2 or S3
            hs = high - stagnation;
            sl = stagnation - low;
            if (hs === sl) {
                // S1
                feed_data.symbol = 'S1';
            }
            if (hs < sl) {
                // S2
                feed_data.symbol = 'S2';
            }
            if (hs > sl) {
                // S3
                feed_data.symbol = 'S3';
            }
        } else if (low === stagnation && high > stagnation) {
            // S4
            feed_data.symbol = 'S4';
        } else if (high === stagnation && low < stagnation) {
            // S5
            feed_data.symbol = 'S5';
        } else if (high === stagnation && low === stagnation) {
            // S6
            feed_data.symbol = 'S6';
        }
    }
    return feed_data;
}

function buy_sell_candle_detect(__feed_analyse, __seq = 1) {
    let __feed_size = __feed_analyse.length;
    let compare = '';
    let __new_feed = [];
    let __analyse_period = 1;

    if (__seq === 1) {
        __analyse_period = 1;
    } else {
        __analyse_period = __feed_size - __seq;
    }

    for (let i = __analyse_period; i < __feed_size; i++) {
        if (__feed_analyse[i].symbol.match(/U/) && __feed_analyse[i - 1].symbol.match(/U/)) {
            if (__feed_analyse[i].RSI >= 16 && __feed_analyse[i].RSI <= 20) {
                console.log(' [BUY Signal] - detected on the sequance ' + __feed_analyse[i].position + '  RSI = ' + __feed_analyse[i].RSI + ' - O: ' + __feed_analyse[i].open + '  C: ' + __feed_analyse[i].close + '  H: ' + __feed_analyse[i].high + '  L: ' + __feed_analyse[i].low);
            }
        }

        if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/)) {
            if (__feed_analyse[i].RSI >= 70) {
                console.log(' [Sell Signal] - detected on the sequance ' + __feed_analyse[i].position + '  RSI = ' + __feed_analyse[i].RSI + ' - O: ' + __feed_analyse[i].open + '  C: ' + __feed_analyse[i].close + '  H: ' + __feed_analyse[i].high + '  L: ' + __feed_analyse[i].low);
            }
        }
    }
}

function isUpTrend(__feed_seq) {
    if (getSeqanceTrend(__feed_seq) === 'up') {
        return true;
    }
    return false;

}

function isDownTrend(__feed_seq) {
    if (getSeqanceTrend(__feed_seq) === 'down') {
        return true;
    }
    return false;
}

function getSeqanceTrend(__feed_seq) {
    let __feed_seq_size = __feed_seq.length;
    let trend = undefined; // variable / up / down
    let __up = 0;
    let __down = 0;
    let __stable = 0;
    let __grow = 0;
    let __decline = 0;

    for (let i = 0; i < __feed_seq_size - 1; i++) {
        if (__feed_seq[i].close > __feed_seq[i + 1].close) { // up trend
            __up += 1;
            __grow += (Math.abs((__feed_seq[i + 1].close - __feed_seq[i].close) / __feed_seq[i + 1].close)).toFixed(2) / 1;
        } else if (__feed_seq[i].close < __feed_seq[i + 1].close) { // down trend
            __down += 1;
            __decline += (Math.abs((__feed_seq[i + 1].close - __feed_seq[i].close) / __feed_seq[i + 1].close)).toFixed(2) / 1;
        } else if (__feed_seq[i].close === __feed_seq[i + 1].close) {
            __stable += 1;
        }
    }

    if (__grow > __decline) {
        __status = 'up';
    }

    if (__grow < __decline) {
        __status = 'down';
    }

    if (__grow === __decline) {
        __status = 'stable';
    }

    //return '__up: ' + __up + ' __down: ' + __down + ' __stable: ' + __stable + ' __grow: ' + __grow + ' __decline: ' + __decline;
    return {
        up_sequances: __up,
        down_sequances: __down,
        stable_sequances: __stable,
        sequance: __feed_seq_size - 1,
        grow: __grow,
        decline: __decline,
        variation: __grow - __decline,
        grow_percent: __grow * 100,
        decline_percent: __decline * 100,
        variation_percent: (__grow - __decline) * 100,
        status: __status
    };
}

function candle_predict(__feed_analyse, __seq = 10) {
    let __feed_size = __feed_analyse.length;
    let compare = '';
    let __new_feed = [];

    //
    // 01/32  DOWN  OK
    // 02/32  DOWN  OK
    // 03/32  DOWN  OK
    // 04/32  DOWN  OK
    // 05/32  DOWN  OK -- need more analyses thinks
    // 06/32  DOWN  OK
    // 07/32  DOWN  OK
    // 08/32  DOWN  -- need more analyses thinks
    // 09/32  DOWN  OK
    // 10/32  DOWN  -- need more analyses thinks
    // 11/32  DOWN  OK
    // 12/32  DOWN  OK -- need more analyses thinks
    // 13/32  DOWN  OK -- need more analyses thinks for the candlestick at the position +2 and -2
    // 14/32  DOWN  OK -- hidden (need more analyses thinks)
    // 15/32  DOWN  OK
    // 16/32  DOWN  OK
    //
    // 17/32  UP    
    // 18/32  UP    OK
    // 19/32  UP    OK
    // 20/32  UP    OK
    // 21/32  UP    OK
    // 22/32  UP    OK
    // 23/32  UP    OK
    // 24/32  UP    -- need more analyses thinks
    // 25/32  UP    OK
    // 26/32  UP    -- need more analyses thinks
    // 27/32  UP    OK
    // 28/32  UP    OK
    // 29/32  UP    --
    // 30/32  UP    OK -- hidden (need more analyses thinks)
    // 31/32  UP    OK
    // 32/32  UP    OK
    //

    // bullish => move up trend
    // bearish => move down trend

    let trend = 'N/A';

    for (let i = 4; i < __feed_size; i++) {

        /**
         * http://www.investopedia.com/articles/active-trading/092315/5-most-powerful-candlestick-patterns.asp
         * 1 - Three Line Strike  (Go UP) - 84%
         * 2 - Two Black Gapping (Go DOWN) - 68%
         * 3 - Three Black Crows (Go DOWN) - 78%
         * 4 - Evening Star (Go DOWN) - 72%
         * 5 - Abandoned Baby (Go UP) - 70%
         */

        // 1 - Three Line Strike  (Go UP) - 84% [D/D/D/U] (up trend)
        if (__feed_analyse[i].symbol.match(/U/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/D/)) {
            if (__feed_analyse[i].close > __feed_analyse[i - 3].open && __feed_analyse[i].open < __feed_analyse[i - 1]) {
                // Up candel must be big than three candles before
                if (__feed_analyse[i - 3].open > __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 1] && __feed_analyse[i - 3].close > __feed_analyse[i - 2].close && __feed_analyse[i - 2].close > __feed_analyse[i - 1].close) {
                    // the three candles before the big UP candle must be in down trend
                    console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Line Strike) market can go up (84%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    trend = 'Go Up 84%';
                }
            }
        }

        // 2 - Two Black Gapping (Go DOWN) - 68%  [U/D/D/D] (down trend)
        if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
            if (__feed_analyse[i - 3].close >= __feed_analyse[i - 2].open && __feed_analyse[i - 2].close > __feed_analyse[i - 1].open && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i].close) {
                console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Two Black Gapping) market can go down (68%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                trend = 'Go Down 68%';
            }
            // 3 - Three Black Crows (Go DOWN) - 78%
            if (__feed_analyse[i - 3].close < __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 1].open && __feed_analyse[i - 2].close > __feed_analyse[i - 1].close && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i].close) {
                console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Three Black Crows) market can go down (78%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                trend = 'Go Down 78%';
            }
        }

        // 4 - Evening Star (Go DOWN) - 72% 
        if (__feed_analyse[i].symbol.match(/D/) && __feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 2].symbol.match(/U/)) {
            if (__feed_analyse[i - 2].close < __feed_analyse[i - 1].close && __feed_analyse[i - 1].close > __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Evening Star) market can go down (72%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                trend = 'Go Down 72%';
            }
        }

        // 5 - Abandoned Baby (Go UP) - 70%   [D/S(1,2,5)/U]
        if (__feed_analyse[i].symbol.match(/U/) && (__feed_analyse[i - 1].symbol === 'S1' || __feed_analyse[i - 1].symbol === 'S2' || __feed_analyse[i - 1].symbol === 'S5') && __feed_analyse[i - 2].symbol.match(/D/)) {
            if (__feed_analyse[i - 2].close >= __feed_analyse[i - 1].open && __feed_analyse[i].open >= __feed_analyse[i - 1].open) {
                console.log('[ ' + __feed_analyse[i].time + ' ] detected suite: (Abandoned Baby) market can go up (70%) from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                trend = 'Go Up 70%';
            }
        }

        /**
         * END OF NEW DEFINITION
         */

        if ((__feed_analyse[i].close === __feed_analyse[i - 1].open || __feed_analyse[i].close === __feed_analyse[i - 1].close) && (__feed_analyse[i].open === __feed_analyse[i - 1].open || __feed_analyse[i].open === __feed_analyse[i - 1].close)) {
            // identical candle in size
            if ((__feed_analyse[i - 2].symbol === 'U5' || __feed_analyse[i - 2].symbol === 'S5') && (__feed_analyse[i - 2].close === __feed_analyse[i - 1].open || __feed_analyse[i - 2].close === __feed_analyse[i - 1].close)) {
                console.log('[16/32] detected suite: (Hanging Man [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                // 16/32 - Hanging Man [Bar confirm]
            }

            if (__feed_analyse[i - 2].symbol === 'U4' && __feed_analyse[i - 3].symbol === 'D4' && __feed_analyse[i - 2].open === __feed_analyse[i - 3].close && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                console.log('[12/32] detected suite: (Inverted Hammer [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                // 12/32 - Inverted Hammer [Bar confirm]
            }

            if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                // maybe need revision ... no i'm sure that need revision
                if ((__feed_analyse[i - 2].open < __feed_analyse[i - 2].open && __feed_analyse[i - 2].open > __feed_analyse[i - 2].close) || (__feed_analyse[i - 2].open > __feed_analyse[i - 2].open && __feed_analyse[i - 2].open < __feed_analyse[i - 2].close)) {
                    console.log('[27/32] detected suite: (On-Neck Line [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                    // 27/32 - On-Neck Line [Bar confirm]
                }
            }

            /*  See revision of this situation -- need deleted when all is ok
            if (__feed_analyse[i - 2].symbol === 'D5') {
                console.log('[32/32] detected suite: (Hammer [Bar confirm]) need trend markets confirmation : ' + __feed_analyse[i].position);
                // 32/32 - Hammer [Bar confirm]
            }
            */
        }

        if ((__feed_analyse[i].close > __feed_analyse[i - 1].open || __feed_analyse[i].close > __feed_analyse[i - 1].close) && (__feed_analyse[i].open > __feed_analyse[i - 1].open || __feed_analyse[i].open > __feed_analyse[i - 1].close)) {
            // Up trend position 0 and position -1
            if (__feed_analyse[i - 2].symbol === 'S1' && __feed_analyse[i - 3].symbol.match(/U/)) {
                if (__feed_analyse[i - 2].open < __feed_analyse[i - 3].close && __feed_analyse[i - 2].open > __feed_analyse[i - 3].open) {
                    console.log('[19/32] detected suite: (Bullish Harami Cross) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    // 19/32  - Bullish Harami Cross
                }
            }
        }


        if (__feed_analyse[i].symbol.match(/U/)) {
            if (__feed_analyse[i].symbol === 'U1') {
                if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].close === __feed_analyse[i - 1].close) {
                    console.log('[09/32] detected suite: (Separating Line Bearish) market can go down from the sequance : ' + __feed_analyse[i].position);
                    // 09/32 Separating Line Bearish
                }

                if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'D1') {
                    if (__feed_analyse[i].open < __feed_analyse[i - 1].open && __feed_analyse[i - 1].open < __feed_analyse[i - 2].open && __feed_analyse[i - 1].close < __feed_analyse[i - 2].close && __feed_analyse[i - 1].close > __feed_analyse[i - 2].close) {
                        console.log('[20/32] detected suite: (Pricing Line [Bar confirm]) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        // 20/32 Separating Line Bearish
                    }
                }

                if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].open === __feed_analyse[i - 1].high) {
                    if ((__feed_analyse[i - 2].close > __feed_analyse[i - 3].open || __feed_analyse[i - 2].close > __feed_analyse[i - 3].close) && (__feed_analyse[i].open > __feed_analyse[i - 1].open || __feed_analyse[i].open > __feed_analyse[i - 1].close)) {
                        console.log('[21/32] detected suite: (Engulting Bullish Line) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        // 21/32 - Engulting Bullish Line
                    }


                }

                if (__feed_analyse[i - 1].symbol === 'S1' && __feed_analyse[i - 2].symbol === 'D1') {
                    if (__feed_analyse[i - 1].open < __feed_analyse[i - 1].close && __feed_analyse[i - 1].open < __feed_analyse[i].open && __feed_analyse[i - 2].open > __feed_analyse[i].close) {
                        console.log('[22/32] detected suite: (Morning Doji Star) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                        // 22/32 - Morning doji star
                    }
                }
            }

            if (__feed_analyse[i].symbol === 'U2') {
                if ((__feed_analyse[i].open - __feed_analyse[i].low) > (__feed_analyse[i].close - __feed_analyse[i].open) * 20) {
                    console.log('[30/32] detected suite: (Long Lower Shadow) market can go up from the sequance : ' + __feed_analyse[i].position + '  -  RSI: ' + __feed_analyse[i].RSI);
                    // 30/32 - Long Lower Shadow
                }

            }

            if (__feed_analyse[i].symbol === 'U3') {

            }

            if (__feed_analyse[i].symbol === 'U4') {

            }

            if (__feed_analyse[i].symbol === 'U5') {
                if (__feed_analyse[i - 1].symbol === 'U4' && __feed_analyse[i - 2].symbol === 'U5') {
                    if (__feed_analyse[i - 1].close === __feed_analyse[i].open && __feed_analyse[i - 1].open === __feed_analyse[i - 2].close) {
                        console.log('[11/32] detected suite: (Bullish Soldier) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 11/32  3 Bullish Soldier
                    }
                }
            }

            if (__feed_analyse[i].symbol === 'U6') {

            }

        }


        if (__feed_analyse[i].symbol.match(/D/)) {

            if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].high < __feed_analyse[i - 1].close && __feed_analyse[i - 1].low > __feed_analyse[i].open) {
                if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 2].high < __feed_analyse[i - 1].close && __feed_analyse[i - 2].close < __feed_analyse[i - 1].low) {
                    console.log('[02/32] detected suite: (Bearish harami) market can go down from the sequance : ' + __feed_analyse[i].position);
                    // 02/32 Bearish harami  * Look like ok
                }
            }

            /**
             * Bearish Hammer - Shooting Star
             */
            if (__feed_analyse[i - 1].symbol === 'D3' || __feed_analyse[i].symbol === 'D3') {
                if (__feed_analyse[i - 1].close > __feed_analyse[i].open && __feed_analyse[i - 1].close > __feed_analyse[i - 2].close) {
                    console.log('[**] detected suite: (Bearish Hammer - Shooting Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                    // Bearish Hammer - Shooting Star
                }
            }


            if (__feed_analyse[i].symbol === 'D1') {
                if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                    if (__feed_analyse[i].open > __feed_analyse[i - 1].open && __feed_analyse[i].open < __feed_analyse[i - 1].close) {
                        if (__feed_analyse[i - 1].close > __feed_analyse[i - 2].close && __feed_analyse[i - 1].open < __feed_analyse[i - 2].open) {
                            console.log('[04/32] detected suite: (Dark Cloud Cover [Bar confirm]) market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 04/32 - Dark Cloud Cover [Bar confirm]
                        }
                    }

                    if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'U1') {
                        if (__feed_analyse[i].close === __feed_analyse[i - 1].open && __feed_analyse[i - 2].open === __feed_analyse[i - 1].open) {
                            console.log('[23/32] detected suite: (Morning Star) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                            // 23/32 - Morning Star
                        }
                    }

                    if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].close === __feed_analyse[i - 1].close) {
                        console.log('[25/32] detected suite: (Separating Line Bullish) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                        // 25/32 - Separating Line Bullish
                    }


                }

                if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 2].symbol === 'D2' && __feed_analyse[i - 3].symbol === 'D1') {
                    if (__feed_analyse[i].low === __feed_analyse[i - 1].low && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                        console.log('[31/32] detected suite: (Tweezer Bottoms) market can go up from the sequance : ' + __feed_analyse[i].position + '   -  RSI: ' + __feed_analyse[i].RSI);
                        // 31/32 - Tweezer Bottoms
                    }
                }

                if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                    if (__feed_analyse[i - 2].close > __feed_analyse[i - 1].close && __feed_analyse[i].open < __feed_analyse[i - 1].close && __feed_analyse[i].close > __feed_analyse[i - 1].open) {
                        console.log('[02/32] detected suite: (Bullish Harami) market can go up from the sequance : ' + __feed_analyse[i].position + '  RSI: ' + __feed_analyse[i].RSI);
                        // 02/32 - Bullish Harami
                    }
                }

                if (__feed_analyse[i - 1].symbol.match(/S/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                    if (__feed_analyse[i - 1].open > __feed_analyse[i - 2].close && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                        console.log('[06/32] detected suite: (Evening Doji Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 06/32 - Evening Doji Star
                    }
                }

                if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/)) {
                    if (__feed_analyse[i - 1].open === __feed_analyse[i].open && __feed_analyse[i - 2].close === __feed_analyse[i].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                        console.log('[07/32] detected suite: (Evening Star) market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 07/32 - Evening Star
                    }
                }

            }

            if (__feed_analyse[i].symbol === 'D2') {
                if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i - 2].symbol.match(/U/) && __feed_analyse[i - 3].symbol.match(/U/) && __feed_analyse[i - 4].symbol.match(/D/)) {
                    if (__feed_analyse[i].open > __feed_analyse[i - 4].open && __feed_analyse[i].close < __feed_analyse[i - 4].close) {
                        if (__feed_analyse[i - 1].close <= __feed_analyse[i].open && __feed_analyse[i - 3].open >= __feed_analyse[i - 4].close) {
                            console.log('[01/32] detected suite (Bearish III Continues): market can go down from the sequance : ' + __feed_analyse[i].position);
                            // 01/32 - Bearish III Continues
                        }
                    }
                }

                if (__feed_analyse[i - 1].symbol.match(/U/) && __feed_analyse[i].close === __feed_analyse[i - 1].low) {
                    console.log('[05/32] detected suite (Engulfing Bearish line): market can go down from the sequance : ' + __feed_analyse[i].position);
                    // 05/32 - Engulfing Bearish line
                    // need more analyses : the two candlesticks after [i] need to be down trend
                }

            }

            if (__feed_analyse[i].symbol === 'D3') {
                if ((__feed_analyse[i].high - __feed_analyse[i].open) > (__feed_analyse[i].open - __feed_analyse[i].close) * 20) {
                    console.log('[14/32] detected suite (Long Upper Shadow): market can go down from the sequance : ' + __feed_analyse[i].position);
                    // 14/32 - Long Upper Shadow
                }

                if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/)) {
                    if (__feed_analyse[i - 1].high === __feed_analyse[i].high && __feed_analyse[i - 2].open === __feed_analyse[i - 3].close) {
                        console.log('[15/32] detected suite (Tweezer Tops): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 15/32 - Tweezer Tops
                    }
                }

            }

            if (__feed_analyse[i].symbol === 'D4') {
                if ((__feed_analyse[i - 1].symbol.match(/D/) || __feed_analyse[i - 1].symbol.match(/U/)) && (__feed_analyse[i - 1].close === __feed_analyse[i].close || __feed_analyse[i - 1].open === __feed_analyse[i].close)) {
                    if ((__feed_analyse[i + 1].symbol.match(/D/) || __feed_analyse[i + 1].symbol.match(/U/)) && (__feed_analyse[i + 1].close === __feed_analyse[i].close || __feed_analyse[i + 1].open === __feed_analyse[i].close)) {
                        console.log('[13/32] detected suite (Shooting Star): market can go down from the sequance : ' + __feed_analyse[i].position);
                        // 13/32 - Shooting Star
                    }
                }

                if (__feed_analyse[i - 1].symbol === 'D5' && __feed_analyse[i - 2].symbol === 'D4') {
                    if (__feed_analyse[i].open === __feed_analyse[i - 1].close && __feed_analyse[i - 1].open === __feed_analyse[i - 2].close) {
                        console.log('[28/32] detected suite: (3 Bearish Soldier) market can go up from the sequance : ' + __feed_analyse[i].position + '  RSI: ' + __feed_analyse[i].RSI);
                        // 28/32 - 3 Bearish Soldier
                    }
                }

            }

            if (__feed_analyse[i].symbol === 'D5') {

            }
        }

        if (__feed_analyse[i].symbol.match(/S/)) {
            if (__feed_analyse[i].symbol === 'S1') {
                if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i].high < __feed_analyse[i - 1].open && __feed_analyse[i].low > __feed_analyse[i - 1].close) {
                    console.log('[03/32] detected suite (Bearish Harami Cross): market can go down from the sequance : ' + __feed_analyse[i].position);
                    // 03/32 - Bearish Harami Cross
                }
            }

            if (__feed_analyse[i].symbol === 'S2') {

            }

            if (__feed_analyse[i].symbol === 'S3') {

            }

            if (__feed_analyse[i].symbol === 'S4') {

            }

            if (__feed_analyse[i].symbol === 'S5') {

            }
        }
    }
    return trend;
}

function convert2symbol_format(_feed_source) {
    let _new_symbolized = [];
    let _feed_data = {};
    let __series = _feed_source.length;
    for (let i = 0; i < __series; i++) {
        let _timeStamp = _feed_source[i][0],
            _open = _feed_source[i][1],
            _close = _feed_source[i][4],
            _high = _feed_source[i][2],
            _low = _feed_source[i][3],
            _volume = _feed_source[i][5];
        _feed_data = badge(i, _timeStamp, _open, _close, _high, _low, _volume);
        if (i === 0) {
            _feed_data.gain = 0;
            _feed_data.loss = 0;
        } else {
            _before_close = _feed_source[i - 1][4];
            _change_result = (_close - _before_close).toFixed(8) / 1;
            if (_change_result >= 0) {
                _feed_data.gain = (_change_result === 0) ? 0 : _change_result;
                _feed_data.loss = 0;
            } else if (_change_result < 0) {
                _feed_data.gain = 0;
                _feed_data.loss = _change_result * -1;
            }
        }
        _new_symbolized.push(_feed_data);
    }
    return _new_symbolized;
}

function change_period(__feed_formated, __SequanceSum = 4) {
    /**
     * NEED MORE WORK AND MORE EFFORT
     */
    let __feed_formated_size = __feed_formated.length;
    let __new_feed = [];
    let __epochTime = undefined;
    let __pushNext = false;
    let high = 0,
        low = 0,
        open = 0,
        close = 0,
        volume = 0;
    for (let i = 0; i < __feed_formated_size; i++) {
        if (i <= (__feed_formated_size - __SequanceSum)) {
            for (let x = 0; x < __SequanceSum; x++) { // loop 4 time for 4h period
                try {
                    if (x === 0) {
                        // affect open position and low and high for inistialization
                        open = __feed_formated[i].open;
                        low = __feed_formated[i].low;
                        high = __feed_formated[i].high;
                        __epochTime = __feed_formated[i].timestamp;
                    }
                    if (x === (__SequanceSum - 1)) {
                        //affect close position
                        close = __feed_formated[i + x].close;
                        volume = (__feed_formated[i + x].volume + __feed_formated[i - x].volume) / 2;
                    }
                    low = (low < __feed_formated[i + x].low) ? low : __feed_formated[i + x].low;
                    high = (high > __feed_formated[i + x].high) ? high : __feed_formated[i + x].high;
                } catch (err) {}
            }
            i += __SequanceSum;
            __pushNext = true;
        } else {
            __pushNext = false;
        }
        // push table on the __new_feed table [timestamp, open, high, low, close, volume]
        if (__pushNext) {
            __new_feed.push([__epochTime, open, high, low, close, volume]);
        }
    }
    return __new_feed;
}

function rsi_analyses(__feed_seq, __onlyLast = false) {
    let __feed_seq_size = __feed_seq.length;
    let __feed_seq_midel_size = Math.floor(__feed_seq.length / 2);

    if (__onlyLast) {
        return {
            last_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[__feed_seq_size - 2].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
            last_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
        };
    } else {
        return {
            full_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[0].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
            middle_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[__feed_seq_midel_size].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
            last_seq: (((__feed_seq[__feed_seq_size - 1].RSI - __feed_seq[__feed_seq_size - 2].RSI) / __feed_seq[0].RSI) * 100).toFixed(2) / 1,
            full_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[0].timestamp),
            middle_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_midel_size].timestamp),
            last_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
        };
    }
}

function volume_analyses(__feed_seq, __onlyLast = false) {
    let __feed_seq_size = __feed_seq.length;
    let __feed_seq_midel_size = Math.floor(__feed_seq.length / 2);

    if (__onlyLast) {
        return {
            last_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_size - 2].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
            last_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
        };
    } else {
        return {
            full_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[0].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
            middle_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_midel_size].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
            last_seq: (((__feed_seq[__feed_seq_size - 1].volume - __feed_seq[__feed_seq_size - 2].volume) / __feed_seq[0].volume) * 100).toFixed(2) / 1,
            full_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[0].timestamp),
            middle_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_midel_size].timestamp),
            last_period: ms_2period_human(__feed_seq[__feed_seq_size - 1].timestamp, __feed_seq[__feed_seq_size - 2].timestamp)
        };
    }
}

function make_rsi(__feed_core, __period = 14) {
    let __feed_rsi = [];
    let seq = __feed_core.length;
    //let __eat_feed = {};
    let loss_sum = 0;
    let gain_sum = 0;
    let counter = 0;
    for (let i = __period; i < seq; i++) {
        //__eat_feed = __feed_core[i];
        loss_sum = 0;
        gain_sum = 0;
        counter = 0;
        for (let y = (i - __period); y < i; y++) {
            loss_sum += __feed_core[y].loss.toFixed(8) / 1;
            gain_sum += __feed_core[y].gain.toFixed(8) / 1;
            counter += 1;
        }
        __feed_core[i].avg_loss = (loss_sum / __period).toFixed(8) / 1;
        __feed_core[i].avg_gain = (gain_sum / __period).toFixed(8) / 1;
        __feed_core[i].RS = ((__feed_core[i].avg_gain / __feed_core[i].avg_loss).toFixed(4)) / 1;
        __feed_core[i].RSI = ((100 - (100 / (1 + __feed_core[i].RS))).toFixed(2)) / 1;
        __feed_rsi.push(__feed_core[i]);
    }
    return __feed_rsi;
}

function find_resistances(__feed_core, __includeHigh = false, __min_touch = 2) {
    let __feed_size = __feed_core.length;
    let resistances = [];
    let __res = [];
    for (let i = 0; i < __feed_size; i++) {
        if (__feed_core[i].symbol.match(/U/)) {
            if (__includeHigh) {
                __res.push(__feed_core[i].high, __feed_core[i].close);
            } else {
                __res.push(__feed_core[i].close);
            }
        }
    }
    for (let i = 0; i < __res.length; i++) {
        let count = 1;
        let tester = __res[i];
        if (tester) {
            for (let y = (i + 1); y < __res.length; y++) {
                if (tester === __res[y]) {
                    count += 1;
                    __res[y] = undefined;
                }
            }
            resistances.push({ resistance: tester, occurence: count });
        }
    }
    let __n_res = [];

    for (let i = 0; i < resistances.length; i++) {
        if (resistances[i].occurence >= __min_touch) {
            __n_res.push(resistances[i]);
        }
    }
    return __n_res;
}

function find_supports(__feed_core, __includeHigh = false, __min_touch = 2) {
    let __feed_size = __feed_core.length;
    let supports = [];
    let __supp = [];
    for (let i = 0; i < __feed_size; i++) {
        if (__feed_core[i].symbol.match(/D/)) {
            if (__includeHigh) {
                __supp.push(__feed_core[i].low, __feed_core[i].close);
            } else {
                __supp.push(__feed_core[i].close);
            }
        }
    }

    for (let i = 0; i < __supp.length; i++) {
        let count = 1;
        let tester = __supp[i];
        if (tester) {
            for (let y = (i + 1); y < __supp.length; y++) {
                if (tester === __supp[y]) {
                    count += 1;
                    __supp[y] = undefined;
                }
            }
            supports.push({ support: tester, occurence: count });
        }
    }

    let __n_supp = [];

    for (let i = 0; i < supports.length; i++) {
        if (supports[i].occurence >= __min_touch) {
            __n_supp.push(supports[i]);
        }
    }
    return __n_supp;
}

function Isolate_Seq(__last_seq, __seq, __includeLast = false) {
    let __last_seq_size = (__includeLast) ? __last_seq.length : __last_seq.length - 1;
    let __isolatedSeq = [];
    for (let i = (__last_seq_size - __seq); i < __last_seq_size; i++) {
        __isolatedSeq.push(__last_seq[i]);
    }
    return __isolatedSeq;
}

function last_seq(symbolized, lastOne = 1) {
    let last_sequances = [];
    for (let i = (symbolized.length - lastOne); i < symbolized.length; i++) {
        last_sequances.push(symbolized[i]);
    }
    return last_sequances;
}

let print_report = function(label, __sequances) {
    let __trend_line = getSeqanceTrend(__sequances);
    let __rsi_analyses = rsi_analyses(__sequances);
    let __volume_analyses = volume_analyses(__sequances);
    let _res = find_resistances(__sequances, true, 2);
    let _sup = find_supports(__sequances, true, 2);
    console.log(ansi.cyan(label));
    console.log(asTable(__sequances));
    console.log('');
    console.log(' * Estimated period: ' + ms_2period_human(__sequances[__sequances.length - 1].timestamp, __sequances[0].timestamp));
    console.log(' * Ico Trend line during ' + __trend_line.sequance + ' sequances  status go ' + __trend_line.status);
    console.log(' * Grow : ' + __trend_line.grow_percent.toFixed(2) + '%  - Decline : ' + __trend_line.decline_percent.toFixed(2) + '%  - Variation: ' + __trend_line.variation_percent.toFixed(2) + '%');
    console.log('');
    console.log(' * Volume change (%):  [ ' + __volume_analyses.full_period + ' -> ' + __volume_analyses.full_seq + '% ], [ ' + __volume_analyses.middle_period + ' -> ' + __volume_analyses.middle_seq + '% ], [ ' + __volume_analyses.last_period + ' -> ' + __volume_analyses.last_seq + '% ]');
    console.log(' * RSI change (%):  [ ' + __rsi_analyses.full_period + ' -> ' + __rsi_analyses.full_seq + '% ], [ ' + __rsi_analyses.middle_period + ' -> ' + __rsi_analyses.middle_seq + '% ], [ ' + __rsi_analyses.last_period + ' -> ' + __rsi_analyses.last_seq + '% ]');
    console.log('');
    console.log(' * CandleStick prediction:');
    candle_predict(__sequances);
    console.log('');
    console.log('* Buy/Sell Signal:');
    buy_sell_candle_detect(__sequances);

    let _asTableRes = [],
        _asTableSupp = [],
        __resitance_list = [],
        __support_list = [];

    console.log('');
    _res.forEach(function(r) {
        __resitance_list.push(r.resistance + ' (' + r.occurence + ')');
    }, this);
    console.log(ansi.blue(' * - Hard resistances:') + __resitance_list);

    console.log('');
    _res.forEach(function(r) {
        __support_list.push(r.resistance + ' (' + r.occurence + ')');
    }, this);
    console.log(ansi.green(' * - Good supports:') + __support_list);
    console.log('');
}


console.log('[' + time_t.date_time_now() + '] Start coinsDataCollector');


if (__argv['show-help'] || __argv.help) {
    console.log('HOW TO USE CLI:');
    console.log('   ' + __argv['$0'] + ' --list-exchanges');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --markets-infos');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --list-pairs');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --currencies-pricing');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --all-ico-trading --ratelimit=[miliseconds]');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --all-ico-orderbooks --ratelimit=[miliseconds]');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --ico-hlocv [currencies-pair]');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --ico-trading [currencies-pair]');
    console.log('   ' + __argv['$0'] + ' --exchange=[exchange name] --ico-orderbook [currencies-pair]');
    console.log('');
    console.log('    Default values:');
    console.log('      ratelimit = 1000ms');
    console.log('');
    process.exit(0);
}



(async() => {
    if (__argv.exchange) {
        var _exchange_name = (__argv.exchange) ? __argv.exchange : __argv.e;
        ccxt_exchange = new ccxt_quiker(_exchange_name);
        console.log('Exchange: ' + ansi.cyan(_exchange_name));
    }

    if (__argv['rate-limit']) {
        rateLimit = __argv['rate-limit'];
        console.log('Rate limit: ' + (rateLimit).yellow);
    }

    if (__argv['ico-trading']) {
        __icoBase = __argv['ico-trading'];
        __trades = await ccxt_exchange.currency_trades(__icoBase);
        __counter = __trades.length;
        __buy = [];
        __sell = [];

        for (let i = 0; i < __counter; i++) {
            if (__trades[i].side === 'buy') {
                __buy.push({
                    id: __trades[i].id,
                    Time: smart_date_time(__trades[i].datetime),
                    Type: __trades[i].type,
                    Action: __trades[i].side,
                    Price: __trades[i].price,
                    Quatity: __trades[i].amount,
                    Total: __trades[i].info.Total,
                    FillType: __trades[i].info.FillType,
                });
            }
            if (__trades[i].side === 'sell') {
                __sell.push({
                    id: __trades[i].id,
                    Time: smart_date_time(__trades[i].datetime),
                    Type: __trades[i].type,
                    Action: __trades[i].side,
                    Price: __trades[i].price,
                    Quatity: __trades[i].amount,
                    Total: __trades[i].info.Total,
                    FillType: __trades[i].info.FillType,
                });
            }
        }

        console.log(asTable(__buy));
        console.log('');
        console.log(asTable(__sell));

        let __analyses = {};
        for (let i = 0; i < __counter; i++) {
            __d = new Date(__trades[i].datetime);
            __d_str = (__d.getMonth() + 1) + '/' + __d.getDate() + '/' + __d.getFullYear() + ' ' + __d.getHours() + ':' + __d.getMinutes();
            __epoch = new Date(__d_str);
            __ms = __epoch.getTime(__d_str);

            if (__analyses[__ms] === undefined) {
                __analyses[__ms] = {
                    count: 1,
                }
                __analyses[__ms].buy = {
                    count: 0,
                    price: [],
                    quantity: 0,
                    total: 0
                }
                __analyses[__ms].sell = {
                    count: 0,
                    price: [],
                    quantity: 0,
                    total: 0
                }

                if (__trades[i].side === 'buy') {
                    __analyses[__ms].buy = {
                        count: 1,
                        price: [__trades[i].price],
                        quantity: __trades[i].amount,
                        total: __trades[i].info.Total
                    }
                }

                if (__trades[i].side === 'sell') {
                    __analyses[__ms].sell = {
                        count: 1,
                        price: [__trades[i].price],
                        quantity: __trades[i].amount,
                        total: __trades[i].info.Total
                    }
                }

            } else {
                __analyses[__ms].count = __analyses[__ms].count + 1;

                if (__trades[i].side === 'buy') {
                    __analyses[__ms].buy.count = __analyses[__ms].buy.count + 1;
                    __analyses[__ms].buy.price.push(__trades[i].price)
                    __analyses[__ms].buy.quantity = __analyses[__ms].buy.quantity + __trades[i].amount;
                    __analyses[__ms].buy.total = __analyses[__ms].buy.total + __trades[i].info.Total;
                }

                if (__trades[i].side === 'sell') {
                    __analyses[__ms].sell.count = __analyses[__ms].sell.count + 1;
                    __analyses[__ms].sell.price.push(__trades[i].price);
                    __analyses[__ms].sell.quantity = __analyses[__ms].sell.quantity + __trades[i].amount;
                    __analyses[__ms].sell.total = __analyses[__ms].sell.total + __trades[i].info.Total;
                }

            }
        }

        let __analyses_data = [];
        let __resume = {
            __loop: 0,
            period: [],
            buyer: 0,
            seller: 0,
            buy_quantity: 0,
            sell_quantity: 0,
            buy_total: 0,
            sell_total: 0,
            avg_buy: [],
            avg_sell: [],
        };
        for (let k in __analyses) {
            __analyses_data.push({
                Epoch: k,
                dateTime: k.valueOf(),
                b_count: __analyses[k].buy.count,
                b_avg_price: avrage(__analyses[k].buy.price),
                b_quantity: __analyses[k].buy.quantity.toFixed(8),
                b_total: __analyses[k].buy.total.toFixed(8),
                '-': '-',
                s_count: __analyses[k].sell.count,
                s_avg_price: avrage(__analyses[k].sell.price),
                s_quantity: __analyses[k].sell.quantity.toFixed(8),
                s_total: __analyses[k].sell.total.toFixed(8),
            });
            __resume.__loop += 1;
            __resume.period.push(k);
            __resume.avg_buy.push(avrage(__analyses[k].buy.price));
            __resume.avg_sell.push(avrage(__analyses[k].sell.price));
            __resume.buyer += __analyses[k].buy.count;
            __resume.seller += __analyses[k].sell.count;
            __resume.buy_quantity += __analyses[k].buy.quantity;
            __resume.sell_quantity += __analyses[k].sell.quantity;
            __resume.buy_total += __analyses[k].buy.total;
            __resume.sell_total += __analyses[k].sell.total;
        }

        console.log('');
        console.log(asTable(__analyses_data));
        let epoch_perdiod_calculate = epoch_period(__resume.period);
        console.log('Period : ' + epoch_perdiod_calculate / 1000 + ' sec  (' + (epoch_perdiod_calculate / 1000) / 60 + ' m)');
        console.log('Total buyer: ' + __resume.buyer + '   Total seller: ' + __resume.seller);
        console.log('Avg buy: ' + avrage(__resume.avg_buy) + ' ' + nim_max(__resume.avg_buy) + '   Avg sell: ' + avrage(__resume.avg_sell) + ' ' + nim_max(__resume.avg_sell));
        console.log('Qty buy: ' + __resume.buy_quantity + '   Qty sell: ' + __resume.sell_quantity);
        console.log('Total buy: ' + __resume.buy_total.toFixed(8) + '   Total sell: ' + __resume.sell_total.toFixed(8));
    }

    if (__argv['markets-infos'] === true) {
        let markets_info = await ccxt_exchange.load_markets();
        let asTable_markets = [];
        for (let k in markets_info) {
            asTable_markets.push({
                Base: markets_info[k].base,
                Quote: markets_info[k].quote,
                Market: markets_info[k].symbol,
                isActive: markets_info[k].info.IsActive,
                Created: markets_info[k].info.Created,
                Notice: markets_info[k].info.Notice
            });
        }
        console.log(asTable(asTable_markets));
    }

    if (__argv['currencies-pricing'] === true) {
        let ico_pricing = await ccxt_exchange.prices_currencies();
        let asTable_pricing = [];
        for (let k in ico_pricing) {
            asTable_pricing.push({
                Market: (ico_pricing[k].ask >= ico_pricing[k].high) ? ansi.bgBlue(k) : (ico_pricing[k].ask <= ico_pricing[k].low) ? ansi.red(k) : ansi.yellow(k),
                TimeStamp: smart_date_time(ico_pricing[k].datetime),
                High: (ico_pricing[k].ask > ico_pricing[k].high) ? ansi.bgBlue(ico_pricing[k].high) : (ico_pricing[k].bid <= ico_pricing[k].low) ? ansi.bgRed(ico_pricing[k].high) : ico_pricing[k].high,
                Low: ico_pricing[k].low,
                Last: (ico_pricing[k].last <= ico_pricing[k].low) ? ansi.red(ico_pricing[k].last) : (ico_pricing[k].last >= ico_pricing[k].high) ? ansi.green(ico_pricing[k].last) : ansi.yellow(ico_pricing[k].last),
                Volume: ico_pricing[k].quoteVolume,
                BaseVolume: ico_pricing[k].baseVolume,
                Bid: (ico_pricing[k].bid <= ico_pricing[k].low) ? ansi.red(ico_pricing[k].bid) : ansi.yellow(ico_pricing[k].bid),
                Ask: (ico_pricing[k].ask >= ico_pricing[k].last) ? ansi.green(ico_pricing[k].ask) : (ico_pricing[k].ask >= ico_pricing[k].low) ? ansi.yellow(ico_pricing[k].ask) : ansi.lightRed(ico_pricing[k].ask),
                'Will go': ((ico_pricing[k].ask >= ico_pricing[k].last)) ? ansi.green('UP') : ansi.red('Down')
            });
        }
        console.log(asTable(asTable_pricing));
    }

    if (__argv['ico-quick-analyses']) {
        let __series = 0;
        let __timeframe = '1h'; // default frame 1h
        let __Base = undefined;
        let __all_ico = [];

        if (__argv['ico-quick-analyses'] !== true) __Base = __argv['ico-quick-analyses'].split(',');
        if (__argv['time-frame']) __timeframe = __argv['time-frame'];

        if (__Base === undefined) {
            console.log('[!!] Analyses of all altcoin will be performed this action can take many time, cause be grace time between each request');
            __all_ico = await ccxt_exchange.get_markets_list();
            console.log('[!!] this operation can take up to ' + ((__all_ico.length * 1.5) + __all_ico.length) / 60 + ' minutes');
        } else {
            __all_ico = __Base;
        }
        let __all_ico_size = __all_ico.length;
        let __asTableData = [];
        await time_t.__s_sleep(1);

        for (let __i = 0; __i < __all_ico_size; __i++) {
            try {
                let __icoBase = __all_ico[__i];
                let __data_period = await ccxt_exchange.OHLCV_currency(__icoBase, __timeframe);
                let __data_period_symbolized = convert2symbol_format(__data_period);
                let symbolized = make_rsi(__data_period_symbolized, 14);
                let ico = last_seq(symbolized, 5);
                let ico_change = 0;
                let __rsi_analyses = rsi_analyses(ico, true);
                let __volume_analyses = volume_analyses(ico, true);
                let candelSignal = candle_predict(ico, 5);
                let __what_action_to_do = ansi.yellow('----');

                if (ico[4].gain > 0) {
                    ico_change = ico[4].gain;
                } else if (ico[4].loss > 0) {
                    ico_change = ico[4].loss * -1;
                }

                if (ico[4].RSI >= 16 && ico[4].RSI <= 30) {
                    // Buy signal
                    if (ico[3].symbol.match('/U/') && ico[2].symbol.match(/U/)) {
                        if (ico[2].close <= ico[3].close) {
                            __what_action_to_do = ansi.green('BUY');
                        }
                    }
                } else {
                    // Sell signal
                    if (ico[3].symbol.match(/D/) && ico[2].symbol.match(/D/)) {
                        if (ico[3].close >= ico[2].close) {
                            __what_action_to_do = ansi.yellow('SELL');
                        }
                    }
                }

                //console.dir(getSeqanceTrend(Isolate_Seq(last_24h_seq, 4, true)));
                //console.dir(getSeqanceTrend(last_24h_seq));
                let __trend_line = getSeqanceTrend(ico);
                let __global_trend_line = getSeqanceTrend(symbolized);
                let __icoData = {
                    ico: __icoBase,
                    time: ico[4].time,
                    high: ico[4].high,
                    open: (ico[4].open <= ico[4].close) ? ansi.green(ico[4].open) : ansi.yellow(ico[4].open),
                    close: (ico[4].close >= ico[4].open) ? ansi.green(ico[4].close) : ansi.yellow(ico[4].close),
                    low: ico[4].low,
                    candle: (ico[4].open <= ico[4].close) ? ansi.green('UP') : ansi.yellow('DOWN'),
                    //volume: ico[4].volume,
                    change: ico_change,
                    rsi: ico[4].RSI,
                    rsi_change: (__rsi_analyses.last_seq >= 0) ? ansi.green(__rsi_analyses.last_seq) : ansi.yellow(__rsi_analyses.last_seq),
                    rsi_changein: __rsi_analyses.last_period,
                    vol_change: (__volume_analyses.last_seq >= 0) ? ansi.green(__volume_analyses.last_seq) : ansi.yellow(__volume_analyses.last_seq),
                    vol_changein: __volume_analyses.last_period,
                    action: __what_action_to_do,
                    candelSignal: candelSignal,
                    trend_line: (__trend_line.status.toUpperCase() === 'UP') ? ansi.green(__trend_line.status.toUpperCase()) : ansi.cyan(__trend_line.status.toUpperCase()),
                    global_trend: (__global_trend_line.status.toUpperCase() === 'UP') ? ansi.green(__global_trend_line.status.toUpperCase()) : ansi.cyan(__global_trend_line.status.toUpperCase()),
                };

                __asTableData.push(__icoData);
                console.log(' + ' + __icoBase + '  candleSignal: ' + candelSignal + ' - ' + ico[4].time + '  action: ' + __what_action_to_do);
                console.log('  `--- [ high: ' + ico[4].high + ' open: ' + ico[4].open + ' close: ' + ico[4].close + ' low: ' + ico[4].low + ']  candle: ' + ico[4].symbol + ' change:' + ico_change + '  rsi: ' + ico[4].RSI);
                console.log('  `--- rsi_change:(' + __rsi_analyses.last_seq + ' % in ' + __rsi_analyses.last_period + ') - vol:(' + __volume_analyses.last_seq + '%  in ' + __volume_analyses.last_period + ')');
                console.log('  `--- ico trend line during ' + __trend_line.sequance + ' sequances  status go ' + __trend_line.status + ' -- grow : ' + __trend_line.grow_percent.toFixed(2) + '%  - decline : ' + __trend_line.decline_percent.toFixed(2) + '%  - variation: ' + __trend_line.variation_percent.toFixed(2) + '%');
            } catch (error) {
                console.log('Err: ' + error);
            }
            await time_t.__s_sleep(1.5);
        }

        console.log('');
        console.log('');
        console.log(asTable(__asTableData));
    }

    if (__argv['ico-analyses']) {
        let __series = 0;
        let __timeframe = '1h';
        let __icoBase = __argv['ico-analyses'];
        let learning = [];
        if (__argv['time-frame']) {
            __timeframe = __argv['time-frame'];
        }

        let __data_period = await ccxt_exchange.OHLCV_currency(__icoBase, __timeframe);
        //console.dir(make_rsi(symbolized, 14));
        // BEGIN OF 1H FRAME
        let __data_period_symbolized = convert2symbol_format(__data_period);
        let symbolized = make_rsi(__data_period_symbolized, 14);
        let last_24h_seq = last_seq(symbolized, 24);
        print_report('[ ** ] Report of 1h frame during 24h', last_24h_seq);
        // END OF 1H FRAME

        // CONVERT TO 4H FRAME
        let __period4h_symbolized = make_rsi(convert2symbol_format(change_period(__data_period_symbolized)), 14);
        let last_1w_seq = last_seq(__period4h_symbolized, 42);
        print_report('[ ** ] Report of 4h frame during 1 week', last_1w_seq);
        // END OF 4H FRAME



        /*
        console.log(asTable(last_24h_seq));
        console.log('');
        console.log(' * Estimated period: ' + ms_2period_human(last_24h_seq[last_24h_seq.length - 1].timestamp, last_24h_seq[0].timestamp));
        console.log(' * Ico Trend line during ' + __trend_line.sequance + ' sequances  status go ' + __trend_line.status);
        console.log(' * Grow : ' + __trend_line.grow_percent.toFixed(2) + '%  - Decline : ' + __trend_line.decline_percent.toFixed(2) + '%  - Variation: ' + __trend_line.variation_percent.toFixed(2) + '%');
        console.log('');

        console.log('Volume change (%):  [ ' + __volume_analyses.full_period + ' -> ' + __volume_analyses.full_seq + '% ], [ ' + __volume_analyses.middle_period + ' -> ' + __volume_analyses.middle_seq + '% ], [ ' + __volume_analyses.last_period + ' -> ' + __volume_analyses.last_seq + '% ]');
        console.log('');
        console.log('RSI change (%):  [ ' + __rsi_analyses.full_period + ' -> ' + __rsi_analyses.full_seq + '% ], [ ' + __rsi_analyses.middle_period + ' -> ' + __rsi_analyses.middle_seq + '% ], [ ' + __rsi_analyses.last_period + ' -> ' + __rsi_analyses.last_seq + '% ]');

        console.log('');
        console.log('* CandleStick prediction:');
        candle_predict(last_24h_seq);
        console.log('');
        console.log('* Buy/Sell Signal:');
        buy_sell_candle_detect(last_24h_seq);

        let _asTableRes = [],
            _asTableSupp = [],
            __resitance_list = [],
            __support_list = [];

        console.log('');
        console.log('[*] - Hard resistances:');
        _res.forEach(function(r) {
            __resitance_list.push(r.resistance + ' (' + r.occurence + ')');
        }, this);
        console.log(__resitance_list);

        console.log('');
        console.log('[*] - Good supports:');
        _res.forEach(function(r) {
            __support_list.push(r.resistance + ' (' + r.occurence + ')');
        }, this);
        console.log(__support_list);
        console.log('');
        console.log(' ** Using 4h frame for 1week period');
        console.log(asTable(last_1w_seq));
        */

        //console.log(asTable(change_period(__data_5m_symbolized)));
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
    }

    if (__argv['ico-orderbook']) {
        let __orderbook = [];
        let ico_orderbook = await ccxt_exchange.currency_orderbook(__argv['ico-orderbook']);
        let __orderbook_full = orderbook_analyses(ico_orderbook, 'full', true);
        let __orderbook_100 = orderbook_analyses(ico_orderbook, 100, true);
        let __orderbook_10 = orderbook_analyses(ico_orderbook, 10, true);
        //__orderbook.push(__orderbook_full.asTable); //, __orderbook_100.asTable, __orderbook_10.asTable);
        //console.dir(__orderbook);
        console.log('');
        console.log(asTable(__orderbook_full.asTable));
        console.log('');
        console.log(asTable(__orderbook_100.asTable));
        console.log('');
        console.log(asTable(__orderbook_10.asTable));
    }
})();




/*

(async() => {

})();

*/