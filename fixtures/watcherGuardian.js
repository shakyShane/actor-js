const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const {create: FileWatcher} = require('./watcher');
const {create: Clients} = require('./clients');

const Option = Immutable.Record({
    dir: '',
});

function createFromString(input) {
    return new Option({dir: input});
}

module.exports.create = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
        this.subject = new Rx.Subject();
        this.children = [];
        this.clients = [];
        this.payload = {};
        this.subscription = this.subject.subscribe(x => {
            // console.log('--->', x);
        });
    }
    init(payload, sender) {

        const options = payload.map(createFromString);

        const childActors = options.map(opt => ({
            ref: this.context.actorOf(FileWatcher),
            dir: opt.get('dir')
        }));

        this.children = childActors.map(x => x.ref);
        this.payload = payload;

        return Rx.Observable
            .concat(...childActors
                .map(actor =>
                    actor.ref.tell({type: 'init', payload: {patterns: actor.dir}})
                )
            )
            .toArray();
    }
    stop() {
        return this.context.gracefulStop(this.children)
    }
    clearChildren() {
        return this.context
            .gracefulStop(this.children);
    }
    postStart() {
        this.clients = this.context.actorSelection('../clients');
    }
    receive(action, message, sender) {

        if (action === 'stop') {
            return this.stop().subscribe(() => sender.reply('ACK!'));
        }

        switch (action.type) {
            case 'init': {
                // if 'init' happens but we already have children
                // kill them and restart everything
                if (this.children.length) {
                    return Rx.Observable.concat(
                        this.clearChildren(),
                        this.init(action.payload)
                    ).subscribe(x => sender.reply('ACK'));
                }

                return this.init(action.payload, sender)
                    .subscribe(x => sender.reply('Initial init'));
            }

            case 'event': {
                this.handleEvent(action.payload);
                break;
            }
        }
    }
    handleEvent(e) {
        this.clients[0].tell({type: 'file-eevent', payload: e}).subscribe();
    }
    postStop() {
        this.subscription.unsubscribe();
        // console.log(this.children);
        // console.log('guardian: postStop()');
    }
};