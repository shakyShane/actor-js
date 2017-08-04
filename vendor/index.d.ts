interface Window {
    staunch: any
}

type AskFn = (name: string, payload?: any, id?: string) => any
type TellFn = (name: string, payload?: any, id?: string) => any

interface ActorRef {
    ask: AskFn,
    tell: TellFn,
    address: string,
}

type MessageId = string;

interface IncomingMessage {
    messageID: MessageId
    message: IOutgoingMessage
}

interface IAction {
    type: string
    payload?: any
}

interface IOutgoingMessage {
    address: string,
    action?: IAction
    contextCreator?: string
}

interface MessageResponse {
    errors: Error[]
    response: any
    respId: string
    cancelled?: boolean
    state?: any
}

type Method = (payload: any) => any;