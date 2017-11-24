import {IActorContext} from "./ActorContext";
import {IncomingMessage} from "./types";

export interface IActorFactory {
    mailboxType: string;
    address: string;
    context: IActorContext;
    receive(payload: any, message: IncomingMessage): any
}

export class BaseActorFactory implements IActorFactory {
    public mailboxType = 'default';
    constructor(public address: string, public context: IActorContext) {
        return this;
    }
    receive(payload, message) {
        // console.log('Should be overriden');
        // console.log('payload', 'message');
    }
}

export class SystemActor extends BaseActorFactory {
    receive() {
        // console.log('Sup from system');
    }
}