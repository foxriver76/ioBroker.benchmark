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
        // set objects and states (alias with read function)
        await this.addAliasObjects(this.adapter.config.iterations, 0, '', true);
        await this.addStates(this.adapter.config.iterations, 0);
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
        // get states from alias
        await this.getStatesFromAlias(this.adapter.config.iterations);
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // states still there
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete objects and states
        await this.delAliasObjects(this.adapter.config.iterations, 0);
    }
}
exports.Test = Test;
//# sourceMappingURL=getStatesAliasRead.js.map