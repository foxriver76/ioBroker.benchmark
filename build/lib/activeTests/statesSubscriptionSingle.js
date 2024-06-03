"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const testClass_1 = require("../testClass");
class Test extends testClass_1.TestUtils {
    constructor(adapter) {
        super(adapter);
        /** Number of secondaries to use */
        this.NO_SECONDARIES = 10;
    }
    /**
     * Everything to setup the test but does not need to be measured
     */
    async prepare() {
        // create instances
        this.adapter.log.info(`Adding ${this.NO_SECONDARIES} instances`);
        await this.addInstances(this.NO_SECONDARIES);
        await this.addObjects(this.adapter.config.iterations, 0);
        for (let i = 1; i <= this.NO_SECONDARIES; i++) {
            await this.subscribeStates(this.adapter.config.iterations, i);
        }
    }
    /**
     * Prepare step between epochs, set up stuff which has been removed during the test
     */
    async prepareBetweenEpoch() {
        // nothing needed instances are still there with objects
    }
    /**
     * The test itself
     */
    async execute() {
        /** Array of promises for the single instances subscriptions */
        const promises = [];
        for (let i = 1; i <= this.NO_SECONDARIES; i++) {
            await this.startMeasuringForeignInstance(i);
            promises.push(this.waitForStatePublish(this.adapter.config.iterations, i));
        }
        await this.addStates(this.adapter.config.iterations, 0);
        // wait until all instances have received all publishes
        await Promise.all(promises);
        for (let i = 1; i <= this.NO_SECONDARIES; i++) {
            await this.stopMeasuringForeignInstance(i);
        }
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // not needed
    }
    /**
     * Clean up the db, remove instances, etc.
     */
    async cleanUp() {
        // delete instances
        this.adapter.log.info(`Deleting ${this.NO_SECONDARIES} instances`);
        await this.removeInstances(this.NO_SECONDARIES);
    }
}
exports.Test = Test;
//# sourceMappingURL=statesSubscriptionSingle.js.map