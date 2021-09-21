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
            // enable instance in secondaryMode
            const instObj = { common: { enabled: true }, native: { secondaryMode: true } };
            await this.adapter.extendForeignObjectAsync(`system.adapter.benchmark.${i}`, instObj);
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
     * @param prefix - prefix for ids
     */
    async addObjects(n, instanceNumber, prefix = '') {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // set objects locally
            for (let i = 0; i < n; i++) {
                await this.adapter.setObjectAsync(`test.${prefix}${i}`, {
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
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', { cmd: 'set', n, prefix });
        }
    }
    /**
     * Add States at given instance
     *
     * @param n - number of states to be added
     * @param instanceNumber - number of the benchmark instance to add states at
     * @param prefix - prefix for ids
     */
    async addStates(n, instanceNumber, prefix = '') {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            for (let i = 0; i < n; i++) {
                await this.adapter.setStateAsync(`test.${prefix}${i}`, i, true);
            }
        }
        else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', { cmd: 'set', n, prefix });
        }
    }
    /**
     * Delete staes at given instance
     *
     * @param n - number of states to be deleted
     * @param instanceNumber - number of the benchmark instance to delete states from
     * @param prefix - prefix for ids
     */
    async delStates(n, instanceNumber, prefix = '') {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // local
            for (let i = 0; i < n; i++) {
                await this.adapter.delStateAsync(`test.${prefix}${i}`);
            }
        }
        else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'states', { cmd: 'del', n, prefix });
        }
    }
    /**
     * Delete objects (and states) at given instance
     *
     * @param n - number of objects to be deleted
     * @param instanceNumber - number of the benchmark instance to delete objects from
     * @param prefix - prefix for ids
     */
    async delObjects(n, instanceNumber, prefix = '') {
        if (this.adapter.namespace === `benchmark.${instanceNumber}`) {
            // local
            for (let i = 0; i < n; i++) {
                await this.adapter.delObjectAsync(`test.${prefix}${i}`);
            }
        }
        else {
            await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'objects', { cmd: 'del', n, prefix });
        }
    }
    /**
     * Start measuring a foreign instance to (eventLoopLag, ram, cpu)
     *
     * @param instanceNumber - number of the benchmark instance to add states at
     */
    async startMeasuringForeignInstance(instanceNumber) {
        await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'startMeasuring', {});
    }
    /**
     * Stop measuring a foreign instance to (eventLoopLag, ram, cpu)
     *
     * @param instanceNumber - number of the benchmark instance to add states at
     */
    async stopMeasuringForeignInstance(instanceNumber) {
        await this.adapter.sendToAsync(`benchmark.${instanceNumber}`, 'stopMeasuring', {});
    }
    /**
     * Time to wait in ms
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