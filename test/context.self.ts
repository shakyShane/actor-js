require('source-map-support').install();
const { assert } = require('chai');
const { TestScheduler } = require('rxjs/testing/TestScheduler');
import {createSystem} from "../";

describe('context.self', function () {
    it('an actor can message it self', function () {
        const scheduler = new TestScheduler();
        const system = createSystem({
            messageScheduler: scheduler
        });
        const calls = [];
        const Child = function(address, {tell, self}) {
            return {
                receive(name) {
                    if (name === 'first') {
                        tell(self, 'second').subscribe();
                    }
                    if (name === 'second') {
                        calls.push('second');
                    }
                }
            }
        };
        const actor = system.actorOf(Child, 'p');
        system.tell(actor, 'first').subscribe();
        scheduler.flush();
        assert.deepEqual(calls, ['second']);
    });
});