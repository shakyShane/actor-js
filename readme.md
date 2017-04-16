# Actor Model in JS

> Exploring the potential benefits of implementing APIs in the *style* of the Actor Model, 
even in single-threaded programming environments such as Javascript.

## TODO

### Actor system `ActorSystem`

- [x] `createSystem()`
- [x] `system.actorOf(factory)` -> `system.actorOf(factory)`

### Actors `Actor`

- [x] `actor.tell()` - fire & forget message
- [x] `actor.ask()` - ask & await async response from an actor
- [ ] `actor.kill()` - send a message instructing the actor to terminate

### Actor context `ActorContext`
- [ ] `context.stopSelf()` - allow an actor to stop itself
- [ ] `context.stopChild(childRef)` - allow an actor to tear down a child
- [ ] `context.actorOf(childRef)` - allow an actor to create more actors

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
    - [ ] path is reserved
    - [ ] uuid is assigned
    - [ ] actor instance is created
    - [ ] prestart is called on instance
    
- Incarnation
    - [ ] new instance replaces old
    - [ ] postRestart called on new instance
    - [ ] postRestart called on old instance
    
- `Stop`, `context.stop()` or `PoisonPill`
    - [ ] postStop is called on instance
    - [ ] `Terminated` is sent to watchers
    - [ ] path is allowed to be used again