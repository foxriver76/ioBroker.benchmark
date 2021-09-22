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
        // nothing needed
    }
    /**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
    async prepareBetweenEpoch() {
        // nothing needed
    }
    /**
     * The test itself
     */
    async execute() {
        // set objects
        await this.addObjects(this.adapter.config.iterations, 0);
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // same as cleanup
        await this.cleanUp();
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete objects
        await this.delObjects(this.adapter.config.iterations, 0);
    }
}
exports.Test = Test;
//# sourceMappingURL=objectsCreation.js.map