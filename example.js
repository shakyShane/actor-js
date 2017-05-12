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

let calls = [];
let instanceCount = 0;
const Child = function (address, context) {
    instanceCount++;
    return {
        preRestart() {
            console.log('preRestart');
            calls.push(['preRestart', instanceCount]);
        },
        postRestart() {
            console.log('postRestart');
            calls.push(['postRestart', instanceCount]);
        },
        receive(payload) {
            if (payload === 'error1') {
                throw new Error('Something went wrong');
            }
            if (payload === 'error2') {
                throw new Error('Something went wrong');
            }
            if (payload === 'other') {
                console.log('ryu');
            }
        }
    }
};

const Guardian = function (address, context) {
    let children = [];
    return {
        postStart() {
            children.push(context.actorOf(Child, 'c'));
        },
        receive(payload, message, sender) {
            children[0]
                .ask('error1')
                .subscribe(x => console.log('do I ever get here'))

            setTimeout(() => {
                children[0]
                    .ask('error2')
                    .subscribe(x => console.log('do I ever get here'))
            }, 1000);

            //     .subscribe(() => {
            //         setTimeout(() => {
            //             context.actorSelection('**')[0]
            //                 .ask('error2')
            //                 .subscribe(x => sender.reply('ACK'));
            //         }, 1000);
            //     });
        }
    }
};

const actorRef = system.actorOf(Guardian, 'guardian-01');
actorRef.ask('go').subscribe(x => {
    console.log('calls');
});