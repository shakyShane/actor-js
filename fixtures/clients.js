module.exports.create = function () {
    return {
        postStart() {
            console.log('clients actor started');
        },
        receive(payload) {
            console.log(payload);
        }
    }
}