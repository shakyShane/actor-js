import {EMPTY, Observable} from "rxjs";
import {IActorContext} from "../ActorContext";
import {IActor} from "../createActor";
import {BehaviorSubject, from, Subscription} from "rxjs";
import {IncomingMessage, IMessageResponse, IOutgoingResponseFromStream, StreamHandler} from "../types";
import {catchError, groupBy, map, mergeMap, tap} from "rxjs/internal/operators";
import {addResponse} from "../System.utils";

export type EffectFn = (stream: Observable<IncomingMessage>) => Observable<any>;
export type IRespondableStream = Observable<{respond: (response: any) => any, type: string, payload?:any}>

export type IMethodStream<Payload, Response, State> = Observable<{
    payload: Payload,
    state?: State,
    respond(response: Response, state?: State): IMessageResponse
}>

function getInitialState(actor: IActor): any {
    if (typeof actor.initialState !== 'undefined') {
        return actor.initialState;
    }
    if (typeof actor.getInitialState === 'function') {
        return actor.getInitialState();
    }
    return undefined;
}

export function mappedMethods(actor: IActor, context: IActorContext) {
    const {methods} = actor;
    const {incoming} = actor.mailbox;
    const initial = getInitialState(actor);
    const state$ = new BehaviorSubject(initial);

    if (!methods) {
        throw new Error('Missing `methods` for reduxObservable pattern');
    }

    incoming.pipe(
        groupBy((m: IncomingMessage) => m.message.action.type)
        , mergeMap(obs => {
            const fn: StreamHandler = methods[obs.key];
            return fn(addResponse(obs, state$) as any).pipe(
                catchError((e: any): any => {
                    console.log(`Uncaught error from '${fn.name}'`);
                    console.log(`Be sure to handle errors in '${fn.name}'`);
                    console.error(e);
                    return EMPTY;
                })
            )
        })
        , map((incomingMessage: IOutgoingResponseFromStream): IMessageResponse => {
            return {
                errors: [],
                response: (incomingMessage as any).resp,
                respId: incomingMessage.messageID,
                state: (incomingMessage as any).state,
            }
        })
        , tap(x => actor.mailbox.outgoing.next(x))
        , tap(x => state$.next(x.state))
    ).subscribe()

    // from(Object.keys(methods)).pipe(
    //     mergeMap(key => {
    //         const fn: StreamHandler = methods[key];
    //         return context.cleanupCancelledMessages(incoming, key, function(stream: Observable<any>) {
    //             return fn(stream).pipe(
    //                 catchError((e: any): any => {
    //                     console.log(`Uncaught error from '${fn.name}'`);
    //                     console.log(`Be sure to handle errors in '${fn.name}'`);
    //                     console.error(e);
    //                     return EMPTY;
    //                 })
    //             )
    //         }, state$)
    //     })
    //     , map((incomingMessage: IOutgoingResponseFromStream): IMessageResponse => {
    //         return {
    //             errors: [],
    //             response: (incomingMessage as any).resp,
    //             respId: incomingMessage.messageID,
    //             state: (incomingMessage as any).state,
    //         }
    //     })
    //     , tap(x => actor.mailbox.outgoing.next(x))
    //     , tap(x => state$.next(x.state))
    // ).subscribe();
}
