require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');

it('can stop actors from system level', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
        messageScheduler: scheduler
    });
    let calls = 0;
    const Guardian = function (address, context) {
        return {
            receive(payload) {
                calls++;
                assert.equal(payload, 'stop');
            },
            postStop() {
                calls++;
            }
        }
    };

    const actorRef = system.actorOf(Guardian, 'guardian-01');
    system.stop(actorRef);
    scheduler.flush();
    assert.equal(calls, 2);
});

it('can stop actors from actor level', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
        messageScheduler: scheduler
    });
    let calls = [];
    const Child = function () {
        return {
            receive(payload) {
                calls.push(`child receive ${payload}`);
            },
            postStop() {
                calls.push('child postStop');
            }
        }
    };
    const Guardian = function (address, context) {
        const actorRefs = [];
        return {
            postStart() {
                calls.push('Guardian postStart');
                actorRefs.push(context.actorOf(Child))
            },
            receive(payload) {
                switch(payload) {
                    case 'interrupt-child':
                        actorRefs.forEach((actor) => {
                            context.stop(actor);
                        });
                }
            }
        }
    };

    const guardianRef = system.actorOf(Guardian, 'guardian-01');
    guardianRef.tell('interrupt-child').subscribe();
    scheduler.flush();
    assert.deepEqual(calls, [
        'Guardian postStart',
        'child receive stop',
        'child postStop',
    ]);
});