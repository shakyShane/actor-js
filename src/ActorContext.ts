import uuid = require('uuid/v4');
import {Observable} from "rxjs/Observable";

export interface IActorContext {
    actorOf(factory: Function, address?: string): ActorRef
    actorSelection(search): ActorRef[]
    gracefulStop(actorRefs: ActorRef|ActorRef[]): Observable<any>
    stop(ActorRef): void
    parent: ActorRef
}