export function createResponse(incoming: IncomingMessage, outgoing: any): OutgoingResponseFromStream {
    return {
        messageID: incoming.messageID,
        resp: outgoing,
    }
}