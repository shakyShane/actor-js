const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const {create: FileWatcher} = require('./watcher');

const Option = Immutable.Record({
    dir: '',
});

function createFromString(input) {
    return new Option({dir: input});
}

module.exports.create = function (config, context) {
    let children = [];
    return {
        receive: function(action, message, sender) {
            console.log('guardian-->', action);
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
                    return Rx.Observable
                        .concat(...actors.map(a => a.ref.ask({type: 'init', payload: a.dir})))
                        .toArray()
                        .subscribe(x => {
                            sender.reply('ACK');
                        });
                }
            }
        },
        postStop() {
            console.log('guardian: postStop()');
        }
    }
};