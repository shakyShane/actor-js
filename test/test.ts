import {createSystem} from "../src";

declare var describe: any, it: any;

import * as assert from 'assert';
import {from} from "rxjs";
import {
    concatMap,
    mergeAll,
    toArray
} from "rxjs/internal/operators";
import {IMethodStream} from "../src/patterns/mapped-methods";
import {Observable} from "rxjs/Rx";

describe('test', function() {
    it('should work', function(done) {
        const {actorOf, ask} = createSystem();

        const ref = actorOf(function() {
            return {
                methods: {
                    'ping': (stream: IMethodStream<string, string, any>) => {
                        return stream.pipe(
                            concatMap(({respond, payload, state}) => {
                                return Observable.create(obs => {
                                    console.log('start', payload);
                                    const t = setTimeout(() => {
                                        console.log('complete', payload);
                                        obs.next(respond(payload));
                                        obs.complete();
                                    }, 500);
                                    return () => {
                                        console.log('teardown', payload);
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
            console.log('was done', xs);
            done();
        });
        // ask(ref, 'ping', '1').subscribe();
        // setTimeout(() => ask(ref, 'ping', '2').subscribe(), 100);
        // setTimeout(() => ask(ref, 'ping', '3').subscribe(), 200);
    });
});