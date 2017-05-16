const {Observable} = require('rxjs');
const connect = require('connect');
const http = require('http');

module.exports.create = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
        this.server = null;
    }

    init(payload) {
        const app = connect();
        app.use('/shane', function (req, res, next) {
            res.end('sup');
        });
        this.server = http.createServer(app);
        return Observable.create(obs => {
            const s = this.server.listen(payload.port);
            const a = s.address();
            obs.next(a);
        }).take(1);
    }

    stop() {
        return Observable.create((obs) => {
            console.log('stopping!');
            this.server.close(() => obs.complete());
        });
    }

    receive(action, message, sender) {
        if (action.type === 'init') {
            if (this.server && this.server.listening) {
                Observable.concat(
                    this.stop(),
                    this.init(action.payload)
                ).subscribe(x => sender.reply(x));
            } else {
                this.init(action.payload)
                    .subscribe(x => sender.reply(x));
            }
        }
    }
};