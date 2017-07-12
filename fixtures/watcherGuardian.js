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

    function stopWatchers() {
        const selected = context.actorSelection('**');
        if (selected.length) {
            return context.gracefulStop(selected).toArray();
        }
        return of(true);
    }

    function initWatchers(patterns) {
        return stopWatchers()
            .flatMap(() => {
                return from(patterns)
                    .concatMap(pattern => {
                        return context.actorOf(watcher).ask({type: 'init', payload: pattern});
                    })
            })
            .toArray();
    }

    return {
        methods: {
            'init': function(stream) {
                return stream
                    .switchMap(({action, respond}) => {
                        return initWatchers(action.payload)
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