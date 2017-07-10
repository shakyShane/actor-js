import {Observable} from "rxjs/Observable";
import {IActorContext} from "../ActorContext";

export function reduxObservable(stream: Observable<IncomingMessage>, methods: object, context: IActorContext) {
    return Observable.from(Object.keys(methods))
        .flatMap(key => {
            const fn = methods[key];
            return context.cleanupCancelledMessages(stream, key, function(stream) {
                return fn(stream);
            })
        });
};