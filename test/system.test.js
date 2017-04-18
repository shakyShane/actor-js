require('source-map-support').install();
const { assert } = require('chai');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');

it('it exports the createSystem() function correctly', function () {
    assert.isFunction(createSystem);
});

it('it can create a /system level actor', function () {
    const system = createSystem();
    const FileWatcher = class {
        constructor(address) {
            this.type = 'FileWatcher';
            this.mailboxType = 'default';
            this.address = address;
        }
        receive() {
            console.log('RECEIVE');
        }
    };
    const actor = system.actorOf(FileWatcher, 'FileWatcher');
    assert.equal(actor.address, '/system/FileWatcher');
});

it('actor can create a child actor', function () {
    const scheduler = new TestScheduler();
    const system = createSystem({
        messageScheduler: scheduler
    });
    const Watcher = class {
        constructor(address) {
            this.type        = 'Watcher';
            this.mailboxType = 'default';
            this.address = address;
        }
    };
    const FileWatcher = class {
        constructor(address, context) {
            this.type        = 'FileWatcher';
            this.mailboxType = 'default';
            this.address     = address;
            this.actors      = [];
            this.context     = context;
        }
        receive(payload) {
            switch(payload) {
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