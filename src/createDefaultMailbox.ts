import Rx = require('rx');
import {ask, tell} from "./System";

export interface MessageSenderRef {
    id: string,
    reply(message: any): void
}

export function createDefaultMailbox (actor: Actor, system): Mailbox {

    const incomingMessages = new Rx.Subject<IncomingMessage>();

    const outgoing = incomingMessages
        .flatMap((incomingMessage: IncomingMessage) => {

            const [_, method] = incomingMessage.action.type.split('.');
            const receive = actor.receive;

            if (typeof receive !== 'function') {
                return Rx.Observable.throw(new Error(`'Actors[default] must implement a receive() method`));
            }

            return Rx.Observable.create(obs => {

                const sender = {
                    id: incomingMessage.id,
                    reply: (message) => {
                        obs.onNext(message);
                    }
                } as MessageSenderRef;

                receive.call(null, incomingMessage.action.payload, incomingMessage, sender);

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