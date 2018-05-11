import {createDefaultMailbox} from "./createDefaultMailbox";
// import {createStateMailbox} from "./createStateMailbox";
import {Observable, Subject} from "rxjs";
import {IncomingMessage, MessageResponse} from "./types";

export default function getMailbox(actor, type: MailboxType, system): Mailbox {
    if (type === 'default') {
        return createDefaultMailbox(actor);
    }
    // if (type === 'state') {
    //     return createStateMailbox(actor, system);
    // }
}

export interface Mailbox {
    outgoing: Subject<MessageResponse>
    incoming: Subject<IncomingMessage>
}

export type MailboxType = 'default' | 'state';