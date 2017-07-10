import {Observable} from "rxjs/Observable";
import {IActorContext} from "../ActorContext";

export function reduxObservable(stream: Observable<IncomingMessage>, methods: object, context: IActorContext): Observable<any> {
    return Rx.Observable.from(Object.keys(methods))
        .flatMap(key => {
            const current = methods[key];
            return context.cleanupCancelledMessages(stream, key, function(stream) {
                return current(stream);
            })
        });
};