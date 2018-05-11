import {Observable, BehaviorSubject, SchedulerLike} from "rxjs";
import {ActorRef, IncomingMessage, MessageResponse} from "./types";

export interface IActorContext {
    actorOf(factory: Function, address?: string): ActorRef
    actorSelection(search): ActorRef[]
    scheduler: SchedulerLike;
    messageScheduler: SchedulerLike;
    timeScheduler: SchedulerLike;
    gracefulStop(actorRefs: ActorRef|ActorRef[]): Observable<any>
    stop(ActorRef): void
    cleanupCancelledMessages(
        stream: Observable<IncomingMessage>,
        type: string,
        fn: (filteredStream: Observable<IncomingMessage>) => Observable<MessageResponse>,
        state$: BehaviorSubject<any>
    )
    parent: ActorRef
    self: ActorRef
}