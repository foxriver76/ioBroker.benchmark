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
        // this time objects does not need to match iterations and scaling both will mess up comparison
        const noAllObjects = 10000;
        // set objects half half
        const noEqualObjects = Math.round(noAllObjects * 0.5);
        await this.addObjects(noEqualObjects, 0);
        await this.addMetaObjects(noEqualObjects);
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
        // get object views
        for (let i = 0; i < this.adapter.config.iterations; i++) {
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
        const noAllObjects = 10000;
        const noObjects = Math.round(noAllObjects * 0.5);
        // delete objects
        await this.delObjects(noObjects, 0);
        await this.delMetaObjects(noObjects);
    }
}
exports.Test = Test;
//# sourceMappingURL=objectViewEqual.js.map