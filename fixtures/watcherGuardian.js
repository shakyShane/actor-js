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

module.exports.create = function (config, context) {
    let children       = [];
    let clients        = context.actorSelection('/system/clients');
    let subject;
    let subscription;

    return {
        receive: function(action, message, sender) {
            // console.log('guardian-->', action);
            if (action === 'stop') {
                return context.gracefulStop(children)
                    .subscribe(resp => {
                        console.log('~x~ Gracefully stopped children');
                        sender.reply('Sup!');
                    });
            }
            switch (action.type) {
                case 'init': {
                    const options = action.payload.map(createFromString);
                    const actors = options.map(opt => ({ref: context.actorOf(FileWatcher), dir: opt.get('dir')}));
                    children.push.apply(children, actors.map(x => x.ref));
                    subject      = new Rx.Subject();
                    subscription = subject
                        .subscribe(x => {

                        });
                    return Rx.Observable
                        .concat(...actors.map(a => a.ref.ask({type: 'init', payload: a.dir})))
                        .toArray()
                        .subscribe(x => {
                            sender.reply('ACK');
                        });
                }
                case 'event': {
                    subject.next(action.payload);
                }
            }
        },
        postStop() {
            subscription.dispose();
            console.log('guardian: postStop()');
        }
    }
};