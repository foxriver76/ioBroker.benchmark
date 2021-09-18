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