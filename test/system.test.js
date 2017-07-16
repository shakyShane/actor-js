require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');

describe('system.actorOf', function() {

  it('it exports the createSystem() function correctly', function () {
      assert.isFunction(createSystem);
  });

  it('it can create a /system level actor', function () {
      const system = createSystem();
      const FileWatcher = class {
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
      const system = createSystem({
          messageScheduler: scheduler
      });
      const Watcher = class {
          constructor(address) {
              this.type        = 'Watcher';
              this.address = address;
          }
      };
      const FileWatcher = class {
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
      const actor = system.actorOf(FileWatcher, 'FileWatcher');
      assert.equal(actor.address, '/system/FileWatcher');
      actor.tell('init').subscribe();
      scheduler.flush();
      const register = system.actorRegister.getValue();
      assert.equal(register['/system/FileWatcher'].type, 'FileWatcher');
      assert.equal(register['/system/FileWatcher'].actors[0].address, '/system/FileWatcher/sub-path-01');
  });

  it('/system/actor -> child -> child', function () {
      const scheduler = new TestScheduler();
      const system = createSystem({
          messageScheduler: scheduler
      });
      const Watcher = class {
          constructor(address) {
              this.type        = 'Watcher';
              this.address = address;
          }
          receive(name) {
              assert.equal(name, 'Hey!');
          }
      };
      const FileWatcher = class {
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
                      this.actors[0].tell('Hey!').subscribe();
                  }
              }
          }
      };
      const actor = system.actorOf(FileWatcher, 'FileWatcher');
      assert.equal(actor.address, '/system/FileWatcher');
      actor.tell('init').subscribe();
      scheduler.flush();
      const register = system.actorRegister.getValue();
      assert.equal(register['/system/FileWatcher'].type, 'FileWatcher');
      assert.equal(register['/system/FileWatcher'].actors[0].address, '/system/FileWatcher/sub-path-01');
  });

  it('/system/actor -> child -> child -> child', function () {
      const scheduler = new TestScheduler();
      const system = createSystem({
          messageScheduler: scheduler
      });
      const GrandchildActor = class {
          constructor(address) {
              this.type        = 'GrandchildActor';
              this.address = address;
          }
          receive(name) {
              assert.equal(name, 'Hey from the grandchild!');
          }
      };
      const ChildActor = class {
          constructor(address, context) {
              this.type        = 'ChildActor';
              this.address = address;
              this.actors = [
                  context.actorOf(GrandchildActor)
              ];
              this.actors[0].tell('Hey from the grandchild!')
                  .subscribe();
          }
          receive(payload) {
              // console.log('Re'
          }
      };
      const SystemLevelActor = class {
          constructor(address, context) {
              this.type        = 'SystemLevelActor';
              this.address     = address;
              this.actors      = [];
              this.context     = context;
          }
          receive(payload) {
              switch(payload) {
                  case 'init':
                      this.actors.push(this.context.actorOf(ChildActor, 'sub-path-01'));
              }
          }
      };
      const actor = system.actorOf(SystemLevelActor, 'SystemLevelActor');
      assert.equal(actor.address, '/system/SystemLevelActor');
      actor.tell('init').subscribe();
      scheduler.flush();

      const register = system.actorRegister.getValue();
      assert.equal(register['/system/SystemLevelActor'].type, 'SystemLevelActor');
      assert.equal(register['/system/SystemLevelActor'].actors[0].address, '/system/SystemLevelActor/sub-path-01');
  });
});