const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const chokidar  = require('chokidar');

module.exports = function watcher(address, context) {

    const chokidar = require('chokidar');
    let watcher;

    function watchOne(pattern) {
        if (watcher) {
            watcher.close();
        }
        watcher = chokidar.watch(pattern);
        watcher.on('change', function(path) {
            console.log('change', path);
        });
    }

    return {
        postStart() {
            console.log('Watcher started')
        },
        postStop() {
            console.log('post stop watcher')
        },
        methods: {
            'init': function(stream) {
                return stream.flatMap(({action, respond}) => {
                    watchOne(action.payload);
                    return of(respond('Ready'));
                });
            },
            'stop': function (stream) {
                return stream.flatMap(({action, respond}) => {
                    if (watcher) watcher.close();
                    return of(respond('done!'));
                });
            }
        },
        patterns: ['reduxObservable'],
    }
};