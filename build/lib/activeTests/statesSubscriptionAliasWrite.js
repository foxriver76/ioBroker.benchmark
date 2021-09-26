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
            // we need at least adapter.config.iterations states to fullfil our subscription, set them with alias write
            await this.addAliasObjects(Math.ceil(this.adapter.config.iterations / 4), i, '', false, true, (i - 1) * Math.ceil(this.adapter.config.iterations / 4));
        }
        // we subscribe to the original states, not the alias
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
                // we are adding normal states
                await this.addAliasStates(Math.ceil(this.adapter.config.iterations / 4), i, '', (i - 1) * Math.ceil(this.adapter.config.iterations / 4));
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
            await this.delStates(Math.ceil(this.adapter.config.iterations / 4), i, '', (i - 1) * Math.ceil(this.adapter.config.iterations / 4));
        }
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        await this.adapter.unsubscribeForeignStatesAsync('benchmark.*');
        // delete alias objects
        for (let i = 1; i <= 4; i++) {
            await this.delAliasObjects(Math.ceil(this.adapter.config.iterations / 4), i, '', (i - 1) * Math.ceil(this.adapter.config.iterations / 4));
        }
        // delete instances
        this.adapter.log.info('Deleting 4 instances');
        await this.removeInstances(4);
    }
}
exports.Test = Test;
//# sourceMappingURL=statesSubscriptionAliasWrite.js.map