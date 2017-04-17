import {System, ask, tell} from "./System";

export class ActorRef {
    public address: string;
    public system: System;

    constructor(address: string, system: System) {
        this.address = address;
        this.system = system;
    }

    ask(payload) {
        const outgoing = {
            type: this.address,
            payload
        };
        return ask(outgoing, null, this.system);
    }

    tell(payload) {
        const outgoing = {
            type: this.address,
            payload
        };
        return tell(outgoing, null, this.system);
    }
}