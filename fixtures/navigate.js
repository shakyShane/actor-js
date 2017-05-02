const Rx = require('rxjs');
const {fromPromise} = Rx.Observable;
const EventEmitter = require('events');
const Chrome = require('chrome-remote-interface/lib/chrome');

module.exports = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
    }

    init(url) {
        return Rx.Observable.create((observer) => {

            const notifier = new EventEmitter();
            const instance = new Chrome(undefined, notifier);

            notifier.on('connect', function (protocol) {
                const {Page} = protocol;

                // First, enable the Page domain we're going to use.
                Page.enable().then(() => {
                    Page.navigate({url});

                    // Wait for window.onload before doing stuff.
                    Page.loadEventFired(() => {
                        observer.complete();
                    });
                });

            });

            return () => {
                // console.log()
                // instance.protocol.close();
            }
        });
    }

    stop() {

    }

    receive(action, msg, sender) {
        // if (action === 'stop') {
        //     this.stop().subscribe(() => sender.reply('ack'))
        // }
        //
        // if (action === 'init') {
        return this.init(action).subscribe(x => sender.reply('ack'));
        // }
    }
}