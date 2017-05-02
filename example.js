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
filewatchGuardian
    .ask({type: 'init', payload: ['test', 'src']})
    // .flatMap(() => {
    //     return Rx.Observable
    //         .timer(2000)
    //         .flatMap(() => system.gracefulStop(filewatchGuardian))
    // })
    .subscribe(answer => {
        console.log('All setup!');
        // system.stop()
        // console.log(system.actorRegister.getValue());
        // system.gracefulStop(filewatchGuardian).subscribe();
    });
// console.log(filewatchGuardian);
