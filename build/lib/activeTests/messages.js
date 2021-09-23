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
        // add instance to send message to
        await this.addInstances(1);
    }
    /**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
    async prepareBetweenEpoch() {
        // we are just sending meassages
    }
    /**
     * The test itself
     */
    async execute() {
        // get states
        await this.sendMessages(this.adapter.config.iterations, 1);
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // we have just sent meassages
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete the instance
        await this.removeInstances(1);
    }
}
exports.Test = Test;
//# sourceMappingURL=messages.js.map