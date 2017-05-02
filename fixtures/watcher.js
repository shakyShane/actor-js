const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const chokidar  = require('chokidar');

module.exports.create = function (config, context) {
    let watcher;
    let parent = context.actorSelection('../')[0];
    return {
        receive: function(action, message, sender) {
            if (action === 'stop') {
                if (watcher) {
                    watcher.close();
                }
                return sender.reply('ACK');
            }
            switch (action.type) {
                case 'init': {
                    const patterns = action.payload;
                    watcher = chokidar.watch(patterns, {atomic: true})
                        .on('all', function (event, path) {
                            if (event === 'addDir') {
                                parent.tell({type: 'event', payload: {event, path}}).subscribe();
                            }
                        });
                    watcher.on('ready', function () {
                        console.log(`+ watcher ready for pattern \`${patterns}\``);
                        sender.reply('k');
                    });
                    break;
                }
            }
        },
        postStop() {
        }
    }
};