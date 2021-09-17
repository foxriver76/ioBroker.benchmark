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
        // set objects
        for (let i = 0; i < this.adapter.config.iterations; i++) {
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
    /**
     * The test itself
     */
    async execute() {
        // set states
        for (let i = 0; i < this.adapter.config.iterations; i++) {
            await this.adapter.setStateAsync(`test.${i}`, i, true);
        }
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete states
        for (let i = 0; i < this.adapter.config.iterations; i++) {
            await this.adapter.delStateAsync(`test.${i}`);
        }
        // delete objects
        for (let i = 0; i < this.adapter.config.iterations; i++) {
            await this.adapter.delObjectAsync(`test.${i}`);
        }
    }
}
exports.Test = Test;
//# sourceMappingURL=statesCreation.js.map