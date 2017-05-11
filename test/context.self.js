require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');

describe('context.self', function () {
    it('an actor can message it self', function () {
        const scheduler = new TestScheduler();
        const system = createSystem({
            messageScheduler: scheduler
        });
        const calls = [];
        const Child = function(address, context) {
            return {
                receive(message) {
                    if (message === 'first') {
                        context.self.tell('second').subscribe();
                    }
                    if (message === 'second') {
                        calls.push('second');
                    }
                }
            }
        };
        const actor = system.actorOf(Child, 'p');
        actor.tell('first').subscribe();
        scheduler.flush();
        assert.deepEqual(calls, ['second']);
    });
});