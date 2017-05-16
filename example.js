require('source-map-support').install();
const Rx = require('rxjs');
const {concat, of, empty} = Rx.Observable;
const {Map} = require('immutable');
const {createSystem} = require('./dist/index');
const {create: FileWatcher} = require('./fixtures/watcher');
const {create: FileWatcherGuardian} = require('./fixtures/watcherGuardian');
const {create: Clients} = require('./fixtures/clients');
const {create: ServeStatic} = require('./fixtures/serveStatic');
const {create: Server} = require('./fixtures/server');

const system = createSystem();
const clients = system.actorOf(Clients, 'clients');
const filewatchGuardian = system.actorOf(FileWatcherGuardian, 'file-watcher');
const serverGuardian = system.actorOf(Server, 'server');

const watcher = filewatchGuardian.ask({
    type: 'init',
    payload: ['test', 'src']
}).do(output => console.log('watching files...'));

const server = serverGuardian.ask({
    type: 'init',
    payload: {
        port: 9000,
        hostname: 'localhost'
    }
})
.do(x => console.log('server address', x));

Rx.Observable.concat(watcher, server)
    .toArray()
    .subscribe(x => {
        console.log('All ready!')
    }, e => {
        console.log(e);
    });