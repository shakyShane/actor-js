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
});