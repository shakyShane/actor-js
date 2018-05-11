require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs/testing/TestScheduler');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');

describe('context.parent', function () {
    it('an actor can message its parent', function () {
        const scheduler = new TestScheduler();
        const system = createSystem({
            messageScheduler: scheduler
        });
        const calls = [];
        const Parent = class {
            constructor(address, context) {
                this.address = address;
                this.context = context;
                this.children = [];
            }
            postStart() {
                calls.push('Parent postStart()');
                const child = this.context.actorOf(Child);
                this.children.push(child);
            }
            receive(payload) {
                calls.push(payload);
            }
        };
        const Child = function(address, context) {
            return {
                postStart() {
                    calls.push('Child postStart()');
                    context.parent.tell('Child started!').subscribe();
                },
                receive() {
                    // console.log('msg');
                }
            }
        };
        const parentActor = system.actorOf(Parent, 'p');
        scheduler.flush();
        assert.deepEqual(calls, [
            'Parent postStart()',
            'Child postStart()',
            'Child started!'
        ]);
    });
});