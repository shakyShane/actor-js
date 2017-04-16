import Rx = require('rx');
import {createDefaultMailbox} from "./createDefaultMailbox";
import {createStateMailbox} from "./createStateMailbox";

export default function getMailbox(actor, type: MailboxType, system): Mailbox {
    if (type === 'default') {
        return createDefaultMailbox(actor, system);
    }
    // if (type === 'state') {
    //     return createStateMailbox(actor, system);
    // }
}