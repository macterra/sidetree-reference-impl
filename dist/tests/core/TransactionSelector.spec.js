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
const AnchoredDataSerializer_1 = require("../../lib/core/versions/latest/AnchoredDataSerializer");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const MockTransactionStore_1 = require("../mocks/MockTransactionStore");
const TransactionSelector_1 = require("../../lib/core/versions/latest/TransactionSelector");
describe('TransactionSelector', () => {
    let transactionSelector;
    let transactionStore;
    function getTestTransactionsFor1Block() {
        return [
            {
                transactionNumber: 1,
                transactionTime: 1,
                transactionTimeHash: 'some hash',
                anchorString: AnchoredDataSerializer_1.default.serialize({
                    coreIndexFileUri: 'file_hash',
                    numberOfOperations: 12
                }),
                transactionFeePaid: 333,
                normalizedTransactionFee: 1,
                writer: 'writer1'
            },
            {
                transactionNumber: 2,
                transactionTime: 1,
                transactionTimeHash: 'some hash',
                anchorString: AnchoredDataSerializer_1.default.serialize({
                    coreIndexFileUri: 'file_hash2',
                    numberOfOperations: 11
                }),
                transactionFeePaid: 998,
                normalizedTransactionFee: 1,
                writer: 'writer2'
            },
            {
                transactionNumber: 3,
                transactionTime: 1,
                transactionTimeHash: 'some hash',
                anchorString: AnchoredDataSerializer_1.default.serialize({
                    coreIndexFileUri: 'file_hash3',
                    numberOfOperations: 8
                }),
                transactionFeePaid: 999,
                normalizedTransactionFee: 1,
                writer: 'writer3'
            },
            {
                transactionNumber: 4,
                transactionTime: 1,
                transactionTimeHash: 'some hash',
                anchorString: AnchoredDataSerializer_1.default.serialize({
                    coreIndexFileUri: 'file_hash4',
                    numberOfOperations: 1
                }),
                transactionFeePaid: 14,
                normalizedTransactionFee: 1,
                writer: 'writer4'
            }
        ];
    }
    beforeEach(() => {
        transactionStore = new MockTransactionStore_1.default();
        transactionSelector = new TransactionSelector_1.default(transactionStore);
        // hard set number for ease of testing
        transactionSelector['maxNumberOfTransactionsPerBlock'] = 10;
        transactionSelector['maxNumberOfOperationsPerBlock'] = 25;
    });
    describe('selectQualifiedTransactions', () => {
        it('should return the expected transactions with limit on operation', () => __awaiter(void 0, void 0, void 0, function* () {
            // max operation is 25 by default in before each
            const transactions = getTestTransactionsFor1Block();
            const result = yield transactionSelector.selectQualifiedTransactions(transactions);
            const expected = [
                {
                    transactionNumber: 3,
                    transactionTime: 1,
                    transactionTimeHash: 'some hash',
                    anchorString: AnchoredDataSerializer_1.default.serialize({
                        coreIndexFileUri: 'file_hash3',
                        numberOfOperations: 8
                    }),
                    transactionFeePaid: 999,
                    normalizedTransactionFee: 1,
                    writer: 'writer3'
                },
                {
                    transactionNumber: 2,
                    transactionTime: 1,
                    transactionTimeHash: 'some hash',
                    anchorString: AnchoredDataSerializer_1.default.serialize({
                        coreIndexFileUri: 'file_hash2',
                        numberOfOperations: 11
                    }),
                    transactionFeePaid: 998,
                    normalizedTransactionFee: 1,
                    writer: 'writer2'
                }
            ];
            expect(result).toEqual(expected);
        }));
        it('should return the expected transactions with limit on 1 transaction per writer', () => __awaiter(void 0, void 0, void 0, function* () {
            // max operation is 25 by default in before each
            const transactions = getTestTransactionsFor1Block();
            // make all transactions the same writer except the last one
            for (const transaction of transactions) {
                transaction.writer = 'sameWriterForAllExceptLast';
            }
            transactions[transactions.length - 1].writer = 'aDifferentWriter';
            const result = yield transactionSelector.selectQualifiedTransactions(transactions);
            // expect the first and last transaction because the first one is the first from the repeating writer and the last one is from a different writer
            const expected = [transactions[0], transactions[transactions.length - 1]];
            expect(result).toEqual(expected);
        }));
        it('should return the expected transactions with limit on transaction', () => __awaiter(void 0, void 0, void 0, function* () {
            transactionSelector = new TransactionSelector_1.default(transactionStore);
            // set transactions limit to 1 to see proper limiting, and set operation to 100 so it does not filter.
            transactionSelector['maxNumberOfTransactionsPerBlock'] = 1;
            transactionSelector['maxNumberOfOperationsPerBlock'] = 100;
            const transactions = getTestTransactionsFor1Block();
            const result = yield transactionSelector.selectQualifiedTransactions(transactions);
            const expected = [
                {
                    transactionNumber: 3,
                    transactionTime: 1,
                    transactionTimeHash: 'some hash',
                    anchorString: AnchoredDataSerializer_1.default.serialize({
                        coreIndexFileUri: 'file_hash3',
                        numberOfOperations: 8
                    }),
                    transactionFeePaid: 999,
                    normalizedTransactionFee: 1,
                    writer: 'writer3'
                }
            ];
            expect(result).toEqual(expected);
        }));
        it('should return an empty array when an empty array is passed in', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield transactionSelector.selectQualifiedTransactions([]);
            const expected = [];
            expect(result).toEqual(expected);
        }));
        it('should throw expected error if the array passed in contains transactions from multiple different blocks', () => __awaiter(void 0, void 0, void 0, function* () {
            const transactions = getTestTransactionsFor1Block();
            transactions[transactions.length - 1].transactionTime = 12324;
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => transactionSelector.selectQualifiedTransactions(transactions), ErrorCode_1.default.TransactionsNotInSameBlock);
        }));
        it('should deduct the number of operations if some operations in the current block were already in transactions store', () => __awaiter(void 0, void 0, void 0, function* () {
            const extraTransaction = {
                transactionNumber: 0,
                transactionTime: 1,
                transactionTimeHash: 'some hash',
                anchorString: AnchoredDataSerializer_1.default.serialize({
                    coreIndexFileUri: 'file_hash',
                    numberOfOperations: 16
                }),
                transactionFeePaid: 9999,
                normalizedTransactionFee: 1,
                writer: 'writer'
            };
            yield transactionStore.addTransaction(extraTransaction);
            const transactions = getTestTransactionsFor1Block();
            const result = yield transactionSelector.selectQualifiedTransactions(transactions);
            const expected = [
                {
                    transactionNumber: 3,
                    transactionTime: 1,
                    transactionTimeHash: 'some hash',
                    anchorString: AnchoredDataSerializer_1.default.serialize({
                        coreIndexFileUri: 'file_hash3',
                        numberOfOperations: 8
                    }),
                    transactionFeePaid: 999,
                    normalizedTransactionFee: 1,
                    writer: 'writer3'
                }
            ];
            expect(result).toEqual(expected);
        }));
        it('should deduct the number of transactions if transactions in the current block were already in transactions store', () => __awaiter(void 0, void 0, void 0, function* () {
            transactionSelector = new TransactionSelector_1.default(transactionStore);
            // set to never reach operation limit but can see transaction limiting
            transactionSelector['maxNumberOfTransactionsPerBlock'] = 2;
            transactionSelector['maxNumberOfOperationsPerBlock'] = 10000;
            const extraTransaction = {
                transactionNumber: 0,
                transactionTime: 1,
                transactionTimeHash: 'some hash',
                anchorString: AnchoredDataSerializer_1.default.serialize({
                    coreIndexFileUri: 'file_hash',
                    numberOfOperations: 1
                }),
                transactionFeePaid: 9999,
                normalizedTransactionFee: 1,
                writer: 'writer'
            };
            yield transactionStore.addTransaction(extraTransaction);
            const transactions = getTestTransactionsFor1Block();
            const result = yield transactionSelector.selectQualifiedTransactions(transactions);
            const expected = [
                {
                    transactionNumber: 3,
                    transactionTime: 1,
                    transactionTimeHash: 'some hash',
                    anchorString: AnchoredDataSerializer_1.default.serialize({
                        coreIndexFileUri: 'file_hash3',
                        numberOfOperations: 8
                    }),
                    transactionFeePaid: 999,
                    normalizedTransactionFee: 1,
                    writer: 'writer3'
                }
            ];
            expect(result).toEqual(expected);
        }));
        it('should skip transactions that are not parsable', () => __awaiter(void 0, void 0, void 0, function* () {
            const transactions = getTestTransactionsFor1Block();
            // this makes the parsing fail when reading from db
            const extraTransaction = {
                transactionNumber: 0,
                transactionTime: 1,
                transactionTimeHash: 'some hash',
                anchorString: 'thisIsABadString',
                transactionFeePaid: 9999,
                normalizedTransactionFee: 1,
                writer: 'writer'
            };
            yield transactionStore.addTransaction(extraTransaction);
            // this makes the parsing fail when reading new transactions
            spyOn(AnchoredDataSerializer_1.default, 'deserialize').and.throwError('some error');
            const result = yield transactionSelector.selectQualifiedTransactions(transactions);
            const expected = [];
            expect(result).toEqual(expected);
        }));
    });
    describe('getNumberOfOperationsAndTransactionsAlreadyInTransactionTime', () => {
        it('should handle when transactions store returns undefined', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(transactionStore, 'getTransactionsStartingFrom').and.returnValue(new Promise((resolve) => {
                resolve(undefined);
            }));
            const result = yield transactionSelector['getNumberOfOperationsAndTransactionsAlreadyInTransactionTime'](1);
            expect(result).toEqual([0, 0]);
        }));
    });
});
//# sourceMappingURL=TransactionSelector.spec.js.map