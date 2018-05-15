require('source-map-support').install();
const { assert } = require('chai');
const {concat} = require('rxjs');
const {toArray} = require('rxjs/operators');
const { createSystem } = require('../');

describe('actor.tell', function() {
    it('can fire and forget messages without waiting for a response', function (done) {
        const {tell, actorOf} = createSystem();
        const calls = [];
        const actor = actorOf(function(address, context) {
            return {
                receive(name, payload, respond) {
                    calls.push([name, payload]);
                }
            }
        });
        concat(
            tell(actor, '1', '1'),
            tell(actor, '2', '2'),
            tell(actor, '3', '3')
        ).pipe(toArray()).subscribe(wow => {
            assert.deepEqual(calls,
                [
                    [ '1', '1' ], [ '2', '2' ], [ '3', '3' ]
                ]
            );
            done();
        })
    });
});