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
        postStart(){
            console.log('post start watcher')
        },
        postStop(){
            console.log('post stop watcher')
        },
        methods: {
            'init': function(stream) {
                return stream.switchMap(({action, respond}) => {
                    watchOne(action.payload);
                    return Observable.of(respond('Ready'));
                });
            },
            'stop': function (stream) {
                return stream.switchMap(({action, respond}) => {
                    if (watcher) watcher.close();
                    return Observable.of(respond('done!'));
                });
            }
        },
        patterns: ['reduxObservable'],
    }
};