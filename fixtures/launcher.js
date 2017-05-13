const Rx = require('rxjs');
const { fromPromise } = Rx.Observable;
const {ChromeLauncher} = require('lighthouse/lighthouse-cli/chrome-launcher');

module.exports = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
        this.launcher = null;
    }

    init() {

        this.launcher = new ChromeLauncher({
            port: 9222,
            autoSelectChrome: true, // False to manually select which Chrome install.
            additionalFlags: ['--headless']
        });

        return fromPromise(this.launcher.run())
            .catch(err => {
                // console.log(err);
                return this.stop();
            });
    }

    stop() {
        return fromPromise(this.launcher.kill());
    }

    receive(action, msg, sender) {
        if (action === 'stop') {
            this.stop().subscribe(() => sender.reply('ack'))
        }

        if (action === 'init') {
            return this.init().subscribe(x => sender.reply('ack'));
        }
    }
}