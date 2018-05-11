import debug = require("debug");
import {concat, merge, Observable, Scheduler} from "rxjs";
import {filter, map, mergeMap, scan, tap, withLatestFrom} from "rxjs/operators";
import {IActorContext} from "./ActorContext";
import {ActorRef as ActorRefFn} from "./ActorRef";
import {addActor, removeActor} from "./ActorRegister";
import {Actor, createActor} from "./createActor";
import {createStateActor} from "./createStateActor";
import * as patterns from "./patterns";
import {IMethodStream, IRespondableStream} from "./patterns/mapped-methods";
import {System} from "./System";
import {IActorFactory, SystemActor} from "./SystemActor";
import {IActorRef, IMessageResponse, IncomingMessage} from "./types";
const logger = debug("aktor-js");

const log = (ns) => (message) => logger(`${ns}`, message);

export interface ICreateOptions {
    messageScheduler?: Scheduler;
    timeScheduler?: Scheduler;
    factory?: IActorFactory;
}

type RegisterFn = (register: {[index: string]: Actor}, IActor) => {[index: string]: Actor};

export function createSystem(opts: ICreateOptions = {}): System {

    const system = new System(opts);

    // Create a global actorRegister containing actors by address

    merge(
        system.incomingActors.pipe(map((incoming) => ({
            actor: incoming,
            fn: addActor as RegisterFn,
        }))),
        system.outgoingActors.pipe(map((incoming) => ({
            actor: incoming,
            fn: removeActor as RegisterFn,
        }))),
    ).pipe(
        scan((acc, {actor, fn}: {actor: Actor|IActorRef, fn: RegisterFn}) => {
            return fn(acc, actor);
        }, {}),
    )
        .subscribe(system.actorRegister);

    // for each registered mailbox, subscribe to
    // it's outgoing messages and pump the output
    // into the 'responses' stream
    system.incomingActors.pipe(mergeMap((actor) => {
        return actor
            .mailbox
            .outgoing
            .pipe(
                tap((incoming: IMessageResponse) => {
                    if (incoming.errors.length) {
                        const address = actor.address;
                        const factory = actor._factoryMethod;
                        return concat(
                            system.restartActor(actor),
                            system.removeActor(new ActorRefFn(actor.address, system)),
                            system.reincarnate(address, factory),
                        ).subscribe();
                    }
                }),
            );
    }))
        .subscribe((x) => system.responses.next(x as any));

    // the arbiter takes all incoming messages throughout
    // the entire system and distributes them as needed into
    // the correct mailboxes
    system.arbiter.pipe(
        withLatestFrom(system.actorRegister, ({message, messageID}, register) => {
            const [ name ] = message.address.split(".");
            const actor = register[name];
            return {
                message,
                actor,
                mailbox: actor.mailbox,
                register,
                name,
                messageID,
            };
        })
        , filter((x) => {
            return x.actor && x.mailbox;
        })
        , tap((x) => {
            const incomingMessage: IncomingMessage = {message: x.message, messageID: x.messageID};
            x.mailbox.incoming.next(incomingMessage);
        }),
    )
        .subscribe();

    // register the /system actor
    system.actorOf(opts.factory || SystemActor, "/system");

    return system;
}

export {
    createActor,
    createStateActor,
    patterns,
    IMessageResponse,
    IncomingMessage,
    IMethodStream,
    IActorContext,
    IRespondableStream,
    IActorRef,
    System,
    SystemActor,
};
