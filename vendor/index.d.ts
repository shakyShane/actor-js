interface Window {
    staunch: any
}

type AskFn = (name: string, payload: any, id?: string) => any
type TellFn = (name: string, payload: any, id?: string) => any

interface ActorRef {
    ask: AskFn,
    tell: TellFn,
    address: string,
}

type MessageId = string;

interface IncomingMessage {
    messageID: MessageId
    action: IOutgoingMessage
}

interface IOutgoingMessage {
    address: string,
    payload?: any
    error?: boolean
}

interface MessageResponse {
    errors: Error[]
    response: any
    respId: string
    cancelled?: boolean
}

type Method = (payload: any) => any;