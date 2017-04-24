import uuid = require('uuid/v4');

export interface IActorContext {
    actorOf(factory: Function, address?: string): ActorRef
    actorSelection(search): ActorRef[]
    stop(ActorRef): void
}