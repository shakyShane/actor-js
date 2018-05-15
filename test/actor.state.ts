require('source-map-support').install();
const { assert } = require('chai');
const {concat, of} = require('rxjs');
const {last, switchMap} = require('rxjs/operators');
const { createSystem } = require('../');

describe('actor + state', function() {
    it('can update state ready for next message', function(done) {
        const calls = [];
        function count(stream) {
            return stream.pipe(
                switchMap(({payload, respond, state}) => {
                    calls.push(`nextState ${state}`);
                    const nextState = state + 1;
                    return of(respond(nextState, nextState));
                })
            );
        }
        const Ac = function() {
            return {
                initialState: 0,
                methods: {
                    'count': count
                }
            }
        }
        const {actorOf, ask} = createSystem();
        const a = actorOf(Ac);

        concat(
            ask(a, 'count', 'inc'),
            ask(a, 'count', 'inc')
        ).pipe(last())
            .subscribe((output) => {
                assert.equal(output, 2);
                assert.deepEqual(calls, [ 'nextState 0', 'nextState 1' ]);
                done();
            });
    });
});