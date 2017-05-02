const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const chokidar  = require('chokidar');

module.exports.create = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
        this.watcher = null;
        this.parent = context.actorSelection('../')[0];
    }
    stop(sender) {
        return sender.reply('ACK');
    }
    receive(action, message, sender) {
        if (action === 'stop') {
            return this.stop(sender);
        }
        switch (action.type) {
            case 'init': {
                return this.init({
                    patterns: action.payload.patterns,
                    options: {}
                }, sender);
            }
        }
    }
    init(payload, sender) {
        const {patterns, options} = payload;
        const cOptions = Object.assign({}, options,
            {ignoreInitial: true}
        );
        this.watcher = chokidar.watch(patterns, cOptions)
            .on('all', (event, path) => {
                if (event === 'change') {
                    this.parent.tell({
                        type: 'event',
                        payload: {event, path}
                    }).take(1).subscribe();
                }
            });
        this.watcher.on('ready', () => {
            // console.log(`+ watcher ready for pattern \`${patterns}\``);
            setTimeout(function () {
                sender.reply('k');
            }, 500);
        });
    }
    postStop() {
        console.log('watcher -> postStop()');
        this.watcher.close();
    }
};