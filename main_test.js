async function load_markets(__ccxt) {
    var __promise = new Promise((resolve, reject) => {
        try {
            let markets = await __ccxt.load_markets();
            resolve(markets);
        } catch (err) {
            reject(err);
        }

    });
    return __promise;
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




function _old_candle_predict(__feed_analyse, __seq = 10) {
    let __feed_size = __feed_analyse.length;
    let compare = '';
    let __new_feed = [];

    // 01/32  DOWN
    // 02/32  DOWN
    // 03/32  DOWN
    // 04/32  DOWN  OK
    // 05/32  DOWN  OK
    // 06/32  DOWN  OK
    // 07/32  DOWN  OK
    // 08/32  DOWN  --
    // 09/32  DOWN
    // 10/32  DOWN
    // 11/32  DOWN  OK
    // 12/32  DOWN  OK
    // 13/32  DOWN  OK
    // 14/32  DOWN  OK  hidden
    // 15/32  DOWN
    // 16/32  DOWN  OK

    // 17/32  UP
    // 18/32  UP    
    // 19/32  UP    OK
    // 20/32  UP    OK
    // 21/32  UP    OK
    // 22/32  UP    OK
    // 23/32  UP    OK
    // 24/32  UP    OK
    // 25/32  UP    --
    // 26/32  UP    OK
    // 27/32  UP    --
    // 28/32  UP    OK
    // 29/32  UP    OK
    // 30/32  UP    OK  hidden
    // 31/32  UP    OK
    // 32/32  UP    OK

    for (let i = 3; i < __feed_size; i++) {

        if ((__feed_analyse[i].close === __feed_analyse[i - 1].open || __feed_analyse[i].close === __feed_analyse[i - 1].close) && (__feed_analyse[i].open === __feed_analyse[i - 1].open || __feed_analyse[i].open === __feed_analyse[i - 1].close)) {
            if (__feed_analyse[i - 2].symbol === 'D5' && (__feed_analyse[i - 2].open === __feed_analyse[i - 1].open || __feed_analyse[i - 2].open === __feed_analyse[i - 1].close)) {
                console.log('(32/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                // 32/32 UP  -  OK
            }

            if (__feed_analyse[i - 2].symbol === 'U5' && (__feed_analyse[i - 2].close === __feed_analyse[i - 1].open || __feed_analyse[i - 2].close === __feed_analyse[i - 1].close)) {
                console.log('(16/32) [=] Market will go down from position : ' + __feed_analyse[i].position);
                // 16/32 DOWN  -  OK
            }

            if (__feed_analyse[i - 2].symbol === 'U4' && __feed_analyse[i - 3].symbol === 'D4' && __feed_analyse[i - 2].open === __feed_analyse[i - 3].close && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                console.log('(12/32) [=] Market will go down from position : ' + __feed_analyse[i].position);
                // 12/32 DOWN  -  OK
            }

            if (__feed_analyse[i - 2].symbol === 'D1' && __feed_analyse[i - 3].symbol === 'U1' && __feed_analyse[i - 2].open === __feed_analyse[i - 3].open && __feed_analyse[i - 3].close > __feed_analyse[i].open && __feed_analyse[i - 3].close > __feed_analyse[i].close) {
                console.log('(27/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                // 27/32 UP  -  OK
            }

        }


        if (__feed_analyse[i].symbol.match(/U/)) {
            if (__feed_analyse[i].symbol === 'U1') {
                /* review: tow other candles comming from up to down in the position -2 and -3
                if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 1].low === __feed_analyse[i].open && __feed_analyse[i - 1].open < __feed_analyse[i].close) {
                    console.log('(21/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                    // 21/32 UP
                }
                */
            }
            if (__feed_analyse[i].symbol === 'U2') {

            }


            if (__feed_analyse[i].symbol === 'U3') {
                if ((__feed_analyse[i].open - __feed_analyse[i].low) > (__feed_analyse[i].close - __feed_analyse[i].open) * 10) {
                    //console.log('(30/32) [Long Lower Shadow] Market can go up from position : ' + __feed_analyse[i].position + '  -  ' + (__feed_analyse[i].open - __feed_analyse[i].low) + ' <--- ol > co ---> ' + (__feed_analyse[i].close - __feed_analyse[i].open) * 3);
                    // 30/32 UP  -  OK
                }


            }
            if (__feed_analyse[i].symbol === 'U4') {

            }
            if (__feed_analyse[i].symbol === 'U5') {
                if (__feed_analyse[i - 1].symbol === 'U4' && __feed_analyse[i - 1].close === __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol === 'U5' && __feed_analyse[i - 2].close === __feed_analyse[i - 1].open) {
                        console.log('(11/32) [=] Market will go down from position : ' + __feed_analyse[i].position);
                        // 11/32 DOWN  -  OK
                    }
                }
                if ((__feed_analyse[i - 1].symbol.match(/D/) || __feed_analyse[i - 1].symbol.match(/U/)) && (__feed_analyse[i - 1].close === __feed_analyse[i].close || __feed_analyse[i - 1].open === __feed_analyse[i].close)) {
                    if ((__feed_analyse[i + 1].symbol.match(/D/) || __feed_analyse[i + 1].symbol.match(/U/)) && (__feed_analyse[i + 1].close === __feed_analyse[i].close || __feed_analyse[i + 1].open === __feed_analyse[i].close)) {
                        console.log('(29/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                        // 29/32 UP  -  OK
                    }
                }
                if (__feed_analyse[i - 1].symbol.match(/D/) && __feed_analyse[i - 1].open === __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 2].open === (__feed_analyse[i - 1].close + __feed_analyse[i - 1].open) / 2 && __feed_analyse[i - 1].open === (__feed_analyse[i - 2].close + __feed_analyse[i - 2].open) / 2) {
                        console.log('(20/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                        // 20/32 UP
                    }
                }
            }
            if (__feed_analyse[i].symbol === 'U6') {

            }
            /*for (let x = (i - 1); i > (i - 3); i--) {
            }*/
        }


        if (__feed_analyse[i].symbol.match(/D/)) {
            //console.log(__feed_analyse[i].symbol + ' - Down');
            if (__feed_analyse[i].symbol === 'D1') {
                if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 1].open < __feed_analyse[i].close && __feed_analyse[i - 1].close > __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol === 'U1' && __feed_analyse[i - 2].open > __feed_analyse[i - 1].open && __feed_analyse[i - 2].open < __feed_analyse[i - 1].close && __feed_analyse[i - 2].close > __feed_analyse[i - 1].close) {
                        console.log('(18/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                        // 18/32 UP  -  OK
                    }

                    /*
                    if (__feed_analyse[i - 1].symbol === 'D1' && __feed_analyse[i - 1].open === __feed_analyse[i].close) {
                        if (__feed_analyse[i - 2].symbol === 'D1' && __feed_analyse[i - 2].open === __feed_analyse[i - 1].open && __feed_analyse[i - 2].close > __feed_analyse[i].open) {
                            console.log('(24/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                            // 24/32 UP
                        }
                    }
                    */

                    if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 1].close === __feed_analyse[i].close) {
                        console.log('(26/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                        // 25/32 UP  -  OK
                    }
                }

                if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 1].close > __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol === 'U1' && __feed_analyse[i - 1].close > __feed_analyse[i - 2].close && __feed_analyse[i - 1].open > __feed_analyse[i - 2].open) {
                        console.log('(04/32) [=] Market can go down');
                        // 04/32 DOWN  -  OK
                    }
                }

                if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 1].open === __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol === 'U1' && __feed_analyse[i - 2].close === __feed_analyse[i - 1].open && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                        console.log('(07/32) [=] Market will go down from position : ' + __feed_analyse[i].position);
                        // 07/32 DOWN  -  OK
                    }
                }

                // 06
                if (__feed_analyse[i - 1].symbol === 'S1' && __feed_analyse[i - 1].close > __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol === 'U1' && __feed_analyse[i - 2].close < __feed_analyse[i - 1].close && __feed_analyse[i - 2].open < __feed_analyse[i].close) {
                        console.log('(06/32) [=] Market will go down from position : ' + __feed_analyse[i].position);
                        // 06/32 DOWN  -  OK
                    }
                }

                if (__feed_analyse[i - 1].symbol === 'U1' && __feed_analyse[i - 1].low === __feed_analyse[i].low) {
                    if (__feed_analyse[i - 2].symbol.match(/D/) && __feed_analyse[i - 3].symbol.match(/U/) && __feed_analyse[i - 2].close === __feed_analyse[i - 3].open) {
                        console.log('(31/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                        // 31/32 UP  -  OK
                    }
                }

            }

            if (__feed_analyse[i].symbol === 'D2') {
                if (__feed_analyse[i - 1].symbol === 'U2' && __feed_analyse[i - 1].low === __feed_analyse[i].close && __feed_analyse[i - 1].close < __feed_analyse[i].open) {
                    console.log('(05/32) [=] Market will go down from position : ' + __feed_analyse[i].position);
                    // 05/32  UP  -  OK but need revision
                }
            }


            if (__feed_analyse[i].symbol === 'D3') {
                if ((__feed_analyse[i].high - __feed_analyse[i].open) > (__feed_analyse[i].open - __feed_analyse[i].close) * 10) {
                    //console.log('(14/32) [Long Upper Shadow] Market can go down from position : ' + __feed_analyse[i].position + ' - ' + (__feed_analyse[i].high - __feed_analyse[i].open) + ' <-- ho > oc -->' + (__feed_analyse[i].open - __feed_analyse[i].close) * 3);
                    // 14/32 DOWN  -  OK
                }

            }

            if (__feed_analyse[i].symbol === 'D4') {
                if ((__feed_analyse[i - 1].symbol.match(/D/) || __feed_analyse[i - 1].symbol.match(/U/)) && (__feed_analyse[i - 1].close === __feed_analyse[i].close || __feed_analyse[i - 1].open === __feed_analyse[i].close)) {
                    if ((__feed_analyse[i + 1].symbol.match(/D/) || __feed_analyse[i + 1].symbol.match(/U/)) && (__feed_analyse[i + 1].close === __feed_analyse[i].close || __feed_analyse[i + 1].open === __feed_analyse[i].close)) {
                        console.log('(13/32) [=] Market will go down from position : ' + __feed_analyse[i].position);
                        // 13/32 DOWN  -  OK
                    }
                }

            }

            if (__feed_analyse[i].symbol === 'D5') {
                /*   Error
                if (__feed_analyse[i - 1].symbol === 'D4' && __feed_analyse[i - 1].close === __feed_analyse[i].open) {
                    if (__feed_analyse[i - 2].symbol === 'D5' && __feed_analyse[i - 2].close === __feed_analyse[i - 1].open) {
                        console.log('(23/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                        // 23/32  UP
                    }
                }
                */
            }
        }

        if (__feed_analyse[i].symbol.match(/S/)) {
            if (__feed_analyse[i].symbol === 'S1' && __feed_analyse[i - 1] === 'U1' && __feed_analyse[i - 1].open > __feed_analyse[i].open && __feed_analyse[i - 1].close < __feed_analyse[i].close) {
                console.log('(19/32) [=] Market will go up from position : ' + __feed_analyse[i].position);
                // 19/32  UP  -  OK
            }
        }
    }
}