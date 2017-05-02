const Rx = require('rxjs');
const { fromPromise } = Rx.Observable;

module.exports = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
    }

    init() {

    }

    stop() {
        return fromPromise(this.launcher.kill());
    }

    receive(action, msg, sender) {
        // if (action === 'stop') {
        //     this.stop().subscribe(() => sender.reply('ack'))
        // }

        if (action === 'manifest') {
            return this.init().subscribe(x => sender.reply('ack'));
        }
    }
}