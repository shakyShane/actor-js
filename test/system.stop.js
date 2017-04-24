require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');

it.only('can stop actors with an actorRef', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
        messageScheduler: scheduler
    });
    const child = function (address, context) {
        return {
            receive(payload) {
                console.log('payload', payload);
            }
        }
    };
    const Guardian = function (address, context) {
        const actors = [];
        return {
            postStart() {
                actors.push(context.actorOf(child, 'TTT'));
                context.stop(actors[0]);
            },
            receive() {

            }
        }
    };

    system.actorOf(Guardian, 'guardian-01');
    scheduler.flush();
});