import Rx = require('rx');
import Immutable = require('immutable');
import {createActor} from './createActor';
import {createStateActor} from './createStateActor';
import getMailbox from "./getMailbox";
import uuid = require('uuid/v4');
import debug = require('debug');
const logger = debug('staunch');

const log = (ns) => (message) => logger(`${ns}`, message);

// the send method is how actors post messages to each other
// it's guaranteed to happen in an async manner
// ask() sends a message asynchronously and returns a Future representing a possible reply. Also known as ask.
export function ask(action: IOutgoingMessage, id?: string, system?): Rx.Observable<any> {
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

export function createSystem() {
    // global register of available actors
    const register       = new Rx.BehaviorSubject({});
    // stream for actors to register upon
    const incomingActors = new Rx.Subject<Actor|StateActor>();
    // responses stream where actors can 'reply' via an id
    const responses      = new Rx.Subject<MessageResponse>();
    // an object containing all mailboxes
    const mailboxes      = new Rx.BehaviorSubject({});

    // create an arbiter for handling incoming messages
    const arbiter = new Rx.Subject();

    // Create a global register containing actors by name
    // this is for the
    incomingActors
        .scan(function (acc, item) {
            acc[item.name] = item;
            return acc;
        }, {}).subscribe(register);

    // for incoming actors, create a mailbox for each
    const actorsWithMailboxes = incomingActors
        .map(actor => {
            const mailbox = getMailbox(actor, actor.mailboxType, {arbiter, responses});
            return {
                mailbox,
                actor
            }
        }).share();

    actorsWithMailboxes.scan((acc, { actor, mailbox }) => {
        acc[actor.name] = mailbox;
        return acc;
    }, {}).subscribe(mailboxes);

    // for each registered mailbox, subscribe to
    // it's outgoing messages and pump the output
    // into the 'responses' stream
    actorsWithMailboxes.flatMap(x => {
        return x.mailbox.outgoing;
    })
        .subscribe(x => responses.onNext(x as any));

    // the arbiter takes all incoming messages throughout
    // the entire system and distributes them as needed into
    // the correct mailboxes
    arbiter
        .withLatestFrom(register, mailboxes, function ({action, id}, register, mailboxes) {
            const [ name ] = action.type.split('.');
            return {
                action,
                actor: register[name],
                mailbox: mailboxes[name],
                register,
                name,
                id
            }
        })
        .filter(x => {
            return x.actor && x.mailbox;
        })
        .do(x => {
            x.mailbox.incoming.onNext({action: x.action, id: x.id});
        })
        .subscribe();

    /**
     *
     */
    function incomingNamed(fn: (action, id, system) => void, actorName, system?): AskFn {
        return function (name: string, payload?: any, id?: string) {
            const action = {
                type: `${actorName}.${name}`,
                payload
            };
            return fn(action, id, system);
        }
    }

    /**
     *
     */
    function incoming(fn: (action, id, system) => void, actorName, system): AskFn {
        return function (payload?: any, id?: string) {
            const action = {
                type: `${actorName}`,
                payload
            };
            return fn(action, id, system);
        }
    }

    return {
        register(actor) {
            incomingActors.onNext(actor)
        },
        ask,
        tell,
        createStateActor: function(actorFactory): ActorRef {
            const stateActor = createStateActor(actorFactory);
            incomingActors.onNext(stateActor);
            const addresses = {
                methods: Object.keys(stateActor.methods),
                effects: Object.keys(stateActor.effects),
            };
            return {
                hasAddress(name: string): boolean {
                    return addresses.methods.indexOf(name) > -1
                        || addresses.effects.indexOf(name) > -1;
                },
                addresses,
                name: stateActor.name,
                ask: incomingNamed(ask, stateActor.name, {arbiter, responses}),
                tell: incomingNamed(tell, stateActor.name, {arbiter, responses}),
            }
        },
        actorOf(actorFactory) {
            const actor = createActor(actorFactory);
            incomingActors.onNext(actor);
            const actorRef = {
                name: actor.name,
                ask: incoming(ask, actor.name, {arbiter, responses}),
                tell: incoming(tell, actor.name, {arbiter, responses}),
            };
            return actorRef
        }
    }
}

export {
    createActor,
    createStateActor
};

