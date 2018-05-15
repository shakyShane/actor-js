require('source-map-support').install();
import { assert } from 'chai';
import { createSystem } from '../';

describe('actor.ask', function() {
    it('can ask an actor for a response', function (done) {
        const {actorOf, ask} = createSystem();
        const actor = actorOf(function() {
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
        ask(actor, 'init', ['src', 'fixtures']).subscribe(resp => {
            assert.equal(resp, 2, 'responds with array length');
            done();
        });
    });
    it('can handle a type without payload', function (done) {
        const {actorOf, ask} = createSystem();
        const actor = actorOf(function() {
            return {
                receive(name, payload, respond) {
                    if (name === 'init') {
                        respond(payload);
                    }
                }
            }
        });
        ask(actor, 'init').subscribe(resp => {
            assert.isUndefined(resp);
            done();
        });
    });
    it('can handle a type without payload (2)', function (done) {
        const {actorOf, tell} = createSystem();
        const actor = actorOf(function(address, {tell}) {
            let lastSender;

            function send() {
                if (lastSender) {
                    tell(lastSender, 'pong!').subscribe();
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
        const actor2 = actorOf(function(address, {ask, actorSelection}) {
            return {
                receive(name, payload, respond, sender) {
                    if (name === 'start') {
                        const first = actorSelection('/system/first')[0];
                        ask(first, 'ping').subscribe();
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

        tell(actor2, 'start').subscribe();
    });
    it('challenge: Can model progress', function (done) {

        const system = createSystem();

        function downloadFile(payload, tell, sender) {
            tell(sender, 'start', payload).subscribe();
            tell(sender, 'progress', '10').subscribe();
            tell(sender, 'progress', '10').subscribe();
            tell(sender, 'progress', '20').subscribe();
            tell(sender, 'progress', '30').subscribe();
            tell(sender, 'complete', '100kb').subscribe();
        }

        const downloader = function(address, {tell}) {
            return {
                receive(name, payload, respond, sender) {
                    downloadFile(payload, tell, sender);
                    respond('Sorted!');
                }
            }
        };

        const calls = [];
        system.actorOf(function(address, {ask, actorOf}) {
            return {
                postStart() {
                    const down = actorOf(downloader);
                    ask(down, 'download', '/shane.mp3').subscribe();
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