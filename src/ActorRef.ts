import {System} from "./System";
import {Observable} from 'rxjs';
export class ActorRef {

    constructor(public address: string, private system: System) {}

    ask(payload) {
        const outgoing = {
            address: this.address,
            payload
        };
        return this.system.ask(outgoing);
    }

    tell(payload) {
        const outgoing = {
            address: this.address,
            payload
        };
        return this.system.tell(outgoing);
    }
}