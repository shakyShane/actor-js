const connect = require('connect');
const http = require('http');

module.exports.create = function (input) {

    let server;

    return {
        name: 'Browsersync Server',
        effects: {
            init: function (payload) {
                console.log(payload);
                return Promise.resolve('as');
            },
            teardown: function () {

            }
        }
    }
};