import {IActorContext} from "./ActorContext";

export interface ActorFactory {
    mailboxType: string;
    address: string;
    context: IActorContext;
    receive(payload: any, message: IncomingMessage): any
}

export class BaseActorFactory implements ActorFactory {
    public mailboxType = 'default';
    constructor(public address: string, public context: IActorContext) {
        return this;
    }
    receive(payload, message) {
        console.log('Should be overriden');
        console.log('payload', 'message');
    }
}

export class SystemActor extends BaseActorFactory {
    receive() {
        console.log('Sup from system');
    }
}