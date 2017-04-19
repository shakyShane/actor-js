export class ActorRef {

    constructor(public address: string, public context) {}

    ask(payload) {
        const outgoing = {
            type: this.address,
            payload
        };
        return this.context.ask(outgoing);
    }

    tell(payload) {
        const outgoing = {
            type: this.address,
            payload
        };
        return this.context.tell(outgoing);
    }
}