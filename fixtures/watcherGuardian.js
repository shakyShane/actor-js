const Rx = require('rxjs');
const { empty, of, from } = Rx.Observable;
const Immutable = require('immutable');
const {create: Clients} = require('./clients');
const watcher = require('./watcher');

const Option = Immutable.Record({
    dir: '',
});

function createFromString(input) {
    return new Option({dir: input});
}

module.exports = function watcherGuardian(address, context) {

    function initWatchers(patterns) {
        const selected = context.actorSelection('**');
        if (selected.length) {
            console.log('prev');
        }
        return from(patterns)
                .concatMap(pattern => {
                    return context.actorOf(Watcher).ask({type: 'init', payload: pattern});
                });
    }

    return {
        methods: {
            'init': function(stream) {
                return stream
                        .switchMap(({action, respond}) => {
                            return initWatchers(action.payload)
                                    .toArray()
                                    .mapTo(respond('All done'));
                        });
            },
            'stop': function(stream) {
                return stream
                        .switchMap(({action, respond}) => {
                            return from(context.actorSelection('**'))
                                    .flatMap(actorRef => context.gracefulStop(actorRef))
                                    .toArray()
                                    .mapTo(respond('ready'))
                        });
            }
        },
        patterns: ['reduxObservable']
    }
};