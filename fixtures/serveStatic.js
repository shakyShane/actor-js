const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const {List, Map} = require('immutable');

function serveStaticItem() {
    return {
        receive(payload, _, sender) {
            if (typeof payload === 'string') {
                return sender.reply({
                    dir: payload,
                    route: '',
                    handle: require('serve-static')(payload)
                });
            }
            return sender.reply({
                dir: payload.dir,
                route: payload.route,
                handle: require('serve-static')(payload.dir)
            });
        }
    }
}

module.exports = function (address, context) {

    return {
        receive(action, message, sender) {
            Rx.Observable.from(action.payload)
                .concatMap(dir => context.actorOf(serveStaticItem).ask(dir))
                .toArray()
                .subscribe(x => {
                    sender.reply({middleware: x});
                }, err => {
                    console.error(err);
                });
        }
    }
};