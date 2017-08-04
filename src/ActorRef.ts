import {System} from "./System";
import {Observable} from 'rxjs';

export class ActorRef {

    constructor(public address: string, private system: System, public contextCreator?: string) {}

    ask(type: string, payload?: any) {
        const outgoing = {
            contextCreator: this.contextCreator,
            address: this.address,
            action: {type, payload}
        };
        return this.system.ask(outgoing);
    }

    tell(type: string, payload?: any) {
        const outgoing = {
            contextCreator: this.contextCreator,
            address: this.address,
            action: {type, payload}
        };
        return this.system.tell(outgoing);
    }
}