import {MailboxType} from "./getMailbox";
import {Effect} from "./System";
import {Observable} from "rxjs/Observable";
export function createActor (input): Actor {
    return {
        ...input,
        mailboxType: 'default'
    };
}

export interface Actor {
    name: string
    receive
    mailboxType: MailboxType
    methods?: {[methodName: string]: Method}
}

export interface IncomingActor {
    name?: string
    receive
    methods?: {[methodName: string]: Method}
}

export interface StateActor {
    name: string
    mailboxType: MailboxType
    methods?: {[methodName: string]: Method}
    effects?: {[methodName: string]: Effect}
    missing?(payload: any, message: IncomingMessage): Observable<any>
}

export interface IncomingStateActor {
    name?: string
    methods?: {[methodName: string]: Method}
    effects?: {[methodName: string]: Effect}
    missing?(payload: any, message: IncomingMessage): Observable<any>
}