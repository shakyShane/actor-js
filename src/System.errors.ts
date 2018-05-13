import {Observable, throwError} from "rxjs";

export const errors = {
    InvalidActorRef:
        (x) => `The first argument should be an IActorRef, with at least an 'address' property, you provided ${x}`,
};

export function invalidActorRefError(ref) {
    return throwError(new Error(errors.InvalidActorRef(ref)));
}
