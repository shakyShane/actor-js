import {IncomingMessage, IOutgoingResponseFromStream} from "../types";

export function createResponse(incoming: IncomingMessage, outgoing: any): IOutgoingResponseFromStream {
    return {
        messageID: incoming.messageID,
        resp: outgoing,
    }
}