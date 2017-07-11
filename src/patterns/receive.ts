import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {IActorContext} from "../ActorContext";
import {Actor} from "../createActor";
import {Subscription} from 'rxjs';

export interface MessageSenderRef {
    id: string,
    reply(message: any): void
}

export function receive(actor: Actor, context: IActorContext) {
    const {methods} = actor;
    const {incoming} = actor.mailbox;

    incoming
        .flatMap((incomingMessage: IncomingMessage) => {
            const { address, payload } = incomingMessage.action;
            const respId = incomingMessage.messageID;

            return Observable.create((obs: Observer<MessageResponse>) => {

                const sender = {
                    id: incomingMessage.messageID,
                    reply: (response: any) => {
                        obs.next({errors: [], response, respId});
                    }
                } as MessageSenderRef;

                if (actor.receive) {
                    try {
                        actor.receive(payload, incomingMessage, sender);
                    } catch(err) {
                        obs.next({errors: [err], response: null, respId});
                    }
                }

            }).take(1);
        })
        .do((x: MessageResponse) => actor.mailbox.outgoing.next(x))
        .subscribe();
}