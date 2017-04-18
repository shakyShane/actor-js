import uuid = require('uuid/v4');
import {IncomingStateActor, StateActor} from "./createActor";

export function createStateActor(input: IncomingStateActor): StateActor {
    const name    = input.address || uuid();
    const effects = input.effects || {};
    const methods = input.methods || {};

    return {
        ...input,
        address: name,
        effects,
        methods,
        mailboxType: 'state'
    };
}