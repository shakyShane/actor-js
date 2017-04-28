require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');

it.only('an actor can retrieve its own address', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
        messageScheduler: scheduler
    });
    let calls = [];
    const Guardian = function (address, context) {
        return {
            postStart() {
                calls.push('Guardian postStart');
                console.log('Asking for identity');
                context.ask('identity').subscribe(x => {
                    console.log(x);
                })
            },
            receive(payload) {

            },
            postStop() {
                calls++;
            }
        }
    };

    const actorRef = system.actorOf(Guardian, 'guardian-01');
    scheduler.flush();

});