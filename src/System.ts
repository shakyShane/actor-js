import {Actor, createActor, StateActor} from "./createActor";
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
        // responses stream where actors can 'reply' via an id
        this.responses      = new Subject<MessageResponse>();
        // an object containing all mailboxes
        this.mailboxes      = new BehaviorSubject({});
        // create an arbiter for handling incoming messages
        this.arbiter        = new Subject<IncomingMessage>();
        //
        this.messageScheduler = opts.messageScheduler || asyncScheduler;
    }

    actorOf(actorFactory: any, path?: string) {
        if (!path) {
            path = uuid();
        }

        const _self = this;

        const actorAddress = (() => {
            if (path.indexOf('/system') === -1) {
                return [this.address, path].join('/');
            }
            return path;
        })();

        const context = {
            actorOf(factory, path?) {
                const prefix = actorAddress;
                if (!path) {
                    path = uuid();
                }
                return _self.actorOf(factory, [prefix, path].join('/'));
            }
        };

        const actor = createActor(actorFactory, actorAddress, context);
        this.incomingActors.next(actor);
        const actorRef = new ActorRef(actor.address, this.getActorRefContext(actor));
        return actorRef;
    }
    getActorRefContext(actor: Actor) {
        return {
            ask: this.ask.bind(this),
            tell: this.tell.bind(this)
        }
    }

    /**
     * the ask method is how actors post messages to each other
     * it's guaranteed to happen in an async manner
     * ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
     * @param action
     * @param id
     */
    ask(action: IOutgoingMessage, id?: string): Observable<any> {
        if (!id) id = uuid();

        const trackResponse = this.responses
            .filter(x => x.respId === id)
            .do(log('ask resp <-'))
            .map(x => x.response)
            .take(1);

        const messageSender = Observable
            .of({action, id}, this.messageScheduler)
            .do(log('ask outgoing ->'))
            .do(message => this.arbiter.next(message));

        return Observable.zip(trackResponse, messageSender, (resp) => resp);
    }

    /**
     * tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
     */
    tell(action: IOutgoingMessage, id?: string): Observable<any> {
        return Observable.of({action, id}, this.messageScheduler).do(this.arbiter);
    }
}