import {Observable, from} from "rxjs";
import {concatMap, toArray} from "rxjs/operators";
import {IActorRef, IMessageResponse} from "../types";

export function askMany(actorRefs: IActorRef[], payload: any): Observable<IMessageResponse[]> {
    return from(actorRefs).pipe(
        concatMap((child): Observable<IMessageResponse> => {
            return child.ask(payload)
        })
        , toArray()
    )
}