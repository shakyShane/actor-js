import {BehaviorSubject, Observable} from "rxjs";
import {filter, withLatestFrom} from "rxjs/operators";
import {ActorRef} from "./ActorRef";
import {IActor} from "./createActor";
import {createDefaultMailbox} from "./createDefaultMailbox";

import {IRespondableStream} from "./patterns/mapped-methods";
import {IncomingMessage} from "./types";

export function warnInvalidActorRef() {
    throw new Error("Invalid actor provided. Please check your usage");
}

export function isActorRef(input: any) {
    if (!input) {
        // anything falsey
        return false;
    }
    if (typeof input.address === "string") {
        return true;
    }
    return false;
}

export function filterByType(stream: Observable<IncomingMessage>, type: string): Observable<IncomingMessage> {
    return stream.pipe(
        filter((msg: IncomingMessage) => {
            const { address, action } = msg.message;
            return action.type === type;
        }),
    );
}

export function addResponse(stream: Observable<any>,
                            state$: BehaviorSubject<any>): IRespondableStream {
    if (!state$) {
        state$ = new BehaviorSubject(undefined);
    }
    return stream.pipe(
        withLatestFrom(state$, (msg: IncomingMessage, state) => {
            const { address, action, contextCreator } = msg.message;
            const sender = new ActorRef(contextCreator);
            return {
                payload: action.payload,
                respond: (resp: any, stateUpdate?: any) => {
                    return Object.assign({}, msg, {resp, state: stateUpdate});
                },
                sender,
                state,
                type: action.type,
            };
        }),
    );
}

export function getParentRef(address: string): ActorRef {
    const parentAddress = address.split("/").slice(0, -1);
    return new ActorRef(parentAddress.join("/"));
}

export function decorateActor(actor: IActor, address: string, factory: any) {

    actor.mailbox = createDefaultMailbox(actor);

    actor._factoryMethod = factory;

    if (!actor.address) {
        actor.address = address;
    }

    return actor;
}
