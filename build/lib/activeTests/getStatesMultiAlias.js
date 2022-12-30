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
        // set objects and states
        await this.addAliasObjects(10000, 0);
        await this.addStates(10000, 0);
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
        // get states
        const ids = [];
        for (let i = 0; i < 10000; i++) {
            ids.push(`alias.0.__benchmark.${i}`);
        }
        for (let i = 0; i < this.adapter.config.iterations; i++) {
            // @ts-expect-error types are wrong
            await this.adapter.getForeignStatesAsync(ids);
        }
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
        await this.delAliasObjects(10000, 0);
    }
}
exports.Test = Test;
//# sourceMappingURL=getStatesMultiAlias.js.map