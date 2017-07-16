require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');
const { patterns } = require('../dist');

describe('actor.tell', function() {
    it('can fire and forget messages without waiting for a response', function (done) {
        const system = createSystem();
        const calls = [];
        const actor = system.actorOf(function(address, context) {
            return {
                receive(name, payload, respond) {
                    calls.push([name, payload]);
                }
            }
        });
        Rx.Observable.concat(
            actor.tell('1', '1'),
            actor.tell('2', '2'),
            actor.tell('3', '3')
        ).toArray().subscribe(wow => {
            assert.deepEqual(calls,
                [
                    [ '1', '1' ], [ '2', '2' ], [ '3', '3' ]
                ]
            );
            done();
        })
    });
});