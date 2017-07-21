require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');

describe('actor + state', function() {
    it('can mutate state ready for next message', function(done) {
        const calls = [];
        function count(stream) {
            return stream.switchMap(({payload, respond, state}) => {
                calls.push(`nextState ${state}`);
                const nextState = state + 1;
                return Rx.Observable.of(respond(nextState, nextState));
            });
        }
        const Ac = function() {
            return {
                initialState: 0,
                methods: {
                    'count': count
                }
            }
        }
        const system = createSystem();
        const a = system.actorOf(Ac);

        Rx.Observable.concat(
            a.ask('count', 'inc'),
            a.ask('count', 'inc')
        )
            .last()
            .subscribe((output) => {
                assert.equal(output, 2);
                assert.deepEqual(calls, [ 'nextState 0', 'nextState 1' ]);
                done();
            });
    });
});