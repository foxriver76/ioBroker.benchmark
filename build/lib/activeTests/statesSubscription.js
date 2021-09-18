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
            await this.addObjects(this.adapter.config.iterations, i);
        }
    }
    /**
     * The test itself
     */
    async execute() {
        this.adapter.subscribeForeignStates('benchmark.*');
        let counter = 0;
        return new Promise(resolve => {
            this.adapter.on('stateChange', () => {
                counter++;
                if (counter === 40000) {
                    resolve();
                }
            });
            for (let i = 1; i <= 4; i++) {
                // let it run in parallel
                this.addStates(this.adapter.config.iterations, i);
            }
        });
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete instances
        this.adapter.log.info('Deleting 4 instances');
        await this.removeInstances(4);
    }
}
exports.Test = Test;
//# sourceMappingURL=statesSubscription.js.map