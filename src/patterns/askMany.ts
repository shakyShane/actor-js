import {Observable, from} from "rxjs";
import {concatMap, toArray} from "rxjs/operators";
import {AskFnBound, IActorRef, IMessageResponse} from "../types";

export function askMany(actorRefs: IActorRef[], ask: AskFnBound, payload: any): Observable<IMessageResponse[]> {
    return from(actorRefs).pipe(
        concatMap((child): Observable<IMessageResponse> => {
            return ask(child, payload)
        })
        , toArray()
    )
}