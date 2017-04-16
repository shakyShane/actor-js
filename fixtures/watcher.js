const Rx = require('rx');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');

const Option = Immutable.Record({
    dir: '',
});

function createFromString(input) {
    return new Option({dir: input});
}

module.exports.create = function (config, context) {
    let count = 0;

    const system = context.actorRefs['System']
    const clientActions = context.actorRefs['ClientActions']
    const clientActions = context.actorSelection('/ClientActions');
    return {
        name: 'FileWatcher',
        receive: function(payload, message, sender) {
            switch (payload) {
                case 'ping':
                    sender.reply(`pong ${count += 1}`);
                    break;
                case 'kill':
                    context.shutdown();
            }
            // sender.reply('pong');
        }
    }
};