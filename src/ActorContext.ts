import uuid = require('uuid/v4');

export interface IActorContext {
    actorOf(factory: Function, path?: string): ActorRef
}