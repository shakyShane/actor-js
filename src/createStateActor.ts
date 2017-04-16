import uuid = require('uuid/v4');
import Rx = require('rx');

export function createStateActor(input: IncomingStateActor): StateActor {
    const name    = input.name || uuid();
    const effects = input.effects || {};
    const methods = input.methods || {};

    return {
        ...input,
        name,
        effects,
        methods,
        mailboxType: 'state'
    };
}