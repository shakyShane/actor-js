require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');
const { patterns } = require('../dist');

describe('actor.ask', function() {
    it('can ask an actor for a response', function (done) {
        const system = createSystem();
        const actor = system.actorOf(function(address, context) {
            return {
                receive(name, payload, respond) {
                    if (name === 'init') {
                        if (Array.isArray(payload)) {
                            respond(payload.length);
                        }
                    }
                }
            }
        });
        actor.ask('init', ['src', 'fixtures']).subscribe(resp => {
            assert.equal(resp, 2, 'responds with array length');
            done();
        });
    });
    it('can handle a type without payload', function (done) {
        const system = createSystem();
        const actor = system.actorOf(function() {
            return {
                receive(name, payload, respond) {
                    if (name === 'init') {
                        respond(payload);
                    }
                }
            }
        });
        actor.ask('init').subscribe(resp => {
            assert.isUndefined(resp);
            done();
        });
    });
    it.only('can handle a type without payload', function (done) {
        const system = createSystem();
        const actor = system.actorOf(function() {
            return {
                receive(name, payload, respond, sender) {
                    respond('All good');
                    let count = 0;
                    const int = setInterval(() => {
                        count++;
                        if (count === payload) {
                            return clearInterval(int);
                        }
                        sender.tell('sup').subscribe();
                    }, 10);
                }
            }
        }, 'first');

        const actor2 = system.actorOf(function(address, context) {
            return {
                receive(name, payload, respond, sender) {
                    if (name === 'start') {
                        const first = context.actorSelection('/system/first')[0];
                        first.ask('Hi!', 2).subscribe();
                    } else {
                        console.log(name);
                    }
                }
            }
        });

        actor2.tell('start').subscribe();
    });
});