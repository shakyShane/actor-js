import {createActor} from "./createActor";
import Rx = require('rx');
import debug = require('debug');
import uuid = require('uuid/v4');
import {ActorRef} from "./ActorRef";
const logger = debug('staunch:System');
const log = (ns) => (message) => logger(`${ns}`, message);

export class System {

    public actorRegister: Rx.BehaviorSubject<any>;
    public incomingActors: Rx.Subject<Actor|StateActor>;
    public responses: Rx.Subject<MessageResponse>;
    public mailboxes: Rx.BehaviorSubject<any>;
    public arbiter: Rx.Subject<IncomingMessage>;

    constructor() {
        // global actorRegister of available actors
        this.actorRegister  = new Rx.BehaviorSubject({});
        // stream for actors to actorRegister upon
        this.incomingActors = new Rx.Subject<Actor|StateActor>();
        // responses stream where actors can 'reply' via an id
        this.responses      = new Rx.Subject<MessageResponse>();
        // an object containing all mailboxes
        this.mailboxes      = new Rx.BehaviorSubject({});
        // create an arbiter for handling incoming messages
        this.arbiter        = new Rx.Subject<IncomingMessage>();
    }

    actorOf(actorFactory: any) {
        const actor = createActor(actorFactory);
        this.incomingActors.onNext(actor);
        const actorRef = new ActorRef(actor.name, this);
        return actorRef;
    }
}

// the send method is how actors post messages to each other
// it's guaranteed to happen in an async manner
// ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
export function ask(action: IOutgoingMessage, id?: string, system?: System): Rx.Observable<any> {
    if (!id) id = uuid();

    const trackResponse = system.responses
        .filter(x => x.respId === id)
        .do(log('ask resp ->'))
        .map(x => x.response)
        .take(1);

    const messageSender = Rx.Observable
        .just({action, id}, Rx.Scheduler.default)
        .do(log('ask ->'))
        .do(message => system.arbiter.onNext(message));

    return Rx.Observable.zip(trackResponse, messageSender, (resp) => resp);
}

/**
 * @param action
 * @param id
 * @return void
 */
// tell() means “fire-and-forget”, e.g. send a message asynchronously and return immediately. Also known as tell.
export function tell (action: IOutgoingMessage, id?: string, system?): Rx.Observable<any> {
    if (!id) id = uuid();
    return Rx.Observable.just({action, id}, Rx.Scheduler.default).do(system.arbiter);
}