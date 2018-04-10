const __ico_trading = require('./libs/ico_trading.js');

let ico_trading = new __ico_trading('bittrex', 1500, true, true);

console.log('Exchange : ' + ico_trading.getExchange());
console.log('Rate limit : ' + ico_trading.getRateLimit());

(async() => {
    //await ico_trading.LoadCurrenciesPricingList(false);
    //await ico_trading.LoadMarketInformations();
    //await ico_trading.LoadMarketCurrencies();
    //await ico_trading.icosAnalysesCoins(['MUE/BTC', 'SC/BTC', 'XVG/BTC', 'EMC2/BTC']);

    let __json_data = await ico_trading.icoAnalysesCoin('MUE/BTC', ['1h'], false);
    //console.dir(JSON.stringify(__json_data[0].report));
    console.dir(__json_data[0].report.rsi_analyse);
    console.log('-----------------------------');
    console.dir(__json_data[0].report);

})();
