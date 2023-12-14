"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const MockOperationQueue_1 = require("../../../mocks/MockOperationQueue");
/**
 * Some documentation
 */
class MongoDbOperationQueue extends MockOperationQueue_1.default {
    constructor(connectionString) {
        super();
        this.connectionString = connectionString;
        console.info('Making typescript ', this.connectionString);
    }
    /**
     * Initialize.
     */
    initialize() { }
    enqueue(didUniqueSuffix, operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`MongoDbOperationQueue: Not implemented. Version: TestVersion1. Inputs: ${didUniqueSuffix}, ${operationBuffer}`);
        });
    }
}
exports.default = MongoDbOperationQueue;
//# sourceMappingURL=MongoDbOperationQueue.js.map