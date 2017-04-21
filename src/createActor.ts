import {MailboxType} from "./getMailbox";
import {Effect, System} from "./System";
import {Observable} from "rxjs/Observable";
import uuid = require('uuid/v4');

export function createActor (factory, address: string, context): IActor {
    return new factory(address, context);
}


export interface IActor {
    type: string
    receive(payload, message, sender): void;
    address: string;
    mailboxType: MailboxType
    methods?: {[methodName: string]: Method}
}

export interface IncomingActor {
    name?: string
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