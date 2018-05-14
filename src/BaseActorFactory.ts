import {IActorContext} from "./ActorContext";
import {IActorFactory} from "./SystemActor";
import {IncomingMessage} from "./types";

export class BaseActorFactory implements IActorFactory {
    public mailboxType = "default";

    constructor(public address: string, public context: IActorContext) {
        return this;
    }

    public receive(payload: any, message: IncomingMessage) {
        // console.log('Should be overriden');
        // console.log('payload', 'message');
    }
}
