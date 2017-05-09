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
}

interface MessageResponse {
    response: any
    respId: string
}

type Method = (payload: any, message: IncomingMessage) => any;