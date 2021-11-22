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
        // we create 98 % irrelevant objects
        const noMetaObjs = Math.round(this.adapter.config.iterations * 0.98);
        await this.addObjects(this.adapter.config.iterations - noMetaObjs, 0);
        await this.addMetaObjects(noMetaObjs);
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
        // get 10k object views hard, iterations will only change number of objects
        for (let i = 0; i < 10000; i++) {
            await this.adapter.getObjectViewAsync('system', 'state', {
                startkey: 'benchmark.0.test',
                endkey: 'benchmark.0.test\u9999'
            });
        }
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // we are fine
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete objects
        const noMetaObjs = Math.round(this.adapter.config.iterations * 0.98);
        await this.delObjects(this.adapter.config.iterations - noMetaObjs, 0);
        await this.delMetaObjects(noMetaObjs);
    }
}
exports.Test = Test;
//# sourceMappingURL=objectViewSmall.js.map