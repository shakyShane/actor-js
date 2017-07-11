import {Observable} from "rxjs/Observable";

export function askMany(actorRefs: ActorRef[], payload): Observable<MessageResponse[]> {
    return Observable.from(actorRefs)
        .concatMap(child => {
            return child.ask(payload)
        })
        .toArray();
}