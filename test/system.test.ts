import {IActorContext, IActorRef} from "../src";

require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs/testing/TestScheduler');

describe('system.actorOf', function() {

  it('it exports the createSystem() function correctly', function () {
      assert.isFunction(createSystem);
  });

  it('it can create a /system level actor', function () {
      const system = createSystem();
      const FileWatcher = class {
          public type: string;
          public address: string;
          constructor(address) {
              this.type = 'FileWatcher';
              this.address = address;
          }
          receive() {
              // console.log('RECEIVE');
          }
      };
      const actor = system.actorOf(FileWatcher, 'FileWatcher');
      assert.equal(actor.address, '/system/FileWatcher');
  });

  it('/system -> child', function () {
      const scheduler = new TestScheduler();
      const {system, actorOf, tell} = createSystem({
          messageScheduler: scheduler
      });
      const Watcher = class {
          public type: string;
          public address: string;
          constructor(address) {
              this.type        = 'Watcher';
              this.address = address;
          }
      };
      const FileWatcher = class {
          public type: string;
          public address: string;
          public actors: IActorRef[];
          public context: IActorContext;
          constructor(address, context) {
              this.type        = 'FileWatcher';
              this.address     = address;
              this.actors      = [];
              this.context     = context;
          }
          receive(name) {
              switch(name) {
                  case 'init':
                      this.actors.push(
                          this.context.actorOf(Watcher, 'sub-path-01')
                      );
              }
          }
      };
      const actor = actorOf(FileWatcher, 'FileWatcher');
      assert.equal(actor.address, '/system/FileWatcher');
      tell(actor, 'init').subscribe();
      scheduler.flush();
      const register = system.actorRegister.getValue();
      assert.equal(register['/system/FileWatcher'].type, 'FileWatcher');
      assert.equal(register['/system/FileWatcher'].actors[0].address, '/system/FileWatcher/sub-path-01');
  });

  it('/system/actor -> child -> child', function () {
      const scheduler = new TestScheduler();
      const {system, actorOf, tell} = createSystem({
          messageScheduler: scheduler
      });
      const Watcher = class {
          public type: string;
          public address: string;
          constructor(address) {
              this.type    = 'Watcher';
              this.address = address;
          }
          receive(name) {
              assert.equal(name, 'Hey!');
          }
      };
      const FileWatcher = class {
          public type: string;
          public address: string;
          public actors: IActorRef[];
          public context: IActorContext;
          constructor(address, context) {
              this.type        = 'FileWatcher';
              this.address     = address;
              this.actors      = [];
              this.context     = context;
          }
          receive(name) {
              switch(name) {
                  case 'init': {
                      this.actors.push(
                          this.context.actorOf(Watcher, 'sub-path-01')
                      );
                      this.context.tell(this.actors[0], 'Hey!').subscribe();
                  }
              }
          }
      };
      const actor = actorOf(FileWatcher, 'FileWatcher');
      assert.equal(actor.address, '/system/FileWatcher');
      tell(actor, 'init').subscribe();
      scheduler.flush();
      const register = system.actorRegister.getValue();
      assert.equal(register['/system/FileWatcher'].type, 'FileWatcher');
      assert.equal(register['/system/FileWatcher'].actors[0].address, '/system/FileWatcher/sub-path-01');
  });

  it('/system/actor -> child -> child -> child', function () {
      const scheduler = new TestScheduler();
      const {system, actorOf, tell} = createSystem({
          messageScheduler: scheduler
      });
      const GrandchildActor = class {
          public type: string;
          public address: string;
          constructor(address) {
              this.type    = 'GrandchildActor';
              this.address = address;
          }
          receive(name) {
              assert.equal(name, 'Hey from the grandchild!');
          }
      };
      const ChildActor = class {
          public type: string;
          public address: string;
          public actors: IActorRef[];
          constructor(address, context) {
              this.type = 'ChildActor';
              this.address = address;
              this.actors = [
                  context.actorOf(GrandchildActor)
              ];
              context.tell(this.actors[0], 'Hey from the grandchild!').subscribe();
          }
          receive() {
              // console.log('Re'
          }
      };
      const SystemLevelActor = class {
          public type: string;
          public address: string;
          public actors: IActorRef[];
          public context: IActorContext;
          constructor(address, context) {
              this.type        = 'SystemLevelActor';
              this.address     = address;
              this.actors      = [];
              this.context     = context;
          }
          receive(payload) {
              switch(payload) {
                  case 'init': {
                      this.actors.push(this.context.actorOf(ChildActor, 'sub-path-01'));
                  }
              }
          }
      };
      const actor = actorOf(SystemLevelActor, 'SystemLevelActor');
      assert.equal(actor.address, '/system/SystemLevelActor');
      tell(actor, 'init').subscribe();
      scheduler.flush();

      const register = system.actorRegister.getValue();
      assert.equal(register['/system/SystemLevelActor'].type, 'SystemLevelActor');
      assert.equal(register['/system/SystemLevelActor'].actors[0].address, '/system/SystemLevelActor/sub-path-01');
  });
});