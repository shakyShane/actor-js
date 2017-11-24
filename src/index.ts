import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/merge";
import {Actor, createActor} from './createActor';
import {createStateActor} from './createStateActor';
import getMailbox from "./getMailbox";
import uuid = require('uuid/v4');
import debug = require('debug');
import {System} from "./System";
import {IScheduler} from "rxjs/Scheduler";
import {IActorFactory, SystemActor} from "./SystemActor";
import {IActorRegister, addActor, removeActor} from "./ActorRegister";
import {ActorRef} from "./ActorRef";
import {Subscription} from 'rxjs';
import {IActorContext} from './ActorContext';
const logger = debug('staunch');
import * as patterns from './patterns'
import {IncomingMessage, MessageResponse} from "./types";

const log = (ns) => (message) => logger(`${ns}`, message);

export interface ICreateOptions {
    messageScheduler?: IScheduler
    timeScheduler?: IScheduler
    factory?: IActorFactory
}

type RegisterFn = (register: {[index: string]: Actor}, IActor) => {[index: string]: Actor};

export function createSystem(opts: ICreateOptions = {}): System {

    const system = new System(opts);

    // Create a global actorRegister containing actors by address

    Observable.merge(
        system.incomingActors.map((incoming) => ({
            actor: incoming,
            fn: addActor as RegisterFn
        })),
        system.outgoingActors.map((incoming) => ({
            actor: incoming,
            fn: removeActor as RegisterFn
        })),
    )
        .scan(function (acc, {actor, fn}) {
            return fn(acc, actor);
        }, {} as IActorRegister)
        .subscribe(system.actorRegister);

    // for each registered mailbox, subscribe to
    // it's outgoing messages and pump the output
    // into the 'responses' stream
    system.incomingActors.flatMap((actor) => {
        return actor
            .mailbox
            .outgoing
            .do((incoming: MessageResponse) => {
                if (incoming.errors.length) {
                    const address = actor.address;
                    const factory = actor._factoryMethod;
                    return Observable.concat(
                        system.restartActor(actor),
                        system.removeActor(new ActorRef(actor.address, system)),
                        system.reincarnate(address, factory)
                    ).subscribe();
                }
            })
    })
        .subscribe(x => system.responses.next(x as any));

    // the arbiter takes all incoming messages throughout
    // the entire system and distributes them as needed into
    // the correct mailboxes
    system.arbiter
        .withLatestFrom(system.actorRegister, function ({message, messageID}, register) {
            const [ name ] = message.address.split('.');
            const actor = register[name];
            return {
                message,
                actor,
                mailbox: actor.mailbox,
                register,
                name,
                messageID
            }
        })
        .filter(x => {
            return x.actor && x.mailbox;
        })
        .do(x => {
            const incomingMessage : IncomingMessage = {message: x.message, messageID: x.messageID};
            x.mailbox.incoming.next(incomingMessage);
        })
        .subscribe();

    // register the /system actor
    system.actorOf(opts.factory || SystemActor, '/system');

    return system;
}

export {
    createActor,
    createStateActor,
    patterns,
};
