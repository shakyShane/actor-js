import {Observable, Observer} from "rxjs";
import {mergeMap, tap, take} from "rxjs/operators";
import {IActorContext} from "../ActorContext";
import {IActor} from "../createActor";
import {ActorRef} from "../ActorRef";
import {IncomingMessage, IMessageResponse} from "../types";
import {System} from "../System";

export interface MessageSenderRef {
    id: string,
    reply(message: any): void
}

export function receive(actor: IActor, context: IActorContext, system: System) {
    const {methods} = actor;
    const {incoming} = actor.mailbox;

    incoming.pipe(
        mergeMap((incomingMessage: IncomingMessage) => {
            const { address, action, contextCreator } = incomingMessage.message;
            const respId = incomingMessage.messageID;

            return Observable.create((obs: Observer<IMessageResponse>) => {

                const respond = (response: any) => obs.next({errors: [], response, respId});

                if (actor.receive) {
                    const sender = new ActorRef(contextCreator);
                    try {
                        actor.receive(action.type, action.payload, respond, sender);
                    } catch(err) {
                        obs.next({errors: [err], response: null, respId});
                    }
                }
            }).pipe(take(1));
        })
        , tap((x: IMessageResponse) => actor.mailbox.outgoing.next(x))
    ).subscribe();
}