const {Observable} = require('rxjs');
const ajs = require('./');
const request = require('request');
const createServer = require('./fixtures/server');
const watcherGuardian = require('./fixtures/watcherGuardian');

const system = ajs.createSystem();
// const guardian = system.actorOf(watcherGuardian);
const server = system.actorOf(createServer);

server.ask({type: 'init', payload: {port: 9000}})
    .subscribe(x => {
        console.log(x);
    });

// guardian
//     .ask({type: 'init', payload: ['./src', './test']})
//     .subscribe((reply) => {
//         console.log('Guardian ready');
//     });

setTimeout(function() {
    server.ask({type: 'init', payload: {port: 9001}})
        .subscribe(x);
}, 5000);
