module.exports.create = function() {
    return {
        name: 'ClientActions',
        receive(payload, message, sender) {
            console.log(payload, sender);
        }
    }
};