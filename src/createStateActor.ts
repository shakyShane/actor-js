import uuid = require("uuid/v4");
import {IncomingStateActor, IStateActor} from "./createActor";

export function createStateActor(input: IncomingStateActor): IStateActor {
    const name    = input.address || uuid();
    const effects = input.effects || {};
    const methods = input.methods || {};

    return {
        ...input,
        address: name,
        effects,
        mailboxType: "state",
        methods,
    };
}
