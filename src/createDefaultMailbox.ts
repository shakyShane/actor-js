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

            if (typeof actor.receive !== 'function') {
                return Observable.throw(new Error(`'Actors[default] must implement a receive() method`));
            }

            return Observable.create((obs: Observer<IOutgoingMessage>) => {

                const sender = {
                    id: incomingMessage.messageID,
                    reply: (message: IOutgoingMessage) => {
                        obs.next(message);
                    }
                } as MessageSenderRef;

                actor.receive(payload, incomingMessage, sender);

            })
                .take(1)
                .map(output => {
                    return {
                        response: output,
                        respId: incomingMessage.messageID
                    }
            });

        }).share();

    return {
        outgoing,
        incoming: incomingMessages
    };
}