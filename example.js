const {Observable} = require('rxjs');
const ajs = require('./');
const request = require('request');
const createServer = require('./fixtures/server');
const watcherGuardian = require('./fixtures/watcherGuardian');

const system = ajs.createSystem();
const server = system.actorOf(createServer);
const watcher = system.actorOf(watcherGuardian);

server.ask({type: 'init', payload: {port: 9000}})
    .subscribe(x => {
        console.log(x);
    });

watcher
    .ask({type: 'init', payload: ['./src', './test']})
    .subscribe((reply) => {
        console.log('Guardian ready');
    });

setTimeout(function() {
    watcher
        .ask({type: 'init', payload: ['./src', './test']})
        .subscribe((reply) => {
            console.log('Guardian ready');
        });
}, 5000);
