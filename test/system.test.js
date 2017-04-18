const { assert } = require('chai');
const { createSystem } = require('../');

it('it exports the createSystem() function correctly', function () {
    assert.isFunction(createSystem);
});