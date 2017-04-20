import {Actor, StateActor} from "./createActor";
import {Observable} from 'rxjs/Observable';
import './rx';

import debug = require('debug');
import uuid = require('uuid/v4');
import {ActorRef} from "./ActorRef";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {async as asyncScheduler} from "rxjs/scheduler/async";
import {ICreateOptions} from "./index";
import {IScheduler} from "rxjs/Scheduler";
import {IActorContext} from "./ActorContext";
const logger = debug('staunch:System');
const log = (ns) => (message) => logger(`${ns}`, message);

export type Effect = (payload: any, message: IncomingMessage) => Observable<any>;

export class System {

    public actorRegister: BehaviorSubject<any>;
    public incomingActors: Subject<Actor|StateActor>;
    public responses: Subject<MessageResponse>;
    public mailboxes: BehaviorSubject<any>;
    public arbiter: Subject<IncomingMessage>;
    public address = '/system';
    public messageScheduler: IScheduler;

    constructor(opts: ICreateOptions) {
        // global actorRegister of available actors
        this.actorRegister  = new BehaviorSubject({});
        // stream for actors to actorRegister upon
        this.incomingActors = new Subject<Actor|StateActor>();
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
     * @param path
     * @returns {ActorRef}
     */
    public actorOf(actorFactory: any, path?: string): ActorRef {

        const actorAddress = this.createActorAddress(path);
        const context      = this.createContext(actorAddress);
        const actor        = this.createActor(actorFactory, actorAddress, context);

        this.incomingActors.next(actor);

        return new ActorRef(actor.address, this);
    }

    private createActor(factory, address: string, context: IActorContext): Actor {
        return new factory(address, context);
    }

    private createContext(address: string): IActorContext {
        const bound = this.actorOf.bind(this);
        return {
            actorOf(factory, path?) {
                const prefix = address;
                if (!path) {
                    path = uuid();
                }
                return bound(factory, [prefix, path].join('/'));
            }
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
            .do(log('ask resp <-'))
            .map(x => x.response)
            .take(1);

        const messageSender = Observable
            .of({action, messageID}, this.messageScheduler)
            .do(log('ask outgoing ->'))
            .do(message => this.arbiter.next(message));

        return Observable.zip(trackResponse, messageSender, (resp) => resp);
    }

    /**
     * tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
     */
    public tell(action: IOutgoingMessage, messageID?: string): Observable<any> {
        if (!messageID) messageID = uuid();

        return Observable.of({action, messageID}, this.messageScheduler).do(this.arbiter);
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
}