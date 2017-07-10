import {Actor} from "./createActor";
import {Mailbox} from "./getMailbox";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";

export interface MessageSenderRef {
    id: string,
    reply(message: any): void
}

export function createDefaultMailbox (actor: Actor): Mailbox {

    const incomingMessages = new Subject<IncomingMessage>();
    const outgoingMessages = new Subject<MessageResponse>();

    // const outgoing = incomingMessages
    //     .flatMap((incomingMessage: IncomingMessage) => {
    //
    //         const { address, payload } = incomingMessage.action;
    //         const respId = incomingMessage.messageID;
    //
    //         // console.log(JSON.stringify(incomingMessage, null, 2));
    //         // if (typeof actor.receive !== 'function') {
    //         //     return Observable.throw(new Error(`'Actors[default] must implement a receive() method`));
    //         // }
    //         //
    //         // console.log(actor._responses);
    //         // if (actor._responses) {
    //         //     return actor._responses;
    //         // }
    //
    //         return Observable.create((obs: Observer<MessageResponse>) => {
    //
    //             const sender = {
    //                 id: incomingMessage.messageID,
    //                 reply: (response: any) => {
    //                     obs.next({errors: [], response, respId});
    //                 }
    //             } as MessageSenderRef;
    //
    //             if (actor.receive) {
    //                 try {
    //                     actor.receive(payload, incomingMessage, sender);
    //                 } catch(err) {
    //                     obs.next({errors: [err], response: null, respId});
    //                 }
    //             }
    //
    //         }).take(1);
    //     }).share();

    return {
        outgoing: outgoingMessages,
        incoming: incomingMessages
    };
}