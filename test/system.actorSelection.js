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
it('can select mulitple actors at system level using glob', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
        messageScheduler: scheduler
    });
    const Guardian = class {
        constructor(address) {
            this.type = 'Guardian';
            this.mailboxType = 'default';
        }
        receive(payload) {
            assert.equal(payload, 'ping');
        }
    };
    const Guardian2 = class {
        constructor(address) {
            this.type = 'Guardian2';
            this.mailboxType = 'default';
        }
        receive(payload) {
            assert.equal(payload, 'ping ping');
        }
    };
    const actor = system.actorOf(Guardian, 'guardian-actor-01');
    const selected = system.actorSelection('/system/guardian-actor-01');
    selected[0].tell('ping').subscribe();
    selected[1].tell('ping ping').subscribe();
    scheduler.flush();
});