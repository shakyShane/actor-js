require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');

it('can select actors using actorSelection as system level', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
        messageScheduler: scheduler
    });
    const Guardian = class {
        constructor(address) {
            this.type = 'Guardian';
            this.mailboxType = 'default';
            this.address = address;
        }
        receive(payload) {
            assert.equal(payload, 'ping');
        }
    };
    const actor = system.actorOf(Guardian, 'guardian-actor-01');
    const selected = system.actorSelection('/system/guardian-actor-01');
    selected[0].tell('ping').subscribe();
    scheduler.flush();
});