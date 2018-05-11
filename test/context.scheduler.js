require('source-map-support').install();
const { assert } = require('chai');
const {delay, map, tap} = require('rxjs/operators');
const { createSystem } = require('../');
const { TestScheduler } = require('@kwonoj/rxjs-testscheduler-compat');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');
const { patterns } = require('../');

describe('context.scheduler', function () {
    it('gives actors access to the message scheduler via context', function () {
        const scheduler = new TestScheduler();
        const system = createSystem({
            messageScheduler: scheduler
        });
        const calls = [];
        const Child = function(address, context) {
            return {
                setupReceive(stream) {
                    return stream.pipe(
                        delay(2000, context.scheduler)
                        , map(original => patterns.createResponse(original, 'shane'))
                        , tap(x => calls.push(x.resp))
                    );
                }
            }
        };
        const actorRef = system.actorOf(Child, 'p');
        actorRef.tell('shane').subscribe();
        scheduler.advanceTo(2001);
        assert.deepEqual(calls, ['shane']);
    });
});