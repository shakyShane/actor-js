import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {IActorContext} from "../ActorContext";
import {Actor} from "../createActor";
import {Subscription} from 'rxjs';
import {ActorRef} from "../ActorRef";
import {IncomingMessage, MessageResponse} from "../types";

export interface MessageSenderRef {
    id: string,
    reply(message: any): void
}

export function receive(actor: Actor, context: IActorContext, system) {
    const {methods} = actor;
    const {incoming} = actor.mailbox;

    incoming
        .flatMap((incomingMessage: IncomingMessage) => {
            const { address, action, contextCreator } = incomingMessage.message;
            const respId = incomingMessage.messageID;

            return Observable.create((obs: Observer<MessageResponse>) => {

                const respond = (response) => obs.next({errors: [], response, respId});

                if (actor.receive) {
                    const sender = new ActorRef(contextCreator, system);
                    try {
                        actor.receive(action.type, action.payload, respond, sender);
                    } catch(err) {
                        obs.next({errors: [err], response: null, respId});
                    }
                }

            }).take(1);
        })
        .do((x: MessageResponse) => actor.mailbox.outgoing.next(x))
        .subscribe();
}