"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const testClass_1 = require("../testClass");
class Test extends testClass_1.TestUtils {
    constructor(adapter) {
        super(adapter);
    }
    /**
     * Everything to setup the test but does not need to be measured
     */
    async prepare() {
        // create instances
        this.adapter.log.info('Adding 4 instances');
        await this.addInstances(4);
        // TODO: send message to each instance to create the objects for the states
        for (let i = 1; i <= 4; i++) {
            await this.adapter.sendToAsync(`benchmark.${i}`, 'objects', { cmd: 'set', n: this.adapter.config.iterations });
        }
    }
    /**
     * The test itself
     */
    async execute() {
        this.adapter.subscribeForeignStates('benchmark.*');
        for (let i = 1; i <= 4; i++) {
            await this.adapter.sendToAsync(`benchmark.${i}`, 'states', { cmd: 'set', n: this.adapter.config.iterations });
        }
        // TODO: subsribe and send messages to all instances
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete instances
        this.adapter.log.info('Deleting 4 instances');
        await this.removeInstances(4);
    }
}
exports.Test = Test;
//# sourceMappingURL=statesSubscription.js.map