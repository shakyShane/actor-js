import {Observable} from "rxjs";
import {System} from "./System";

export class ActorRef {

    constructor(public address: string, private system: System, public contextCreator?: string) {}

    public ask(type: string, payload?: any) {
        const outgoing = {
            action: {type, payload},
            address: this.address,
            contextCreator: this.contextCreator,
        };
        return this.system.ask(outgoing);
    }

    public tell(type: string, payload?: any) {
        const outgoing = {
            action: {type, payload},
            address: this.address,
            contextCreator: this.contextCreator,
        };
        return this.system.tell(outgoing);
    }
}
