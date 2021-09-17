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
    async addInstances(nInstances) {
        for (let i = 1; i <= nInstances; i++) {
            await (0, promisify_child_process_1.exec)(`iobroker add benchmark ${i} --enabled false`);
            const instObj = await this.adapter.getForeignObjectAsync(`system.adapter.benchmark.${i}`);
            if (!instObj) {
                throw new Error(`Invalid instance object for system.adapter.benchmark.${i}`);
            }
            await this.adapter.setForeignObjectAsync(`system.adapter.benchmark.${i}`, instObj);
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
}
exports.TestUtils = TestUtils;
//# sourceMappingURL=testClass.js.map