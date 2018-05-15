import {createSystem} from "../src";
import {from} from "rxjs";
import {
    concatMap,
    mergeAll,
    toArray
} from "rxjs/internal/operators";
import {IMethodStream} from "../src/patterns/mapped-methods";
import {Observable} from "rxjs/Rx";
import * as assert from "assert";

describe('test', function() {
    it('should work', function(done) {
        const {actorOf, ask} = createSystem();
        const calls = [];
        const ref = actorOf(function() {
            return {
                methods: {
                    'ping': (stream: IMethodStream<string, string, any>) => {
                        return stream.pipe(
                            concatMap(({respond, payload, state}) => {
                                return Observable.create(obs => {
                                    calls.push(`start ${payload}`);
                                    const t = setTimeout(() => {
                                        calls.push(`complete ${payload}`);
                                        obs.next(respond(payload));
                                        obs.complete();
                                    }, 100);
                                    return () => {
                                        calls.push(`teardown ${payload}`);
                                        clearTimeout(t);
                                    }
                                })
                            })
                        )
                    }
                }
            }
        }, 'actor1');

        from([
            ask(ref, 'ping', '1'),
            ask(ref, 'ping', '2'),
            ask(ref, 'ping', '3'),
        ]).pipe(mergeAll(), toArray()).subscribe((xs) => {
            assert.deepEqual(xs, ['1', '2', '3']);
            setTimeout(() => {
                assert.deepEqual(calls, [
                    'start 1',
                    'complete 1',
                    'start 2',
                    'teardown 1',
                    'complete 2',
                    'start 3',
                    'teardown 2',
                    'complete 3',
                    'teardown 3'
                ]);
                done();
            }, 0)
        });
    });
});