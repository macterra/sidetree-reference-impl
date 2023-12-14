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
/**
 * Mock Blockchain class for testing.
 */
class MockBlockchain {
    constructor() {
        /** Stores each hash & fee given in write() method. */
        this.hashes = [];
        this.latestTime = { time: 500000, hash: 'dummyHash' };
    }
    write(anchorString, fee) {
        return __awaiter(this, void 0, void 0, function* () {
            this.hashes.push([anchorString, fee]);
        });
    }
    read(sinceTransactionNumber, _transactionTimeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sinceTransactionNumber === undefined) {
                sinceTransactionNumber = -1;
            }
            let moreTransactions = false;
            if (this.hashes.length > 0 &&
                sinceTransactionNumber < this.hashes.length - 2) {
                moreTransactions = true;
            }
            const transactions = [];
            if (this.hashes.length > 0 &&
                sinceTransactionNumber < this.hashes.length - 1) {
                const hashIndex = sinceTransactionNumber + 1;
                const transaction = {
                    transactionNumber: hashIndex,
                    transactionTime: hashIndex,
                    transactionTimeHash: this.hashes[hashIndex][0],
                    anchorString: this.hashes[hashIndex][0],
                    transactionFeePaid: this.hashes[hashIndex][1],
                    normalizedTransactionFee: this.hashes[hashIndex][1],
                    writer: 'writer'
                };
                transactions.push(transaction);
            }
            return {
                moreTransactions: moreTransactions,
                transactions: transactions
            };
        });
    }
    getFirstValidTransaction(_transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    getServiceVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error('getServiceVersion() not implemented.');
        });
    }
    getLatestTime() {
        return new Promise((resolve) => { resolve(this.latestTime); });
    }
    /**
     * Hardcodes the latest time to be returned.
     */
    setLatestTime(time) {
        this.latestTime = time;
    }
    getFee(transactionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error('getFee() not implemented. Inputs: ' + transactionTime);
        });
    }
    getValueTimeLock(_lockIdentifer) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error('getValueTimeLock() Not implemented.');
        });
    }
    getWriterValueTimeLock() {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error('getWriterValueTimeLock() not implemented.');
        });
    }
}
exports.default = MockBlockchain;
//# sourceMappingURL=MockBlockchain.js.map