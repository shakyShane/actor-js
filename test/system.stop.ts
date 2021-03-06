import {tap} from "rxjs/internal/operators";

require('source-map-support').install();
import { assert } from 'chai';
import { TestScheduler } from 'rxjs/testing/TestScheduler';
import {createSystem} from "../src";

const noop = () => {};

describe('system.stop', function() {
    it('can stop actors from system level', function (done) {
        const system = createSystem();
        let calls = 0;
        const Guardian = function (address, context) {
            return {
                receive(payload) {
                    calls++;
                    assert.equal(payload, 'stop');
                },
                postStop() {
                    calls++;
                }
            }
        };

        const actorRef = system.actorOf(Guardian, 'guardian-01');
        system.stop(actorRef);
        setTimeout(() => {
            assert.equal(calls, 2);
            done();
        }, 0);
    });

    it('can stop actors from actor level', function (done) {
        const system = createSystem();
        let calls = [];
        const Child = function () {
            return {
                receive(payload) {
                    calls.push(`child receive ${payload}`);
                },
                postStop() {
                    calls.push('child postStop');
                }
            }
        };
        const Guardian = function (address, context) {
            const actorRefs = [];
            return {
                postStart() {
                    calls.push('Guardian postStart');
                    actorRefs.push(context.actorOf(Child))
                },
                receive(payload) {
                    switch(payload) {
                        case 'interrupt-child':
                            actorRefs.forEach((actor) => {
                                context.stop(actor);
                            });
                    }
                }
            }
        };

        const guardianRef = system.actorOf(Guardian, 'guardian-01');
        system.tell(guardianRef, 'interrupt-child').subscribe();
        setTimeout(() => {
            assert.deepEqual(calls, [
                'Guardian postStart',
                'child receive stop',
                'child postStop',
            ]);
            done();
        }, 5);
    });

    it('can stop a system level actor + its children', function (done) {
        const system = createSystem();
        let calls = [];
        const Child = function () {
            return {
                receive(payload, message, sender) {
                    calls.push(`child receive ${payload}`);
                    sender.reply('All done!');
                },
                postStop() {
                    calls.push('child postStop');
                }
            }
        };
        const Guardian = function (address, context) {
            const actorRefs = [];
            return {
                postStart() {
                    calls.push('Guardian postStart');
                    actorRefs.push(context.actorOf(Child))
                },
                receive(payload, message, sender) {
                    calls.push(`Guardian receive ${payload}`);
                    switch(payload) {
                        case 'stop':
                            // System.gracefulStop(actorRefs, context)
                            actorRefs.forEach(function (actorRef) {
                                context.stop(actorRef);
                            });
                    }
                },
                postStop() {
                    calls.push('Guardian poststop');
                }
            }
        };

        const guardianRef = system.actorOf(Guardian, 'guardian-01');
        system.stop(guardianRef);
        setTimeout(() => {
            [
                'Guardian postStart',
                'Guardian receive stop',
                'child receive stop',
                'Guardian poststop',
                'child postStop'
            ].forEach(function (call) {
                assert.include(calls, call, 'assert messages were received, order is not guaranteed');
            });
            done();
        }, 5);
    });

    it('can stop actors gracefully', function (done) {
        const system = createSystem();
        let calls = [];
        const Child = function () {
            return {
                receive(name, payload, respond) {
                    calls.push(`child receive ${name}`);
                    respond('All done here!');
                },
                postStop() {
                    calls.push('child postStop');
                }
            }
        };
        const Guardian = function (address, context) {
            const actorRefs = [];
            return {
                postStart() {
                    calls.push('Guardian postStart');
                    actorRefs.push(context.actorOf(Child))
                },
                receive(name, payload, respond) {
                    calls.push(`Guardian receive ${name}`);
                    switch(name) {
                        case 'stop':
                            context.gracefulStop(actorRefs)
                                .subscribe(() => respond('Im done!'));
                    }
                },
                postStop() {
                    calls.push('Guardian poststop');
                }
            }
        };

        const guardianRef = system.actorOf(Guardian, 'guardian-01');

        system.gracefulStop(guardianRef)
            .subscribe(() => {
                setTimeout(() => {
                    assert.deepEqual(calls, [
                        'Guardian postStart',
                        'Guardian receive stop',
                        'child receive stop',
                        'child postStop',
                        'Guardian poststop'
                    ]);
                    done();
                }, 0);
            });
    });

    it('removes a stopped actor from the register', function (done) {
        const system = createSystem();
        let calls = [];
        const Guardian = function (address, context) {
            return {
                receive(name, payload, respond) {
                    calls.push(`Guardian receive ${name}`);
                },
                postStop() {
                    calls.push('Guardian poststop');
                }
            }
        };

        const guardianRef = system.actorOf(Guardian, 'guardian-01');

        system.stop(guardianRef);

        setTimeout(() => {
            assert.deepEqual(calls, [ 'Guardian receive stop', 'Guardian poststop' ]);
            assert.equal(system.actorSelection('guardian-01').length, 0);
            done();
        }, 5);
    });
});