export function createActor (input): Actor {
    return {
        ...input,
        mailboxType: 'default'
    };
}