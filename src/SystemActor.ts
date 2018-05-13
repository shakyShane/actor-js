import {IActorContext} from "./ActorContext";
import {BaseActorFactory} from "./BaseActorFactory";
import {IncomingMessage} from "./types";

export interface IActorFactory {
    mailboxType: string;
    address: string;
    context: IActorContext;
    receive(payload: any, message: IncomingMessage): any;
}

export class SystemActor extends BaseActorFactory {
    public receive() {
        // console.log('Sup from system');
    }
}
