require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs/testing/TestScheduler');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');

it('an actor can recover from a termination', function () {
    const scheduler = new TestScheduler();
    const {system, actorOf, tell} = createSystem({
        messageScheduler: scheduler
    });
    let calls = [];
    let instanceCount = 0;
    const Child = function (address, context) {
        instanceCount++;
        return {
            preRestart() {
                calls.push(['preRestart', instanceCount]);
            },
            postRestart() {
                calls.push(['postRestart', instanceCount]);
            },
            receive(name, payload, respond) {
                if (name === 'error1') {
                    throw new Error('Something went wrong');
                }
            }
        }
    };

    const Guardian = function (address, {actorOf, tell}) {
        let children = [];
        return {
            receive() {
                children.push(actorOf(Child, 'c'));
                tell(children[0], 'error1').subscribe();
            }
        }
    };

    const actorRef = actorOf(Guardian, 'guardian-01');
    tell(actorRef, 'msg').subscribe();
    scheduler.flush();
    assert.deepEqual([
        [ 'preRestart', 1 ],
        [ 'postRestart', 2 ]
    ], calls);
});