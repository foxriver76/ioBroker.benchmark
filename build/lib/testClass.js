"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = void 0;
const promisify_child_process_1 = require("promisify-child-process");
class TestUtils {
    constructor(adapter) {
        this.adapter = adapter;
    }
    /**
     * Adds the desired number of instances in secondaryMode
     */
    async addInstances(nInstances, host) {
        for (let i = 1; i <= nInstances; i++) {
            await (0, promisify_child_process_1.exec)(`iobroker add benchmark ${i} --enabled false${host ? ` --host ${host}` : ''}`);
            const instObj = await this.adapter.getForeignObjectAsync(`system.adapter.benchmark.${i}`);
            if (!instObj) {
                throw new Error(`Invalid instance object for system.adapter.benchmark.${i}`);
            }
            instObj.common.enabled = true;
            instObj.native.secondaryMode = true;
            await this.adapter.setForeignObjectAsync(`system.adapter.benchmark.${i}`, instObj);
            // give controller some time to actually start the instance
            await this.wait(500);
        }
    }
    /**
     * Removes the desired number of instances
     */
    async removeInstances(nInstances) {
        for (let i = 1; i <= nInstances; i++) {
            await (0, promisify_child_process_1.exec)(`iobroker del benchmark.${i}`);
        }
    }
    /**
     * Add Objects at given instance
     *
     * @param n - number of objects to be added
     * @param instanceNumber - number of the benchmark instance to add objects at
     */
    async addObjects(n, instanceNumber) {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // set objects locally
            for (let i = 0; i < n; i++) {
                await this.adapter.setObjectAsync(`test.${i}`, {
                    'type': 'state',
                    'common': {
                        name: i.toString(),
                        read: true,
                        write: true,
                        role: 'state',
                        type: 'number'
                    },
                    native: {}
                });
            }
        }
        else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', { cmd: 'set', n: n });
        }
    }
    /**
     * Add States at given instance
     *
     * @param n - number of states to be added
     * @param instanceNumber - number of the benchmark instance to add states at
     */
    async addStates(n, instanceNumber) {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            for (let i = 0; i < n; i++) {
                await this.adapter.setStateAsync(`test.${i}`, i, true);
            }
        }
        else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', { cmd: 'set', n: n });
        }
    }
    /**
     *    Time to wait in ms
     */
    async wait(ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}
exports.TestUtils = TestUtils;
//# sourceMappingURL=testClass.js.map