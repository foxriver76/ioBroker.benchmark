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
        // set objects
        await this.addObjects(this.adapter.config.iterations, 0);
        // deactivate strict object checks
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.adapter.performStrictObjectChecks = false;
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
        // set states
        await this.addStates(this.adapter.config.iterations, 0);
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // del only states
        await this.delStates(this.adapter.config.iterations, 0);
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete objects and states
        await this.delObjects(this.adapter.config.iterations, 0);
    }
}
exports.Test = Test;
//# sourceMappingURL=setStatesNonStrict.js.map