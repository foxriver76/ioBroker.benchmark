"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tests = void 0;
const setStates_1 = require("./activeTests/setStates");
const statesSubscription_1 = require("./activeTests/statesSubscription");
const statesDeletion_1 = require("./activeTests/statesDeletion");
const idle_1 = require("./activeTests/idle");
const objectsCreation_1 = require("./activeTests/objectsCreation");
const setStatesNonStrict_1 = require("./activeTests/setStatesNonStrict");
const objectsDeletion_1 = require("./activeTests/objectsDeletion");
const getStates_1 = require("./activeTests/getStates");
const messages_1 = require("./activeTests/messages");
const getStatesAlias_1 = require("./activeTests/getStatesAlias");
const getStatesAliasRead_1 = require("./activeTests/getStatesAliasRead");
const statesSubscriptionAlias_1 = require("./activeTests/statesSubscriptionAlias");
exports.tests = {
    setStates: setStates_1.Test,
    statesSubscription: statesSubscription_1.Test,
    statesSubscriptionAlias: statesSubscriptionAlias_1.Test,
    statesDeletion: statesDeletion_1.Test,
    idle: idle_1.Test,
    objectsCreation: objectsCreation_1.Test,
    objectsDeletion: objectsDeletion_1.Test,
    setStatesNonStrict: setStatesNonStrict_1.Test,
    getStates: getStates_1.Test,
    getStatesAlias: getStatesAlias_1.Test,
    getStatesAliasRead: getStatesAliasRead_1.Test,
    messages: messages_1.Test
};
//# sourceMappingURL=allTests.js.map