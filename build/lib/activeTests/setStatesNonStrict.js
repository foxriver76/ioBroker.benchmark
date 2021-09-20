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
        await this.addObjects(this.adapter.config.iterations, 0);
        // deactivate strict object checks
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.adapter.performStrictObjectChecks = false;
    }
    /**
     * The test itself
     */
    async execute() {
        // set states
        await this.addStates(this.adapter.config.iterations, 0);
    }
    /**
     * Clean up the db, remove insatnces, etc.
     */
    async cleanUp() {
        // delete states
        await this.delStates(this.adapter.config.iterations, 0);
        // delete objects
        await this.delObjects(this.adapter.config.iterations, 0);
    }
}
exports.Test = Test;
//# sourceMappingURL=setStatesNonStrict.js.map