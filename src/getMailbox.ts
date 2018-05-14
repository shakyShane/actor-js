// import {createStateMailbox} from "./createStateMailbox";
import {Observable, Subject} from "rxjs";
import {createDefaultMailbox} from "./createDefaultMailbox";
import {IMessageResponse, IncomingMessage} from "./types";

export interface IMailbox {
    outgoing: Subject<IMessageResponse>;
    incoming: Subject<IncomingMessage>;
}

export type MailboxType = "default" | "state";
