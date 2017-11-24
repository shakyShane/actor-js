import {Observable} from "rxjs/Observable";
import {ActorRef, MessageResponse} from "../types";

export function askMany(actorRefs: ActorRef[], payload: any): Observable<MessageResponse[]> {
    return Observable.from(actorRefs)
        .concatMap((child): Observable<MessageResponse> => {
            return child.ask(payload)
        })
        .toArray();
}