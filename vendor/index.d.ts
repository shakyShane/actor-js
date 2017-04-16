// import Rx = require('rx');

interface Window {
    staunch: any
}

type AskFn = (name: string, payload: any, id?: string) => any
type TellFn = (name: string, payload: any, id?: string) => any

interface ActorRef {
    name: string,
    ask: AskFn,
    tell: TellFn
    hasAddress(name: string): boolean
    addresses: {
        methods: string[]
        effects: string[]
    }
}
type MessageId = string;

interface IncomingMessage {
    id: MessageId
    action: IOutgoingMessage
}

interface IOutgoingMessage {
    type: string,
    payload?: any
}

interface MessageResponse {
    response: any
    respId: string
}

type Method = (payload: any, message: IncomingMessage) => any;

interface IncomingActor {
    name?: string
    receive
    methods?: {[methodName: string]: Method}
}
interface Actor {
    name: string
    receive
    mailboxType: MailboxType
    methods?: {[methodName: string]: Method}
}

interface Mailbox {
    outgoing: Rx.Observable<any>
    incoming: Rx.Subject<IncomingMessage>
}

type Effect = (payload: any, message: IncomingMessage) => Rx.Observable<any>;
type MailboxType = 'default' | 'state';

interface StateActor {
    name: string
    mailboxType: MailboxType
    methods?: {[methodName: string]: Method}
    effects?: {[methodName: string]: Effect}
    missing?(payload: any, message: IncomingMessage): Rx.Observable<any>
}

interface IncomingStateActor {
    name?: string
    methods?: {[methodName: string]: Method}
    effects?: {[methodName: string]: Effect}
    missing?(payload: any, message: IncomingMessage): Rx.Observable<any>
}