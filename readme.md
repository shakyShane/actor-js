# Actor Model in JS

> Exploring the potential benefits of implementing APIs in the *style* of the Actor Model, 
even in single-threaded programming environments such as Javascript.

## TODO

### Actor system `ActorSystem`

- [x] `createSystem()`
- [x] `system.actorOf(IActorFactory) -> ActorRef` 

### Actors `Actor`

- [x] `actor.tell()` - fire & forget message
- [x] `actor.ask()` - ask & await async response from an actor
- [ ] `actor.kill()` - send a message instructing an actor to terminate

### Actor context `ActorContext`
- [x] `context.stop(IActorRef)` - allow an actor to be stopped via a ref
- [x] `context.gracefulStop(IActorRef)` - allow an actor to be stopped via a ref with confirmation (for sequencing etc)
- [x] `context.actorOf(IActorFactory)` - allow an actor to create more actors
- [x] `context.parent` - allow an actor to access it's parent (in order to send it messages)
- [x] `context.self` - allow an actor to access it's own ref (in order to send its self messages)
- [ ] `context.become(newHandler)` - designate a new handler for future messages [http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop](http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop)
- [x] `context.actorSelection(lookup: string)` - allow actor lookups via paths, such as `/system` `/deadletter` etc

### Actor receive method
- [x] `receive(payload, message, sender)`
- [x] `sender.reply()` for replying directly to a message
    ```js
    receive (payload message sender)
      switch payload
        case 'ping' sender.reply 'pong'
        default sender.reply 'missing'
      
    // callsite
    actor.ask 'ping'
      |> resp console.log 'resp:' + resp
    ```
    
### Actor Lifecycle

- `actorOf(...)`
    - [x] path is reserved
    - [ ] uuid is assigned
    - [x] actor instance is created
    - [x] preStart is called on instance
    
- Incarnation (restarting)
    - [ ] preRestart called on old instance
    - [ ] new instance replaces old
    - [ ] postRestart called on new instance
    
- `Stop`, `context.stop()` or `PoisonPill`
    - [x] postStop is called on instance
    - [x] actor is removed from the internal system register
    - [ ] `Terminated` is sent to watchers
    - [x] path is free to be used again
    
- graceful stop [http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop](http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop)
    - [ ] `become()` - designate a new handler for future messages
    
### Actor References, Paths and Addresses

- [x] `actorOf()` only ever creates a new actor, and it creates it as a direct child of the context 
    on which this method is invoked (which may be any actor or actor system).
- [ ] `/deadletters` all messages sent to stopped or non-existing actors are re-routed here 
- [x] `/system` is the guardian actor for all system-created top-level actors, e.g. logging 
    listeners or actors automatically deployed by configuration at the start of the actor system.