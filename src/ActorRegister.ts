import {Actor} from "./createActor";

export interface IActorRegister {
    [address: string]: Actor
}

export function addActor(register: IActorRegister, actor: Actor): IActorRegister {
    register[actor.address] = actor;
    return register;
}

export function removeActor(register: IActorRegister, actor: ActorRef): IActorRegister {
    return Object.keys(register).reduce((acc, key) => {
        if (key === actor.address) {
            return acc;
        }
        acc[key] = register[key];
        return acc;
    }, {} as IActorRegister);
}