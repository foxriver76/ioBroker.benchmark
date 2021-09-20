"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tests = void 0;
const setStates_1 = require("./activeTests/setStates");
const statesSubscription_1 = require("./activeTests/statesSubscription");
const statesDeletion_1 = require("./activeTests/statesDeletion");
const idle_1 = require("./activeTests/idle");
const objectsCreation_1 = require("./activeTests/objectsCreation");
const setStatesNonStrict_1 = require("./activeTests/setStatesNonStrict");
exports.tests = {
    setStates: setStates_1.Test,
    statesSubscription: statesSubscription_1.Test,
    statesDeletion: statesDeletion_1.Test,
    idle: idle_1.Test,
    objectsCreation: objectsCreation_1.Test,
    setStatesNonStrict: setStatesNonStrict_1.Test
};
//# sourceMappingURL=allTests.js.map