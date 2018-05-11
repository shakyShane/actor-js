require('source-map-support').install();
const { assert } = require('chai');
const {of} = require('rxjs');
const {delay, switchMap} = require('rxjs/operators');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs/testing/TestScheduler');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');
const { patterns } = require('../dist');

describe('mailboxes', function() {

    it('does not affect basic actor .receive', function(done) {
        const system = createSystem();
        const Child = function (address, context) {
            return {
                receive(payload, incomingMessage, reply) {
                    reply('Hey!');
                }
            }
        };
        const actor = system.actorOf(Child);
        const calls = [];
        actor.ask('anything')
            .subscribe(
                () => calls.push('next'),
                () => calls.push('error'),
                () => {
                    calls.push('complete');
                    assert.deepEqual(calls, ['next', 'complete']);
                    done();
                }
            );
    });

    it('works with simple events', function(done) {
        const system = createSystem();

        const Child = function (address, context) {
            return {
                methods: {
                    'shane': function(stream) {
                        return stream.pipe(
                            switchMap(({payload, respond}) => {
                                return of(respond(payload)).pipe(delay(1));
                            })
                        )
                    }
                }
            }
        };

        const actor = system.actorOf(Child);
        const calls = [];
        actor.ask('shane', '1')
            .subscribe(
                x => console.log('1 next', x),
                x => console.log('1 error', x),
                x => calls.push('1 complete')
            );
        actor.ask('shane', '2')
            .subscribe(
                x => calls.push('2 next'),
                x => console.log('2 error', x),
                x => {
                    calls.push('2 complete');
                    assert.deepEqual(calls, [
                        '1 complete',
                        '2 next',
                        '2 complete'
                    ]);
                    done();
                }
            );
    });
});
