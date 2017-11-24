import {Actor, StateActor} from "./createActor";
import {Observable} from 'rxjs/Observable';
import './rx';

import debug = require('debug');
import uuid = require('uuid/v4');
import path = require('path');
import anymatch = require('anymatch');
import {ActorRef} from "./ActorRef";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {async as asyncScheduler} from "rxjs/scheduler/async";
import {asap as asapScheduler} from "rxjs/scheduler/asap";
import {ICreateOptions} from "./index";
import {IScheduler} from "rxjs/Scheduler";
import {IActorContext} from "./ActorContext";
import Disposable = Rx.Disposable;
import {Subscription} from "rxjs/Subscription";
import {createDefaultMailbox} from "./createDefaultMailbox";
import {setMaxListeners} from "cluster";
import * as patterns from './patterns';
import {IRespondableStream} from "./patterns/mapped-methods";
const logger = debug('acjs:System');
const lifecycleLogger = debug('acjs:lifecycle');
const messageLogger = debug('acjs:message');
const log = (ns) => (message) => logger(`${ns}`, message);

export type Effect = (payload: any, message: IncomingMessage) => Observable<any>;
export type SystemMessages = 'stop';

export class System {

    public actorRegister: BehaviorSubject<any>;
    public incomingActors: Subject<Actor>;
    public outgoingActors: Subject<ActorRef>;
    public responses: Subject<MessageResponse>;
    public cancelations = new Subject<MessageResponse>();
    public mailboxes: BehaviorSubject<any>;
    public arbiter: Subject<IncomingMessage>;
    public address = '/system';
    public messageScheduler: IScheduler;
    public timeScheduler: IScheduler;

    constructor(opts: ICreateOptions) {
        // global actorRegister of available actors
        this.actorRegister  = new BehaviorSubject({});
        // stream for actors to actorRegister upon
        this.incomingActors = new Subject<Actor>();
        // stream of actors to be removed from the register
        this.outgoingActors = new Subject<ActorRef>();
        // responses stream where actors can 'reply' via an messageID
        this.responses      = new Subject<MessageResponse>();
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
        const actor        = this.createActor(actorFactory, actorAddress, context);
        const decorated    = this.decorateActor(actor, actorAddress, actorFactory);

        return this.initActor(decorated, context, actorAddress, actorFactory, contextCreator);
    }

    public decorateActor(actor, address, factory) {

        actor.mailbox = createDefaultMailbox(actor);

        actor._factoryMethod = factory;

        if (!actor.address) {
            actor.address = address;
        }

        return actor;
    }

    public initActor(actor: Actor, context, address, factory, contextCreator: string): ActorRef {

        if (actor.preStart) {
            lifecycleLogger('preStart', address);
            actor.preStart();
        }

        this.incomingActors.next(actor);

        if (actor.postStart) {
            lifecycleLogger('postStart', address);
            actor.postStart();
        }

        if (actor.setupReceive) {
            lifecycleLogger('setupReceive', address);
            actor.setupReceive(actor.mailbox.incoming)
                .map((incomingMessage: OutgoingResponseFromStream): MessageResponse => {
                    return {
                        errors: [],
                        response: (incomingMessage as any).resp,
                        respId: incomingMessage.messageID,
                    }
                })
                .do(x => actor.mailbox.outgoing.next(x))
                .subscribe();
        }

        if (actor.patterns) {
            actor.patterns.forEach(pattern => {
                const match = patterns[pattern];
                if (match) {
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

        return new ActorRef(actor.address, this, contextCreator);
    }

    public reincarnate(address, _factoryMethod): Observable<any> {
        return Observable.create(observer => {
            const context   = this.createContext(address);
            const newActor  = this.createActor(_factoryMethod, address, context);
            const decorated = this.decorateActor(newActor, address, _factoryMethod);

            if (decorated.postRestart) {
                lifecycleLogger('postRestart', address);
                decorated.postRestart();
            }
            this.incomingActors.next(decorated);
            observer.complete();
        });
    }

    public actorSelection(search, prefix?: string): ActorRef[] {

        const actorRegister = this.actorRegister.getValue();
        const addresses     = Object.keys(actorRegister);

        const lookup = (() => {
            // if an absolute path is given, always use as-is
            if (search[0] === '/') {
                return search;
            }
            return [(prefix || this.address), search].join('/');
        })();

        // strip any trailing slashes
        const stripped = lookup.replace(/\/$/, '');
        const matcher  = anymatch(path.join(stripped));
        const contextCreator = prefix;

        return addresses
            .filter(matcher)
            .map(address => new ActorRef(address, this, contextCreator));
    }

    private stopActor(actorRef: ActorRef): Observable<any> {
        const self = this;
        return Observable.create(observer => {
            const reg = self.actorRegister.getValue();
            const selectedActor = reg[actorRef.address];
            if (selectedActor) {
                // console.log('private stopActor CREATE', Object.keys(reg));
                if (selectedActor.postStop) {
                    lifecycleLogger('postStop', actorRef.address);
                    selectedActor.postStop();
                }
            }
            observer.complete();
        });
    }

    public restartActor(actor: Actor): Observable<any> {
        const self = this;
        return Observable.create(observer => {
            // console.log('private stopActor CREATE', Object.keys(reg));
            if (actor.preRestart) {
                lifecycleLogger('preRestart', actor.address);
                actor.preRestart();
            }
            observer.complete();
        });
    }

    public removeActor(actorRef: ActorRef): Observable<any> {
        return Observable
            .of(true, this.messageScheduler)
            .do(x => this.outgoingActors.next(actorRef))
            .take(1)
    }

    private createActor(factory, address: string, context: IActorContext): Actor {
        return new factory(address, context);
    }

    private createContext(parentAddress: string): IActorContext {
        const bound = this.actorOf.bind(this);
        const boundSelection = this.actorSelection.bind(this);
        const cleanupCancelledMessages = this.cleanupCancelledMessages.bind(this);
        const boundStop = this.stop.bind(this);
        const gracefulStop = this.gracefulStop.bind(this);
        const parentRef = this.getParentRef(parentAddress);
        const self = new ActorRef(parentAddress, this);

        return {
            self,
            parent: parentRef,
            cleanupCancelledMessages,
            actorOf(factory, localAddress?): ActorRef {
                const prefix = parentAddress;
                if (!localAddress) {
                    localAddress = uuid();
                }
                return bound(factory, [prefix, localAddress].join('/'), parentAddress);
            },
            actorSelection(search): ActorRef[] {
                return boundSelection(search, parentAddress);
            },
            stop: boundStop,
            gracefulStop: gracefulStop,
            scheduler: this.messageScheduler,
            messageScheduler: this.messageScheduler,
            timeScheduler: this.timeScheduler,
        }
    }

    /**
     * the ask method is how actors post messages to each other
     * it's guaranteed to happen in an async manner
     * ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
     * @param message
     * @param messageID
     */
    public ask(message: IOutgoingMessage, messageID?: string): Observable<any> {
        if (!messageID) messageID = uuid();

        const responses = this.responses
            .filter(x => x.respId === messageID);
        
        const cancelations = this.cancelations
            .filter(x => x.respId === messageID)
            .map(x => {
                return Object.assign({}, x, {cancelled: true});
            });
        
        const trackResponse = Observable.merge(responses, cancelations)
            .take(1)
            .do(x => messageLogger('ask resp <-', x))
            .flatMap((incoming: MessageResponse) => {
                if (incoming.errors.length) {
                    return Observable.throw(incoming.errors[0])
                }
                if (incoming.cancelled) {
                    return Observable.empty();
                }
                return Observable.of(incoming.response);
            });

        const messageSender = Observable
            .of({message, messageID}, this.messageScheduler)
            .do(x => messageLogger('ask outgoing ->', x))
            .do(message => this.arbiter.next(message));

        return Observable.zip(trackResponse, messageSender, (resp) => resp)
    }

    /**
     * tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
     */
    public tell(message: IOutgoingMessage, messageID?: string): Observable<any> {

        if (!messageID) messageID = uuid();

        return Observable.of({message, messageID}, this.messageScheduler)
            .do(x => this.arbiter.next(x))
            .take(1);
    }

    private createActorAddress(path: string): string {
        if (!path) {
            path = uuid();
        }

        if (path.indexOf('/system') === -1) {
            return [this.address, path].join('/');
        }

        return path;
    }

    private getParentRef (address): ActorRef {
        const parentAddress = address.split('/').slice(0, -1);
        return new ActorRef(parentAddress.join('/'), this);
    }

    private createGracefulStopSequence(actorRef: ActorRef): Observable<any> {
        if (!System.isActorRef(actorRef)) {
            System.warnInvalidActorRef();
        }
        return Observable.concat(
            this.ask({address: actorRef.address, action: {type: 'stop'}}),
                // .do(x => console.log('graceful stop OK', actorRef.address)),
            this.stopActor(actorRef),
            this.removeActor(actorRef)
        );
    }

    public stop(actorRef: ActorRef): Subscription {
        if (!System.isActorRef(actorRef)) {
            System.warnInvalidActorRef();
        }
        return Observable.concat(
            this.tell({address: actorRef.address, action: {type: 'stop'}}),
            this.stopActor(actorRef),
            this.removeActor(actorRef)
        ).subscribe();
    }

    public gracefulStop(actorRefs: ActorRef|ActorRef[]): Observable<any> {
        const refs = [].concat(actorRefs).filter(Boolean);

        if (!refs.every(System.isActorRef)) {
            System.warnInvalidActorRef();
        }

        // console.log(refs);
        return Observable
            .concat(...refs.map(x => this.createGracefulStopSequence(x)))
            .toArray();
    }

    static warnInvalidActorRef() {
        throw new Error('Invalid actor provided. Please check your usage');
    }

    static isActorRef(input: any) {
        if (!input) {
            // anything falsey
            return false
        }
        if (typeof input.address === 'string') {
            return true;
        }
        return false;
    }

    static filterByType(stream: Observable<IncomingMessage>, type: string): Observable<IncomingMessage> {
        return stream
            .filter((msg: IncomingMessage) => {
                const { address, action } = msg.message;
                return action.type === type;
            })
    }

    static addResponse(stream: Observable<any>, state$: BehaviorSubject<any>, system: System): IRespondableStream {
        if (!state$) {
            state$ = new BehaviorSubject(undefined);
        }
        return stream
            .withLatestFrom(state$, (msg: IncomingMessage, state) => {
                const { address, action, contextCreator } = msg.message;
                const sender = new ActorRef(contextCreator, system);
                return {
                    type: action.type,
                    payload: action.payload,
                    respond: (resp: any, state?: any) => {
                        return Object.assign({}, msg, {resp, state});
                    },
                    state,
                    sender,
                }
            })
    }

    // static ofType(stream: Observable<any>, type: string): IRespondableStream {
    //     return System.addResponse(
    //         System.filterByType(stream, type)
    //     );
    // }

    public cleanupCancelledMessages(stream, type: string, fn, state$?) {

        if (!state$) {
            state$ = new BehaviorSubject(undefined);
        }

        const filtered = System.filterByType(stream, type);
        const output = fn(System.addResponse(filtered, state$, this));

        const collated = filtered.scan((acc, item) => {
            return acc.concat(item);
        }, []);

        return output
            // .take(1)
            .withLatestFrom(collated, (out, all) => {
                const toCancel = all
                    .filter(x => {
                        return x.messageID !== out.messageID;
                    })
                    .map((msg: IncomingMessage) => {
                        return Object.assign(
                            {},
                            msg,
                            {respId: msg.messageID},
                            {errors: []}
                        )
                    });

                toCancel.forEach(x => {
                    this.cancelations.next(x);
                });

                return out;
            });
    }
}