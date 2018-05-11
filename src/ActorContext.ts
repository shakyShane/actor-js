import {BehaviorSubject, Observable, SchedulerLike} from "rxjs";
import {IActorRef, IMessageResponse, IncomingMessage} from "./types";

export interface IActorContext {
    actorOf(factory: Function, address?: string): IActorRef;
    actorSelection(search): IActorRef[];
    scheduler: SchedulerLike;
    messageScheduler: SchedulerLike;
    timeScheduler: SchedulerLike;
    gracefulStop(actorRefs: IActorRef|IActorRef[]): Observable<any>;
    stop(ActorRef): void;
    cleanupCancelledMessages(
        stream: Observable<IncomingMessage>,
        type: string,
        fn: (filteredStream: Observable<IncomingMessage>) => Observable<IMessageResponse>,
        state$: BehaviorSubject<any>,
    );
    parent: IActorRef;
    self: IActorRef;
}
