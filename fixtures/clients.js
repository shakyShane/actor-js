module.exports.create = class {
    constructor(address, context) {
        this.address = address;
        this.context = context;
    }

    postStart() {
        // console.log('clients actor started');
    }

    receive(payload) {
        console.log(payload);
    }
}