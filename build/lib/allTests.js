"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tests = void 0;
const statesCreation_1 = require("./activeTests/statesCreation");
const statesSubscription_1 = require("./activeTests/statesSubscription");
const statesDeletion_1 = require("./activeTests/statesDeletion");
const idle_1 = require("./activeTests/idle");
exports.tests = {
    statesCreation: statesCreation_1.Test,
    statesSubscription: statesSubscription_1.Test,
    statesDeletion: statesDeletion_1.Test,
    idle: idle_1.Test
};
//# sourceMappingURL=allTests.js.map