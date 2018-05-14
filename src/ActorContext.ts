import {BehaviorSubject, Observable, SchedulerLike} from "rxjs";
import {IActorFactoryReturn} from "./createActor";
import {System} from "./System";
import {AskFnBound, IActorRef, IMessageResponse, IncomingMessage, TellFn, TellFnBound} from "./types";

export interface IActorContext {
    scheduler: SchedulerLike;
    messageScheduler: SchedulerLike;
    timeScheduler: SchedulerLike;
    parent: IActorRef;
    self: IActorRef;
    ask: AskFnBound;
    tell: TellFnBound;
    cleanupCancelledMessages: System["cleanupCancelledMessages"];
    actorOf(factory: () => IActorFactoryReturn, address?: string): IActorRef;
    actorSelection(search: string): IActorRef[];
    gracefulStop(actorRefs: IActorRef|IActorRef[]): Observable<any>;
    stop(ref: IActorRef): void;
}
