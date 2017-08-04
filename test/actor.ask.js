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
    it('can handle a type without payload', function (done) {
        const system = createSystem();
        const actor = system.actorOf(function() {
            let lastSender;

            function send() {
                if (lastSender) {
                    lastSender.tell('pong!').subscribe();
                }
            }
            return {
                receive(name, payload, respond, sender) {
                    let count = 0;
                    lastSender = sender;
                    respond('running!');
                    send();
                }
            }
        }, 'first');

        const calls = [];
        const actor2 = system.actorOf(function(address, context) {
            return {
                receive(name, payload, respond, sender) {
                    if (name === 'start') {
                        const first = context.actorSelection('/system/first')[0];
                        first.ask('ping').subscribe();
                    } else {
                        try {
                            assert.equal(name, 'pong!');
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                }
            }
        });

        actor2.tell('start').subscribe();
    });
    it('challenge: Can model progress', function (done) {

        const system = createSystem();

        function downloadFile(payload, sender) {
            sender.tell('start', payload).subscribe();
            sender.tell('progress', '10').subscribe();
            sender.tell('progress', '10').subscribe();
            sender.tell('progress', '20').subscribe();
            sender.tell('progress', '30').subscribe();
            sender.tell('complete', '100kb').subscribe();
        }

        const downloader = function() {
            return {
                receive(name, payload, respond, sender) {
                    downloadFile(payload, sender);
                    respond('Sorted!');
                }
            }
        };

        const calls = [];
        system.actorOf(function(address, context) {
            return {
                postStart() {
                    const down = context.actorOf(downloader);
                    down.ask('download', '/shane.mp3').subscribe();
                },
                receive(name, payload) {
                    calls.push([name, payload]);
                    if (name === 'complete') {
                        try {
                            assert.deepEqual(calls, [
                                ['start', '/shane.mp3'],
                                ['progress', '10'],
                                ['progress', '10'],
                                ['progress', '20'],
                                ['progress', '30'],
                                ['complete', '100kb']
                            ]);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }
                }
            }
        });
    });
});