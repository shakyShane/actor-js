import {IActorContext} from "./ActorContext";
import {IActorFactory} from "./SystemActor";

export class BaseActorFactory implements IActorFactory {
    public mailboxType = "default";

    constructor(public address: string, public context: IActorContext) {
        return this;
    }

    public receive(payload, message) {
        // console.log('Should be overriden');
        // console.log('payload', 'message');
    }
}
