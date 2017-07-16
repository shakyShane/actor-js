import {Mailbox, MailboxType} from "./getMailbox";
import {Effect, System} from "./System";
import {Observable} from "rxjs/Observable";
import uuid = require('uuid/v4');

export function createActor (factory, address: string, context): Actor {
    return new factory(address, context);
}

export interface Actor {
    type: string
    receive?(name: string, payload: any, respond: (response: any) => void): void;
    setupReceive?(mailbox): Observable<any>;
    _responses?: Observable<any>;
    postStart?(): void;
    preStart?(): void;
    preRestart?(): void;
    postRestart?(): void;
    address: string;
    mailbox: Mailbox;
    patterns?: string[];
    methods?: {[methodName: string]: Method};
    _factoryMethod?: any;
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