// import {createStateMailbox} from "./createStateMailbox";
import {Observable, Subject} from "rxjs";
import {createDefaultMailbox} from "./createDefaultMailbox";
import {IMessageResponse, IncomingMessage} from "./types";

export default function getMailbox(actor, type: MailboxType, system): IMailbox {
    if (type === "default") {
        return createDefaultMailbox(actor);
    }
    // if (type === 'state') {
    //     return createStateMailbox(actor, system);
    // }
}

export interface IMailbox {
    outgoing: Subject<IMessageResponse>;
    incoming: Subject<IncomingMessage>;
}

export type MailboxType = "default" | "state";
