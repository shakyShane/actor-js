import {ask, tell} from "./System";
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

            const [_, method] = incomingMessage.action.type.split('.');
            const receive = actor.receive;

            if (typeof receive !== 'function') {
                return Observable.throw(new Error(`'Actors[default] must implement a receive() method`));
            }

            return Observable.create((obs: Observer<IOutgoingMessage>) => {

                const sender = {
                    id: incomingMessage.id,
                    reply: (message: IOutgoingMessage) => {
                        obs.next(message);
                    }
                } as MessageSenderRef;

                actor.receive(incomingMessage.action.payload, incomingMessage, sender);

            }).map(output => {
                return {
                    response: output,
                    respId: incomingMessage.id
                }
            });

        }).share();

    return {
        outgoing,
        incoming: incomingMessages
    };
}