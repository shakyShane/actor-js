import {Observable, Observer, Subject} from "rxjs";
import {IActor} from "./createActor";
import {IMailbox} from "./getMailbox";
import {IMessageResponse, IncomingMessage} from "./types";

export interface IMessageSenderRef {
    id: string;
    reply(message: any): void;
}

export function createDefaultMailbox(actor: IActor): IMailbox {

    const incomingMessages = new Subject<IncomingMessage>();
    const outgoingMessages = new Subject<IMessageResponse>();

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
        incoming: incomingMessages,
        outgoing: outgoingMessages,
    };
}
