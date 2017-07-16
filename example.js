const {Observable} = require('rxjs');
const ajs = require('./');
const request = require('request');
const createServer = require('./fixtures/server');
const watcherGuardian = require('./fixtures/watcherGuardian');
const serveStatic = require('./fixtures/serveStatic');

const system  = ajs.createSystem();
const server  = system.actorOf(createServer);
const watcher = system.actorOf(watcherGuardian);
const ss      = system.actorOf(serveStatic);


// ss.ask({type: 'init', payload: ['test', 'src', {route: '/shane', dir: 'web'}]})
//     .flatMap(output => {
//         const {middleware} = output;
//         return server.ask({
//             type: 'init',
//             payload: {
//                 port: 9000,
//                 middleware
//             }
//         }).map(address => `http://localhost:${address.port}`);
//     })
//     .subscribe(x => {
//         console.log('ready!', x);
//     })

// watcher
//     .ask({type: 'init', payload: ['./src', './test']})
//     .subscribe((reply) => {
//         console.log('Guardian ready 1 ');
//     });