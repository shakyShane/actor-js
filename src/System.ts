import {Actor, createActor, StateActor} from "./createActor";
import {Observable} from 'rxjs/Observable';
import './rx';

import debug = require('debug');
import uuid = require('uuid/v4');
import {ActorRef} from "./ActorRef";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {async as asyncScheduler} from "rxjs/scheduler/async";
const logger = debug('staunch:System');
const log = (ns) => (message) => logger(`${ns}`, message);

export type Effect = (payload: any, message: IncomingMessage) => Observable<any>;

export class System {

    public actorRegister: BehaviorSubject<any>;
    public incomingActors: Subject<Actor|StateActor>;
    public responses: Subject<MessageResponse>;
    public mailboxes: BehaviorSubject<any>;
    public arbiter: Subject<IncomingMessage>;

    constructor() {
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
    }

    actorOf(actorFactory: any) {
        const actor = createActor(actorFactory);
        this.incomingActors.next(actor);
        const actorRef = new ActorRef(actor.name, this);
        return actorRef;
    }
}

// the send method is how actors post messages to each other
// it's guaranteed to happen in an async manner
// ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
export function ask(action: IOutgoingMessage, id?: string, system?: System): Observable<any> {
    if (!id) id = uuid();

    const trackResponse = system.responses
        .filter(x => x.respId === id)
        .do(log('ask resp <-'))
        .map(x => x.response)
        .take(1);

    const messageSender = Observable
        .of({action, id}, asyncScheduler)
        .do(log('ask outgoing ->'))
        .do(message => system.arbiter.next(message));

    return Observable.zip(trackResponse, messageSender, (resp) => resp);
}

/**
 * @param action
 * @param id
 * @return void
 */
// tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
export function tell (action: IOutgoingMessage, id?: string, system?): Observable<any> {
    if (!id) id = uuid();
    return Observable.of({action, id}, asyncScheduler).do(system.arbiter);
}