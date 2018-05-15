import {IActorContext, IActorRef} from "../src";

require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs/testing/TestScheduler');

describe('context.parent', function () {
    it('an actor can message its parent', function () {
        const scheduler = new TestScheduler();
        const {system, actorOf} = createSystem({
            messageScheduler: scheduler
        });
        const calls = [];
        const Parent = class {
            public address: string;
            public context: IActorContext;
            public children: IActorRef[];
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
        const Child = function(address, {parent, tell}) {
            return {
                postStart() {
                    calls.push('Child postStart()');
                    tell(parent, 'Child started!').subscribe();
                },
                receive() {
                    // console.log('msg');
                }
            }
        };
        const parentActor = actorOf(Parent, 'p');
        scheduler.flush();
        assert.deepEqual(calls, [
            'Parent postStart()',
            'Child postStart()',
            'Child started!'
        ]);
    });
});