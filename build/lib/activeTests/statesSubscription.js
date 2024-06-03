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
        // create instances
        this.adapter.log.info('Adding 4 instances');
        await this.addInstances(4);
        for (let i = 1; i <= 4; i++) {
            // we need at least adapter.config.iterations states to fulfill our subscription
            await this.addObjects(Math.ceil(this.adapter.config.iterations / 4), i);
        }
        // subscribe
        await this.adapter.subscribeForeignStatesAsync('benchmark.*');
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
        let counter = 0;
        return new Promise(async (resolve) => {
            const onStateChange = () => {
                counter++;
                if (counter === this.adapter.config.iterations) {
                    resolve();
                    this.adapter.removeListener('stateChange', onStateChange);
                }
            };
            this.adapter.on('stateChange', onStateChange);
            for (let i = 1; i <= 4; i++) {
                await this.startMeasuringForeignInstance(i);
                await this.addStates(Math.ceil(this.adapter.config.iterations / 4), i);
                await this.stopMeasuringForeignInstance(i);
            }
        });
    }
    /**
     * Clean up everything which has been set during the test, but obtain state after prepare step
     */
    async cleanUpBetweenEpoch() {
        // del only states on all instances
        for (let i = 1; i <= 4; i++) {
            await this.delStates(Math.ceil(this.adapter.config.iterations / 4), i);
        }
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        await this.adapter.unsubscribeForeignStatesAsync('benchmark.*');
        // delete instances
        this.adapter.log.info('Deleting 4 instances');
        await this.removeInstances(4);
    }
}
exports.Test = Test;
//# sourceMappingURL=statesSubscription.js.map