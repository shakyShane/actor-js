import {
    asapScheduler,
    asyncScheduler,
    BehaviorSubject,
    Observable,
    of,
    SchedulerLike,
    Subject,
    Subscription, throwError,
} from "rxjs";
import {createActor, IActor} from "./createActor";

import anymatch = require("anymatch");
import debug = require("debug");
import uuid = require("uuid/v4");
import {IActorContext} from "./ActorContext";
import {ActorRef} from "./ActorRef";
import {ICreateOptions} from "./index";
import * as patterns from "./patterns";

import {concat, EMPTY, merge, Observer, zip} from "rxjs";
import {delay, reduce, scan, subscribeOn} from "rxjs/internal/operators";
import {filter, map, mergeMap, take, tap, toArray, withLatestFrom} from "rxjs/operators";
import {invalidActorRefError} from "./System.errors";
import {
    addResponse,
    decorateActor,
    filterByType,
    getParentRef,
    isActorRef,
    warnInvalidActorRef,
} from "./System.utils";
import {IActorRef, IMessageResponse, IncomingMessage, IOutgoingMessage, IOutgoingResponseFromStream} from "./types";
import {async} from "rxjs/internal/scheduler/async";

const lifecycleLogger = debug("acjs:lifecycle");
const messageLogger = debug("acjs:message");

export type Effect = (payload: any, message: IncomingMessage) => Observable<any>;

export class System {

    public actorRegister: BehaviorSubject<any>;
    public incomingActors: Subject<IActor>;
    public outgoingActors: Subject<ActorRef>;
    public responses: Subject<IMessageResponse>;
    public cancelations = new Subject<IMessageResponse>();
    public mailboxes: BehaviorSubject<any>;
    public arbiter: Subject<IncomingMessage>;
    public address = "/system";
    public messageScheduler: SchedulerLike;
    public timeScheduler: SchedulerLike;

    constructor(opts: ICreateOptions) {
        // global actorRegister of available actors
        this.actorRegister  = new BehaviorSubject({});
        // stream for actors to actorRegister upon
        this.incomingActors = new Subject<IActor>();
        // stream of actors to be removed from the register
        this.outgoingActors = new Subject<ActorRef>();
        // responses stream where actors can 'reply' via an messageID
        this.responses      = new Subject<IMessageResponse>();
        // an object containing all mailboxes
        this.mailboxes      = new BehaviorSubject({});
        // create an arbiter for handling incoming messages
        this.arbiter        = new Subject<IncomingMessage>();
        //
        this.messageScheduler = opts.messageScheduler || asyncScheduler;
        this.timeScheduler    = opts.timeScheduler || asapScheduler;
    }

    /**
     * Create a new actor from a factory + optional path
     * note: A UUID path will be created if this
     * @param actorFactory
     * @param address
     * @returns {ActorRef}
     */
    public actorOf(actorFactory: any, address?: string, contextCreator?: string): ActorRef {

        const actorAddress = this.createActorAddress(address);
        const context      = this.createContext(actorAddress);
        const actor        = createActor(actorFactory, actorAddress, context);
        const decorated    = decorateActor(actor, actorAddress, actorFactory);

        return this.initActor(decorated, context, actorAddress, contextCreator);
    }

    /**
     * @param stream
     * @param {string} type
     * @param fn
     * @param state$
     * @returns {any}
     */
    public cleanupCancelledMessages(stream: Observable<any>,
                                    type: string,
                                    fn: any,
                                    state$?: BehaviorSubject<any>): Observable<any> {

        if (!state$) {
            state$ = new BehaviorSubject(undefined);
        }

        const filtered = filterByType(stream, type);
        const output = fn(addResponse(filtered, state$));

        const collated = filtered.pipe(
            scan((acc, item: IncomingMessage) => {
                return acc.concat(item);
            }, [] as IncomingMessage[]),
        );

        return output.pipe(
            withLatestFrom(collated, (out, all) => {
                const toCancel = all
                    .filter((x) => {
                        return x.messageID !== (out as any).messageID;
                    })
                    .map((msg: IncomingMessage) => {
                        return Object.assign(
                            {},
                            msg,
                            {respId: msg.messageID},
                            {errors: []},
                        );
                    });

                toCancel.forEach((x) => {
                    this.cancelations.next(x);
                });

                return out;
            }),
        );
    }

    public initActor(actor: IActor,
                     context: IActorContext,
                     address: string,
                     contextCreator: string): ActorRef {

        if (actor.preStart) {
            lifecycleLogger("preStart", address);
            actor.preStart();
        }

        this.incomingActors.next(actor);

        if (actor.postStart) {
            lifecycleLogger("postStart", address);
            actor.postStart();
        }

        if (actor.setupReceive) {
            lifecycleLogger("setupReceive", address);
            actor.setupReceive(actor.mailbox.incoming).pipe(
                map((incomingMessage: IOutgoingResponseFromStream): IMessageResponse => {
                    return {
                        errors: [],
                        respId: incomingMessage.messageID,
                        response: (incomingMessage as any).resp,
                    };
                })
                , tap((x) => actor.mailbox.outgoing.next(x)),
            ).subscribe();
        }

        if (actor.patterns) {
            actor.patterns.forEach((pattern: any) => {
                const match: any = (patterns as any)[pattern];
                if (match && typeof match === "function") {
                    match.call(null, actor, context);
                }
            });
        }

        if (actor.receive) {
            patterns.receive(actor, context, this);
        } else if (actor.methods) {
            const match = patterns.mappedMethods;
            match.call(null, actor, context);
        }

        return new ActorRef(actor.address, contextCreator);
    }

    public reincarnate(address: string, factoryMethod: () => IActor): Observable<any> {
        return Observable.create((observer: Observer<IActor>) => {
            const context   = this.createContext(address);
            const newActor  = createActor(factoryMethod, address, context);
            const decorated = decorateActor(newActor, address, factoryMethod);

            if (decorated.postRestart) {
                lifecycleLogger("postRestart", address);
                decorated.postRestart();
            }
            this.incomingActors.next(decorated);
            observer.complete();
        });
    }

    public actorSelection(search: string, prefix?: string): ActorRef[] {

        const actorRegister = this.actorRegister.getValue();
        const addresses     = Object.keys(actorRegister);

        const lookup = (() => {
            // if an absolute path is given, always use as-is
            if (search[0] === "/") {
                return search;
            }
            return [(prefix || this.address), search].join("/");
        })();

        // strip any trailing slashes
        const stripped       = lookup.replace(/\/$/, "");
        const matcher: any  = anymatch(stripped);
        const contextCreator = prefix;

        return addresses
            .filter(matcher)
            .map((address) => new ActorRef(address, contextCreator));
    }

    public stopActor(actorRef: ActorRef): Observable<any> {
        const self = this;
        return Observable.create((observer: Observer<void>) => {
            const reg = self.actorRegister.getValue();
            const selectedActor = reg[actorRef.address];
            if (selectedActor) {
                // console.log('private stopActor CREATE', Object.keys(reg));
                if (selectedActor.postStop) {
                    lifecycleLogger("postStop", actorRef.address);
                    selectedActor.postStop();
                }
            }
            observer.complete();
        });
    }

    public restartActor(actor: IActor): Observable<any> {
        return Observable.create((observer: Observer<void>) => {
            if (actor.preRestart) {
                lifecycleLogger("preRestart", actor.address);
                actor.preRestart();
            }
            observer.complete();
        });
    }

    public removeActor(actorRef: ActorRef): Observable<any> {
        return of(true, this.messageScheduler).pipe(
            tap((x) => this.outgoingActors.next(actorRef))
            , take(1),
        );
    }

    public createContext(parentAddress: string): IActorContext {
        const bound = this.actorOf.bind(this);
        const boundSelection = this.actorSelection.bind(this);
        const cleanupCancelledMessages = this.cleanupCancelledMessages.bind(this);
        const boundStop = this.stop.bind(this);
        const gracefulStop = this.gracefulStop.bind(this);
        const parentRef = getParentRef(parentAddress);
        const self = new ActorRef(parentAddress);

        const tell = (ref: IActorRef, type: string, payload?: any) => {
            if (!isActorRef(ref)) {
                return invalidActorRefError(ref);
            }
            const outgoing = {
                action: {type, payload},
                address: ref.address,
                contextCreator: ref.contextCreator,
            };
            return this.tell(outgoing);
        };

        const ask = (ref: IActorRef, type: string, payload?: any) => {
            if (!isActorRef(ref)) {
                return invalidActorRefError(ref);
            }
            const outgoing = {
                action: {type, payload},
                address: ref.address,
                contextCreator: ref.contextCreator,
            };
            return this.ask(outgoing);
        };

        return {
            actorOf(factory, localAddress?): ActorRef {
                const prefix = parentAddress;
                if (!localAddress) {
                    localAddress = uuid();
                }
                return bound(factory, [prefix, localAddress].join("/"), parentAddress);
            },
            actorSelection(search): ActorRef[] {
                return boundSelection(search, parentAddress);
            },
            ask,
            cleanupCancelledMessages,
            gracefulStop,
            messageScheduler: this.messageScheduler,
            parent: parentRef,
            scheduler: this.messageScheduler,
            self,
            stop: boundStop,
            tell,
            timeScheduler: this.timeScheduler,
        };
    }

    /**
     * the ask method is how actors post messages to each other
     * it's guaranteed to happen in an async manner
     * ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
     * @param message
     * @param messageID
     */
    public ask(message: IOutgoingMessage, messageID?: string): Observable<any> {
        if (!messageID) { messageID = uuid(); }

        const responses = this.responses.pipe(
            filter((x) => x.respId === messageID),
        );

        const cancellations = this.cancelations.pipe(
            filter((x) => x.respId === messageID)
            , map((x) => {
                return Object.assign({}, x, {cancelled: true});
            }),
        );

        const trackResponse = merge(responses, cancellations).pipe(
            take(1)
            , tap((x) => messageLogger("ask resp <-", x))
            , mergeMap((incoming: IMessageResponse) => {
                if (incoming.errors.length) {
                    return throwError(incoming.errors[0]);
                }
                if (incoming.cancelled) {
                    return EMPTY;
                }
                return of(incoming.response);
            }),
        );

        const messageSender = of({message, messageID}, this.messageScheduler).pipe(
            subscribeOn(async),
            delay(100),
            tap((x) => messageLogger("ask outgoing ->", x))
            , tap((outgoingMessage) => this.arbiter.next(outgoingMessage)),
        );

        return zip(trackResponse, messageSender, (resp) => resp);
    }

    /**
     * tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
     */
    public tell(message: IOutgoingMessage, messageID?: string): Observable<any> {

        if (!messageID) { messageID = uuid(); }

        return of({message, messageID}, this.messageScheduler).pipe(
            tap((x) => this.arbiter.next(x))
            , take(1),
        );
    }

    public createActorAddress(path: string): string {
        if (!path) {
            path = uuid();
        }

        if (path.indexOf("/system") === -1) {
            return [this.address, path].join("/");
        }

        return path;
    }

    public createGracefulStopSequence(actorRef: ActorRef): Observable<any> {
        if (!isActorRef(actorRef)) {
            warnInvalidActorRef();
        }
        return concat(
            this.ask({address: actorRef.address, action: {type: "stop"}}),
                // .do(x => console.log('graceful stop OK', actorRef.address)),
            this.stopActor(actorRef),
            this.removeActor(actorRef),
        );
    }

    public stop(actorRef: ActorRef): Subscription {
        if (!isActorRef(actorRef)) {
            warnInvalidActorRef();
        }
        return concat(
            this.tell({address: actorRef.address, action: {type: "stop"}}),
            this.stopActor(actorRef),
            this.removeActor(actorRef),
        ).subscribe();
    }

    public gracefulStop(actorRefs: ActorRef|ActorRef[]): Observable<any> {
        const refs = [].concat(actorRefs).filter(Boolean);

        if (!refs.every(isActorRef)) {
            warnInvalidActorRef();
        }

        // console.log(refs);
        return concat(...refs.map((x) => this.createGracefulStopSequence(x))).pipe(
            toArray(),
        );
    }
}
