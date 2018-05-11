declare global {
    interface Window {
        staunch: any
    }
}

export type AskFn = (name: string, payload?: any, id?: string) => any
export type TellFn = (name: string, payload?: any, id?: string) => any

export interface ActorRef {
    ask: AskFn,
    tell: TellFn,
    address: string,
}

export type MessageId = string;

export interface IncomingMessage {
    messageID: MessageId
    message: IOutgoingMessage
}

export interface IAction {
    type: string
    payload?: any
}

export interface IOutgoingMessage {
    address: string,
    action?: IAction
    contextCreator?: string
}

export interface MessageResponse {
    errors: Error[]
    response?: any
    respId: string
    cancelled?: boolean
    state?: any
}

export interface OutgoingResponseFromStream {
    messageID: string,
    resp: any,
    state?: any,
}

export type Method = (payload: any) => any;