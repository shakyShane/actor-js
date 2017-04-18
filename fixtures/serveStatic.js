const Rx = require('rxjs');
const { empty, of } = Rx.Observable;
const Immutable = require('immutable');
const {List, Map} = require('immutable');

const Option = Immutable.Record({
    dir: '',
    route: '',
    id: ''
});

function createOne(incoming) {
    if (typeof incoming === 'string') {
        return createFromString(incoming);
    }
}

function createFromString(input) {
    return new Option({dir: input});
}

module.exports.create = function (config) {

    const options = Immutable.List([]);

    return {
        name: 'ServeStatic',
        missing: function (payload, message) {
            console.log(message);
            // console.log('MISSING METHOD/EFFECT', payload);
            return Rx.Observable.throw(new Error('I cannot accept missing methods'));
        },
        effects: {
            init: function () {
                console.log('ere');
                return empty();
            }
        },
        methods: {
            transformOptions: function(payload) {
                return List([].concat(payload).filter(Boolean).map(createOne));
            }
        },
    }
};