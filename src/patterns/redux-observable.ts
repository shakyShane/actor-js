import {Observable} from "rxjs/Observable";
import {IActorContext} from "../ActorContext";
import {Actor} from "../createActor";
import {Subscription} from 'rxjs';

type EffectFn = (stream: Observable<IncomingMessage>) => Observable<any>;
export type IRespondableStream = Observable<{respond: (reponse: any) => any, type: string, payload?:any}>

export function reduxObservable(actor: Actor, context: IActorContext) {
    const {methods} = actor;
    const {incoming} = actor.mailbox;

    if (!methods) {
        throw new Error('Missing `methods` for reduxObservable pattern');
    }

    return Observable.from(Object.keys(methods))
        .flatMap(key => {
            const fn: EffectFn = methods[key];
            return context.cleanupCancelledMessages(incoming, key, function(stream) {
                return fn(stream)
                    .catch((e: any): any => {
                        console.log(`Uncaught error from '${fn.name}'`);
                        console.log(`Be sure to handle errors in '${fn.name}'`);
                        console.error(e);
                        return Observable.empty();
                    })
            })
        })
        .map((incomingMessage: IncomingMessage) => {
            return {
                errors: [],
                response: (incomingMessage as any).resp,
                respId: incomingMessage.messageID
            }
        })
        .do(x => actor.mailbox.outgoing.next(x))
        .subscribe();
}
