import {MailboxType} from "./getMailbox";
import {Effect} from "./System";
import {Observable} from "rxjs/Observable";

export function createActor (factory, address, context): Actor {
    return new factory(address, context);
}

export interface Actor {
    type: string
    receive(payload, message, sender): void;
    address: string;
    mailboxType: MailboxType
    methods?: {[methodName: string]: Method}
}

export interface IncomingActor {
    name?: string
    receive
    methods?: {[methodName: string]: Method}
}

export interface StateActor {
    type: string
    address: string
    mailboxType: MailboxType
    methods?: {[methodName: string]: Method}
    effects?: {[methodName: string]: Effect}
    missing?(payload: any, message: IncomingMessage): Observable<any>
}

export interface IncomingStateActor {
    type: string
    address: string
    methods?: {[methodName: string]: Method}
    effects?: {[methodName: string]: Effect}
    missing?(payload: any, message: IncomingMessage): Observable<any>
}