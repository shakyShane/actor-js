require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs/testing/TestScheduler');
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
                receive(name) {
                    if (name === 'first') {
                        context.self.tell('second').subscribe();
                    }
                    if (name === 'second') {
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