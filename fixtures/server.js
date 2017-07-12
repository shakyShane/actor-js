const {Observable} = require('rxjs');
const connect = require('connect');
const http = require('http');

module.exports = function server(address, context) {
    let server;

    function createServer(options) {
        const app = connect();

        options.middleware.forEach(function(mw) {
            app.use(mw.route, mw.handle);
        });

        server = http.createServer(app);
        server.listen(options.port);

        return server;
    }

    function close(server) {
        server.close();
    }

    return {
        methods: {
            'init': function(stream) {
                return stream.switchMap(({action, respond}) => {
                    if (server && server.listening) {
                        close(server);
                    }
                    server = createServer(action.payload);
                    const response = server.address();
                    return Observable.of(respond(response));
                });
            },
            'stop': function(stream) {
                return stream.switchMap(({action, respond}) => {
                    close(server);
                    return Observable.of(respond('stopped'));
                });
            }
        },
        patterns: ['reduxObservable'],
    }
};