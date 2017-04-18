import {Observable} from 'rxjs/Observable';
import {Effect} from "./System";
import {Mailbox} from "./getMailbox";
import {StateActor} from "./createActor";
import {Subject} from "rxjs/Subject";

// A state mailbox knows how to automatically
// map incoming messages
// onto sync/async methods
// 'methods' return values immediately
// 'effects' return more messages
export function createStateMailbox(actor: StateActor): Mailbox {

    const incomingMessages = new Subject<IncomingMessage>();

    const outgoing = incomingMessages
        .flatMap((incomingMessage: IncomingMessage) => {

            const [_, method]  = incomingMessage.action.type.split('.');
            const methodMatch  : Method = actor.methods ? actor.methods[method] : null;
            const effectMatch  : Effect = actor.effects ? actor.effects[method] : null;
            const missingMatch : Effect = actor.missing ? actor.missing : null;
            const effect       = (effectMatch || missingMatch);

            if (methodMatch) {
                const response = methodMatch.call(null, incomingMessage.action.payload, incomingMessage);
                return Observable.of({
                    response,
                    respId: incomingMessage.id
                });
            }

            if (effect) {

                const output = effect.call(null, incomingMessage.action.payload, incomingMessage);

                if (output.subscribe) {
                    return output
                        .map(output => {
                            return {
                                response: output,
                                respId: incomingMessage.id
                            }
                        })
                        .catch(e => {
                            console.error(actor.name, e.message);
                            return Observable.empty();
                        })
                } else {

                    return Observable.of(output)
                        .map(output => {
                            return {
                                response: output,
                                respId: incomingMessage.id
                            }
                        })
                        .catch((e): any => {
                            console.error(actor.name, e.message);
                            return Observable.empty();
                        })
                }
            }
        return Observable.empty();
    }).share();

    return {
        outgoing, 
        incoming: incomingMessages
    };
}
