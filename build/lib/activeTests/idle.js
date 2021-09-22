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
        // nada
    }
    /**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
    async prepareBetweenEpoch() {
        // nothing
    }
    /**
     * The test itself
     */
    async execute() {
        // chilling a bit idle here to collect some measurements
        await this.wait(this.adapter.config.iterations);
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // nothing needed ;-)
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // still nothing
    }
}
exports.Test = Test;
//# sourceMappingURL=idle.js.map