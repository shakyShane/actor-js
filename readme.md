# IActor Model in JS

> Exploring the potential benefits of implementing APIs in the *style* of the IActor Model, 
even in single-threaded programming environments such as Javascript.

## TODO

### IActor system `ActorSystem`

- [x] `createSystem()`
- [x] `system.actorOf(factory)` -> `system.actorOf(factory)`

### Actors `IActor`

- [x] `actor.tell()` - fire & forget message
- [x] `actor.ask()` - ask & await async response from an actor
- [ ] `actor.kill()` - send a message instructing the actor to terminate

### IActor context `ActorContext`
- [ ] `context.stopSelf()` - allow an actor to stop itself
- [ ] `context.stopChild(childRef)` - allow an actor to tear down a child
- [x] `context.actorOf(childRef)` - allow an actor to create more actors
- [ ] `context.become(newHandler)` - designate a new handler for future messages [http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop](http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop)
- [x] `context.actorSelection(lookup)` - allow actor lookups via paths, such as `/system` `/deadletter` etc

### IActor receive method
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
    
### IActor Lifecycle

- `actorOf(...)`
    - [x] path is reserved
    - [ ] uuid is assigned
    - [x] actor instance is created
    - [x] preStart is called on instance
    
- Incarnation
    - [ ] new instance replaces old
    - [ ] postRestart called on new instance
    - [ ] postRestart called on old instance
    
- `Stop`, `context.stop()` or `PoisonPill`
    - [ ] postStop is called on instance
    - [ ] `Terminated` is sent to watchers
    - [ ] path is free to be used again
    
- graceful stop [http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop](http://doc.akka.io/docs/akka/current/scala/actors.html#Graceful_Stop)
    - [ ] `become()` - designate a new handler for future messages
    
### IActor References, Paths and Addresses

- [x] `actorOf()` only ever creates a new actor, and it creates it as a direct child of the context 
    on which this method is invoked (which may be any actor or actor system).
- [ ] `/deadletters` all messages sent to stopped or non-existing actors are re-routed here 
- [x] `/system` is the guardian actor for all system-created top-level actors, e.g. logging 
    listeners or actors automatically deployed by configuration at the start of the actor system.