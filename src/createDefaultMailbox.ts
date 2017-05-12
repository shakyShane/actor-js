import {Actor} from "./createActor";
import {Mailbox} from "./getMailbox";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";

export interface MessageSenderRef {
    id: string,
    reply(message: any): void
}

export function createDefaultMailbox (actor: Actor, system): Mailbox {

    const incomingMessages = new Subject<IncomingMessage>();

    const outgoing = incomingMessages
        .flatMap((incomingMessage: IncomingMessage) => {

            const { address, payload } = incomingMessage.action;
            const respId = incomingMessage.messageID;

            if (typeof actor.receive !== 'function') {
                return Observable.throw(new Error(`'Actors[default] must implement a receive() method`));
            }

            return Observable.create((obs: Observer<MessageResponse>) => {

                const sender = {
                    id: incomingMessage.messageID,
                    reply: (response: any) => {
                        obs.next({errors: [], response, respId});
                    }
                } as MessageSenderRef;

                try {
                    actor.receive(payload, incomingMessage, sender);
                } catch(err) {
                    obs.next({errors: [err], response: null, respId});
                }
            }).take(1);
        }).share();

    return {
        outgoing,
        incoming: incomingMessages
    };
}