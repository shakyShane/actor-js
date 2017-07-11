const {Observable} = require('rxjs');
const ajs = require('./');
const request = require('request');
const r = Observable.bindNodeCallback(request);


const Catalog = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
        this.children = [];
    }
    postStart() {
        this.children = [
            this.context.actorOf(Attributes),
            this.context.actorOf(CategoryList),
        ];
    }
    receive(payload, message, sender) {
        if (payload.type === 'update') {
            ajs.patterns.askMany(this.children, {type: 'get'})
                .subscribe(x => {
                    sender.reply(x);
                })
        }
    }
};

const Attributes = function (address, context) {
    return {
        methods: {
            'get': function(stream) {
                return stream.switchMap(({action, respond}) => {
                    return r('http://info.sunspel.com/wp-json/posts')
                        .map(([_, body]) => body)
                        .map(respond);
                });
            }
        },
        patterns: ['reduxObservable']
    }
};

const CategoryList = function (address, context) {
    return {
        methods: {
            'get': function(stream) {
                return stream.switchMap(({action, respond}) => {
                    return r('http://info.sunspel.com/wp-json/posts')
                        .map(([_, body]) => body)
                        .map(respond);
                });
            }
        },
        patterns: ['reduxObservable']
    }
};

const system = ajs.createSystem();
const catalog = system.actorOf(Catalog);

catalog
    .ask({type: 'update'})
    .subscribe((reply) => {
        console.log(reply);
    });
