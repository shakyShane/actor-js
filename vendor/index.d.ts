interface Window {
    staunch: any
}

type AskFn = (name: string, payload: any, id?: string) => any
type TellFn = (name: string, payload: any, id?: string) => any

interface ActorRef {
    name: string,
    ask: AskFn,
    tell: TellFn,
    address: string,
    hasAddress(name: string): boolean
    addresses: {
        methods: string[]
        effects: string[]
    }
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