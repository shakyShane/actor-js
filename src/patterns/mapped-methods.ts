import {Observable} from "rxjs/Observable";
import {IActorContext} from "../ActorContext";
import {Actor} from "../createActor";
import {Subscription} from 'rxjs';
import {BehaviorSubject} from "rxjs/BehaviorSubject";

type EffectFn = (stream: Observable<IncomingMessage>) => Observable<any>;
export type IRespondableStream = Observable<{respond: (reponse: any) => any, type: string, payload?:any}>

export type IMethodStream<Payload, Response, State> = Observable<{
    payload: Payload,
    state?: State,
    respond(response: Response, state?: State): MessageResponse
}>

function getInitialState(actor: Actor): any {
    if (typeof actor.initialState !== 'undefined') {
        return actor.initialState;
    }
    if (typeof actor.getInitialState === 'function') {
        return actor.getInitialState();
    }
    return undefined;
}

export function mappedMethods(actor: Actor, context: IActorContext) {
    const {methods} = actor;
    const {incoming} = actor.mailbox;
    const initial = getInitialState(actor);
    const state$ = new BehaviorSubject(initial);

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
            }, state$)
        })
        .map((incomingMessage: any): MessageResponse => {
            return {
                errors: [],
                response: (incomingMessage as any).resp,
                respId: incomingMessage.messageID,
                state: (incomingMessage as any).state,
            }
        })
        .do(x => actor.mailbox.outgoing.next(x))
        .do(x => state$.next(x.state))
        .subscribe();
}
