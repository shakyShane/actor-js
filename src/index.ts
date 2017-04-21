import {IActor, createActor} from './createActor';
import {createStateActor} from './createStateActor';
import getMailbox from "./getMailbox";
import uuid = require('uuid/v4');
import debug = require('debug');
import {System} from "./System";
import {Observable} from "rxjs/Observable";
import {IScheduler} from "rxjs/Scheduler";
import {ActorFactory, SystemActor} from "./SystemActor";
const logger = debug('staunch');

const log = (ns) => (message) => logger(`${ns}`, message);

export interface ICreateOptions {
    messageScheduler?: IScheduler
    factory?: ActorFactory
}

export function createSystem(opts: ICreateOptions = {}): System {

    const system = new System(opts);

    // Create a global actorRegister containing actors by address
    system.incomingActors
        .scan(function (acc, item) {
            acc[item.address] = item;
            return acc;
        }, <IActor>{}).subscribe(system.actorRegister);

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
        acc[actor.address] = mailbox;
        return acc;
    }, <IActor>{}).subscribe(system.mailboxes);

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
        .withLatestFrom(system.actorRegister, system.mailboxes, function ({action, messageID}, register, mailboxes) {
            const [ name ] = action.address.split('.');
            return {
                action,
                actor: register[name],
                mailbox: mailboxes[name],
                register,
                name,
                messageID
            }
        })
        .filter(x => {
            return x.actor && x.mailbox;
        })
        .do(x => {
            x.mailbox.incoming.next({action: x.action, messageID: x.messageID});
        })
        .subscribe();

    // register the /system actor
    system.actorOf(opts.factory || SystemActor, '/system');

    return system;
}

export {
    createActor,
    createStateActor
};

