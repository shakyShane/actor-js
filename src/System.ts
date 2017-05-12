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
import {ICreateOptions} from "./index";
import {IScheduler} from "rxjs/Scheduler";
import {IActorContext} from "./ActorContext";
import Disposable = Rx.Disposable;
import {Subscription} from "rxjs/Subscription";
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
    public mailboxes: BehaviorSubject<any>;
    public arbiter: Subject<IncomingMessage>;
    public address = '/system';
    public mailboxTypes = new Set(['default', 'state']);
    public messageScheduler: IScheduler;

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
    }

    /**
     * Create a new actor from a factory + optional path
     * note: A UUID path will be created if this
     * @param actorFactory
     * @param address
     * @returns {ActorRef}
     */
    public actorOf(actorFactory: any, address?: string): ActorRef {

        const actorAddress = this.createActorAddress(address);
        const context      = this.createContext(actorAddress);
        const actor        = this.createActor(actorFactory, actorAddress, context);
        const decorated    = this.decorateActor(actor, actorAddress, actorFactory);

        return this.initActor(decorated, context, actorAddress, actorFactory);
    }

    public decorateActor(actor, address, factory) {
        if (!actor.mailboxType) {
            actor.mailboxType = 'default';
        } else {
            if (!this.mailboxTypes.has(actor.mailboxType)) {
                console.error('Mailbox type not supported');
                actor.mailboxType = 'default';
            }
        }

        actor._factoryMethod = factory;

        if (!actor.address) {
            actor.address = address;
        }

        return actor;
    }

    public initActor(actor, context, address, factory): ActorRef {

        if (actor.preStart) {
            lifecycleLogger('preStart', address);
            actor.preStart();
        }

        this.incomingActors.next(actor);

        if (actor.postStart) {
            lifecycleLogger('postStart', address);
            actor.postStart();
        }

        return new ActorRef(actor.address, this);
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

        return addresses
            .filter(matcher)
            .map(address => new ActorRef(address, this));
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
        const boundStop = this.stop.bind(this);
        const gracefulStop = this.gracefulStop.bind(this);
        const parentRef = this.getParentRef(parentAddress);
        const self = new ActorRef(parentAddress, this);

        return {
            self,
            parent: parentRef,
            actorOf(factory, localAddress?): ActorRef {
                const prefix = parentAddress;
                if (!localAddress) {
                    localAddress = uuid();
                }
                return bound(factory, [prefix, localAddress].join('/'));
            },
            actorSelection(search): ActorRef[] {
                return boundSelection(search, parentAddress);
            },
            stop: boundStop,
            gracefulStop: gracefulStop
        }
    }

    /**
     * the ask method is how actors post messages to each other
     * it's guaranteed to happen in an async manner
     * ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
     * @param action
     * @param messageID
     */
    public ask(action: IOutgoingMessage, messageID?: string): Observable<any> {
        if (!messageID) messageID = uuid();

        const trackResponse = this.responses
            .filter(x => x.respId === messageID)
            .do(x => messageLogger('ask resp <-', x))
            .flatMap((incoming: MessageResponse) => {
                if (incoming.errors.length) {
                    return Observable.throw(incoming.errors[0])
                }
                return Observable.of(incoming.response);
            })
            .take(1);

        const messageSender = Observable
            .of({action, messageID}, this.messageScheduler)
            .do(x => messageLogger('ask outgoing ->', x))
            .do(message => this.arbiter.next(message));

        return Observable.zip(trackResponse, messageSender, (resp) => resp)
    }

    /**
     * tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
     */
    public tell(action: IOutgoingMessage, messageID?: string): Observable<any> {
        if (!messageID) messageID = uuid();
        return Observable.of({action, messageID}, this.messageScheduler)
            .do(this.arbiter)
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
        return Observable.concat(
            this.ask({address: actorRef.address, payload: 'stop'}),
                // .do(x => console.log('graceful stop OK', actorRef.address)),
            this.stopActor(actorRef),
            this.removeActor(actorRef)
        );
    }

    public stop(actorRef: ActorRef): Subscription {
        return Observable.concat(
            this.tell({address: actorRef.address, payload: 'stop'}),
            this.stopActor(actorRef),
            this.removeActor(actorRef)
        ).subscribe();
    }

    public gracefulStop(actorRefs: ActorRef|ActorRef[]): Observable<any> {
        const refs = [].concat(actorRefs).filter(Boolean);
        // console.log(refs);
        return Observable
            .concat(...refs.map(x => this.createGracefulStopSequence(x)))
            .toArray();
    }
}