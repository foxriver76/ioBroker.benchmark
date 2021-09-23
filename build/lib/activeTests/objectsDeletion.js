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
        // create our objects locally
        await this.addObjects(this.adapter.config.iterations, 0);
    }
    /**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
    async prepareBetweenEpoch() {
        // objects have been deleted
        await this.prepare();
    }
    /**
     * The test itself
     */
    async execute() {
        // del objects
        await this.delObjects(this.adapter.config.iterations, 0);
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // nothing
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // already deleted ;-)
    }
}
exports.Test = Test;
//# sourceMappingURL=objectsDeletion.js.map