import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {IScheduler} from "rxjs/Scheduler";
import {ActorRef, IncomingMessage, MessageResponse} from "./types";

export interface IActorContext {
    actorOf(factory: Function, address?: string): ActorRef
    actorSelection(search): ActorRef[]
    scheduler: IScheduler;
    messageScheduler: IScheduler;
    timeScheduler: IScheduler;
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