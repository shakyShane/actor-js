require('source-map-support').install();
const Rx = require('rxjs');
const {concat, of, empty, merge, timer} = Rx.Observable;
const {Map} = require('immutable');
const {createSystem} = require('./dist/index');
const {create: FileWatcher} = require('./fixtures/watcher');
const {create: FileWatcherGuardian} = require('./fixtures/watcherGuardian');
const {create: Clients} = require('./fixtures/clients');
const {create: ServeStatic} = require('./fixtures/serveStatic');
const {create: Server} = require('./fixtures/server');
//
const system = createSystem();

function fac() {

    const initialState = {
        loading: false
    };

    const reducers = {
        'loading': function (state, payload) {
            return Object.assign({}, state, {loading: payload});
        }
    };

    let myState = initialState;
    let messages = new Rx.Subject();
    let outgoing = new Rx.Subject();

    return {
        postStart() {
            messages
                .filter(x => x.action.payload.type === 'reload')
                .switchMap(x => {
                    return Rx.Observable.timer(2000).mapTo(x)
                })
                .subscribe(outgoing)
        },
        reducers,
        state: () => {
            // return
        },
        receive(message, _, sender) {
            if (reducers[message.type]) {
                myState = reducers[message.type](myState, message.payload);
                sender.reply(myState);
            } else {
                outgoing
                    .filter(x => x.messageID === _.messageID)
                    .do(x => {
                        sender.reply(x);
                    })
                    .subscribe();
                messages.next(_);
            }
        },
        effects: {
            // 'reload': function(message$) {
            //     return message$.ofType();
            // }
        }
    }
}

const clients = system.actorOf(fac, 'clients');

merge(
    clients.ask({type: 'reload'}),
    timer(1000).flatMap(() => clients.ask({type: 'reload'})))
        .subscribe(x => {
            console.log(x);
        });

// const filewatchGuardian = system.actorOf(FileWatcherGuardian, 'file-watcher');
// const serverGuardian = system.actorOf(Server, 'server');
//
// const watcher = filewatchGuardian.ask({
//     type: 'init',
//     payload: ['test', 'src']
// }).do(output => console.log('watching files...'));
//
// const server = serverGuardian.ask({
//     type: 'init',
//     payload: {
//         port: 9000,
//         hostname: 'localhost'
//     }
// })
// .do(x => console.log('server address', x));
//
// Rx.Observable.concat(watcher, server)
//     .toArray()
//     .subscribe(x => {
//         console.log('All ready!')
//     }, e => {
//         console.log(e);
//     });
//
// setTimeout(() => {
//     Rx.Observable.merge(
//         system.gracefulStop(filewatchGuardian),
//         system.gracefulStop(serverGuardian),
//     ).subscribe(x => {
//         console.log('er');
//     })
// }, 2000);