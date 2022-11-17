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
const statesSubscriptionAliasWrite_1 = require("./activeTests/statesSubscriptionAliasWrite");
const setStatesParallel_1 = require("./activeTests/setStatesParallel");
const objectViewEqual_1 = require("./activeTests/objectViewEqual");
const objectViewSmall_1 = require("./activeTests/objectViewSmall");
const objectViewLarge_1 = require("./activeTests/objectViewLarge");
const getStatesMulti_1 = require("./activeTests/getStatesMulti");
const getStatesMultiAlias_1 = require("./activeTests/getStatesMultiAlias");
exports.tests = {
    setStates: setStates_1.Test,
    statesSubscription: statesSubscription_1.Test,
    statesSubscriptionAlias: statesSubscriptionAlias_1.Test,
    statesSubscriptionAliasWrite: statesSubscriptionAliasWrite_1.Test,
    statesDeletion: statesDeletion_1.Test,
    idle: idle_1.Test,
    objectsCreation: objectsCreation_1.Test,
    objectsDeletion: objectsDeletion_1.Test,
    setStatesNonStrict: setStatesNonStrict_1.Test,
    getStates: getStates_1.Test,
    getStatesAlias: getStatesAlias_1.Test,
    getStatesAliasRead: getStatesAliasRead_1.Test,
    messages: messages_1.Test,
    setStatesParallel: setStatesParallel_1.Test,
    objectViewEqual: objectViewEqual_1.Test,
    objectViewSmall: objectViewSmall_1.Test,
    objectViewLarge: objectViewLarge_1.Test,
    getStatesMulti: getStatesMulti_1.Test,
    getStatesMultiAlias: getStatesMultiAlias_1.Test
};
//# sourceMappingURL=allTests.js.map