require('source-map-support').install();
const {assert} = require('chai');
const {createSystem} = require('../');
const {TestScheduler} = require('rxjs/testing/TestScheduler');
const {SystemActor} = require('../dist/SystemActor');

describe('system.actorSelection', function () {
    it('can select actors using actorSelection as system level', function () {
        const scheduler = new TestScheduler();
        const system = createSystem({
            messageScheduler: scheduler
        });
        const Guardian = class {
            public type: string;
            public address: string;
            constructor(address) {
                this.type = 'Guardian';
                this.address = address;
            }

            receive(payload) {
                assert.equal(payload, 'ping');
            }
        };
        const actor = system.actorOf(Guardian, 'guardian-actor-01');
        const selected = system.actorSelection('/system/guardian-actor-01');
        system.tell(selected[0], 'ping').subscribe();
        scheduler.flush();
    });
    it('can select multiple actors at system level using glob', function () {
        const scheduler = new TestScheduler();
        const system = createSystem({
            messageScheduler: scheduler
        });
        const Guardian = class {
            public type: string;
            public address: string;
            constructor(address) {
                this.type = 'Guardian';
                this.address = address;
            }

            receive(name) {
                assert.equal(name, 'ping');
            }
        };
        const Guardian2 = class {
            public type: string;
            public address: string;
            constructor(address) {
                this.type = 'Guardian2';
                this.address = address;
            }

            receive(name) {
                assert.equal(name, 'ping ping');
            }
        };
        const actor = system.actorOf(Guardian, 'guardian-actor-01');
        const actor2 = system.actorOf(Guardian2, 'guardian-actor-02');
        const selected = system.actorSelection('**');
        system.tell(selected[0], 'ping').subscribe();
        system.tell(selected[1], 'ping ping').subscribe();
        scheduler.flush();
    });

    it('can select system at the actor level', function () {
        const scheduler = new TestScheduler();
        const replacedSystem = class {
            receive(msg) {
                assert.equal(msg, 'ping')
            }
        };
        const system = createSystem({
            messageScheduler: scheduler,
            factory: replacedSystem
        });

        const Guardian = function (address, context) {
            const systemActor = context.actorSelection('/system');
            // send a message to the system actor
            context.tell(systemActor[0], 'ping').subscribe();
            return {
                receive() {

                }
            }
        };

        const actor = system.actorOf(Guardian, 'guardian-actor-01');
        scheduler.flush();
    });

    it('select multiple grandchildren with a glob', function () {
        const scheduler = new TestScheduler();
        const system = createSystem({
            messageScheduler: scheduler
        });
        let messages = [];
        const child = function (address, context) {
            return {
                receive(payload) {
                    messages.push(payload);
                }
            };
        };
        const Parent = function (address, context) {
            let actors = [];
            return {
                postStart() {
                    [0, 1].forEach(x => {
                        actors.push(context.actorOf(child, `child-${x}`));
                    });
                },
                receive() {
                    // console.log(actors.length);
                }
            }
        };
        const Guardian = function (address, context) {
            return {
                postStart() {
                    // create a child
                    context.actorOf(Parent, 'parent');
                    // access it's grandchildren
                    const children = context.actorSelection('parent/**');
                    children.forEach(child => context.tell(child, `ping! ${child.address}`).subscribe())
                },
                receive() {

                }
            }
        };

        system.actorOf(Guardian, 'guardian-01');
        scheduler.flush();
        assert.equal(messages[0], 'ping! /system/guardian-01/parent/child-0');
        assert.equal(messages[1], 'ping! /system/guardian-01/parent/child-1');
    });
});
