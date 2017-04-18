import {Actor, createActor} from './createActor';
import {createStateActor} from './createStateActor';
import getMailbox from "./getMailbox";
import uuid = require('uuid/v4');
import debug = require('debug');
import {System} from "./System";
import {Observable} from "rxjs/Observable";
const logger = debug('staunch');

const log = (ns) => (message) => logger(`${ns}`, message);

export function createSystem(): System {

    const system = new System();

    // Create a global actorRegister containing actors by name
    // this is for the
    system.incomingActors
        .scan(function (acc, item) {
            acc[item.name] = item;
            return acc;
        }, <Actor>{}).subscribe(system.actorRegister);

    // for incoming actors, create a mailbox for each
    const actorsWithMailboxes = system.incomingActors
        .map(actor => {
            const mailbox = getMailbox(actor, actor.mailboxType, system);
            return {
                mailbox,
                actor
            }
        }).share();

    actorsWithMailboxes.scan((acc, { actor, mailbox }) => {
        acc[actor.name] = mailbox;
        return acc;
    }, <Actor>{}).subscribe(system.mailboxes);

    // for each registered mailbox, subscribe to
    // it's outgoing messages and pump the output
    // into the 'responses' stream
    actorsWithMailboxes.flatMap(x => {
        return x.mailbox.outgoing;
    }).subscribe(x => system.responses.next(x as any));

    // the arbiter takes all incoming messages throughout
    // the entire system and distributes them as needed into
    // the correct mailboxes
    system.arbiter
        .withLatestFrom(system.actorRegister, system.mailboxes, function ({action, id}, register, mailboxes) {
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
            x.mailbox.incoming.next({action: x.action, id: x.id});
        })
        .subscribe();

    return system;
}

export {
    createActor,
    createStateActor
};

