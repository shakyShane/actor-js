const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const chokidar  = require('chokidar');

module.exports.create = function (config, context) {
    let watcher;
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
                            console.log('CHOK^^ event', event, path);
                        });
                    watcher.on('ready', function () {
                        console.log(`+ watcher ready for ${patterns}`);
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