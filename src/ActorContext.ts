import {Observable} from "rxjs/Observable";

export interface IActorContext {
    actorOf(factory: Function, address?: string): ActorRef
    actorSelection(search): ActorRef[]
    gracefulStop(actorRefs: ActorRef|ActorRef[]): Observable<any>
    stop(ActorRef): void
    cleanupCancelledMessages(
        stream: Observable<IncomingMessage>,
        type: string,
        fn: (filteredStream: Observable<IncomingMessage>) => Observable<MessageResponse>
    )
    parent: ActorRef
    self: ActorRef
}