'use strict';

module.exports = class time_tools {
    constructor() {
        this.__counter = 0;
        this.__start = {};
        this.__checkpoint = [];
        this.__end = 0;
    }

    //__ms_sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    start_timing() {
        this.__start = {
            epoch: this.date_time_epoch_ms()
        }
    }

    checkpoint_timing(label = false) {
        this.__counter += 1;
        if (!label) {
            label = 'none';
        }
        this.__checkpoint.push({ checkpoint: this.__counter, epoch: this.date_time_epoch_ms(), label: label });
    }

    end_timing() {
        this.__end = {
            epoch: this.date_time_epoch_ms()
        }
    }

    timing_report() {
        var start_to_end = this.__end.epoch - this.__start.epoch;
        console.log('-------------------------');
        console.log('check points:' + this.__counter);
        console.log('from staring to the end of timming: ' + start_to_end + 'ms (' + start_to_end / 1000 + 's) - (' + (start_to_end / 1000) / 60 + ')');
        for (var i = 0; i < this.__counter; i++) {
            var start_to_checkpoint = this.__checkpoint[i].epoch - this.__start.epoch;
            console.log('seq: ' + this.__checkpoint[i].checkpoint + ' label: ' + this.__checkpoint[i].label + ' - timing from start: ' + start_to_checkpoint + 'ms (' + start_to_checkpoint / 1000 + 's)');
        }
    }

    async __u_sleep(ms) {
        var __promise = new Promise((resolve, reject) => {
            setTimeout(function() {
                resolve(true);
            }, ms);
        });
        return __promise;
    }

    async __s_sleep(s) {
        var __promise = new Promise((resolve, reject) => {
            setTimeout(function() {
                resolve(true);
            }, s * 1000);
        });
        return __promise;
    }

    date_time_now() {
        let D = new Date();
        return D.getDate() + "/" + (D.getMonth() + 1) + "/" + D.getFullYear() + " @ " + D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds();
    }

    date_now() {
        let D = new Date();
        return D.getDate() + "/" + (D.getMonth() + 1) + "/" + D.getFullYear();
    }

    time_now() {
        let D = new Date();
        return D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds();
    }

    date_time_epoch_ms() {
        let D = new Date();
        return D.getTime();
    }

    date_time_epoch() {
        let D = new Date();
        return D.getTime() / 1000;
    }

    smart_date_time(dd) {
        let D = new Date(dd);
        return D.getDate() + "/" + (D.getMonth() + 1) + " @ " + D.getHours() + ":" + D.getMinutes() + ":" + D.getSeconds();
    }

    epoch_smart_date_time(dd) {
        let D = new Date(dd);
        return D.getDate() + "/" + (D.getMonth() + 1) + " @ " + D.getHours() + ":" + D.getMinutes();
    }
}

/*

var ttool = require('./time_tools.js');
var tt = new ttool();

(async() => {
    tt.start_timing();
    console.log(tt.date_time_now() + '  * sleeping for 2 seconds.');
    await tt.__s_sleep(2);
    tt.checkpoint_timming('after 2s sleep');
    console.log(tt.date_time_now() + '  * wakeup.');
    console.log('timestamp in ms : ' + tt.date_time_epoch_ms());
    await tt.__s_sleep(1);
    tt.checkpoint_timming('after 1s sleep');
    console.log('timestamp in s  : ' + tt.date_time_epoch());
    console.log(tt.date_time_epoch_ms() + '  * sleeping for 550 ms.');
    await tt.__u_sleep(550);
    tt.checkpoint_timming('after 550ms sleep');
    console.log(tt.date_time_epoch_ms() + '  * wakeup.');
    tt.end_timing();
    tt.timing_report();
})();

*/