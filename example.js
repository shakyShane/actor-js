const Rx = require('rxjs');

const obs1 = Rx.Observable.timer(200);
const obs2 = Rx.Observable.timer(400).ignoreElements();

Rx.Observable.zip(obs1, obs2)
    .subscribe(x => {
        console.log(x);
    }, () => {
        console.log('err');
    }, () => {
        console.log('complete');
    });