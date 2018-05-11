import {Observable, from} from "rxjs";
import {concatMap, toArray} from "rxjs/operators";
import {ActorRef, MessageResponse} from "../types";

export function askMany(actorRefs: ActorRef[], payload: any): Observable<MessageResponse[]> {
    return from(actorRefs).pipe(
        concatMap((child): Observable<MessageResponse> => {
            return child.ask(payload)
        })
        , toArray()
    )
}