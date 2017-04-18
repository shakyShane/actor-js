import Rx = require('rx');
import {createDefaultMailbox} from "./createDefaultMailbox";
import {createStateMailbox} from "./createStateMailbox";
import {Observable} from "rxjs/Observable";
import {Subject} from 'rxjs/Subject';

export default function getMailbox(actor, type: MailboxType, system): Mailbox {
    if (type === 'default') {
        return createDefaultMailbox(actor, system);
    }
    // if (type === 'state') {
    //     return createStateMailbox(actor, system);
    // }
}

export interface Mailbox {
    outgoing: Observable<any>
    incoming: Subject<IncomingMessage>
}

export type MailboxType = 'default' | 'state';