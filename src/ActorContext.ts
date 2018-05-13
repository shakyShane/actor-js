import {BehaviorSubject, Observable, SchedulerLike} from "rxjs";
import {AskFnBound, IActorRef, IMessageResponse, IncomingMessage, TellFn, TellFnBound} from "./types";

export interface IActorContext {
    scheduler: SchedulerLike;
    messageScheduler: SchedulerLike;
    timeScheduler: SchedulerLike;
    parent: IActorRef;
    self: IActorRef;
    ask: AskFnBound;
    tell: TellFnBound;
    actorOf(factory: () => any, address?: string): IActorRef;
    actorSelection(search): IActorRef[];
    gracefulStop(actorRefs: IActorRef|IActorRef[]): Observable<any>;
    stop(ActorRef): void;
    cleanupCancelledMessages(
        stream: Observable<IncomingMessage>,
        type: string,
        fn: (filteredStream: Observable<IncomingMessage>) => Observable<IMessageResponse>,
        state$: BehaviorSubject<any>,
    );
}
