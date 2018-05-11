import {Observable} from "rxjs";
import {System} from "./System";

export class ActorRef {

    constructor(public address: string, private system: System, public contextCreator?: string) {}

    public ask(type: string, payload?: any) {
        const outgoing = {
            contextCreator: this.contextCreator,
            address: this.address,
            action: {type, payload},
        };
        return this.system.ask(outgoing);
    }

    public tell(type: string, payload?: any) {
        const outgoing = {
            contextCreator: this.contextCreator,
            address: this.address,
            action: {type, payload},
        };
        return this.system.tell(outgoing);
    }
}
