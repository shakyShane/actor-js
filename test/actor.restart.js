require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');

it.only('an actor can recover from a termination', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
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
            receive(payload) {
                if (payload === 'error1') {
                    throw new Error('Something went wrong');
                }
                if (payload === 'error2') {
                    throw new Error('Something went wrong');
                }
            }
        }
    };

    const Guardian = function (address, context) {
        let children = [];
        return {
            postStart() {
                children.push(context.actorOf(Child, 'c'));
                Rx.Observable.concat(
                    children[0].tell('error1')
                ).subscribe();
            },
            receive(payload) {

            }
        }
    };

    const actorRef = system.actorOf(Guardian, 'guardian-01');
    scheduler.flush();
    console.log(calls);
});