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
const semver = require("semver");
const timeSpan = require("time-span");
const BatchScheduler_1 = require("./BatchScheduler");
const Blockchain_1 = require("./Blockchain");
const BlockchainClock_1 = require("./BlockchainClock");
const DownloadManager_1 = require("./DownloadManager");
const ErrorCode_1 = require("./ErrorCode");
const EventEmitter_1 = require("../common/EventEmitter");
const LogColor_1 = require("../common/LogColor");
const Logger_1 = require("../common/Logger");
const MongoDbConfirmationStore_1 = require("./MongoDbConfirmationStore");
const MongoDbOperationStore_1 = require("./MongoDbOperationStore");
const MongoDbServiceStateStore_1 = require("../common/MongoDbServiceStateStore");
const MongoDbTransactionStore_1 = require("../common/MongoDbTransactionStore");
const MongoDbUnresolvableTransactionStore_1 = require("./MongoDbUnresolvableTransactionStore");
const Monitor_1 = require("./Monitor");
const Observer_1 = require("./Observer");
const Resolver_1 = require("./Resolver");
const ResponseStatus_1 = require("../common/enums/ResponseStatus");
const ServiceInfoProvider_1 = require("../common/ServiceInfoProvider");
const SidetreeError_1 = require("../common/SidetreeError");
const VersionManager_1 = require("./VersionManager");
/**
 * The core class that is instantiated when running a Sidetree node.
 */
class Core {
    /**
     * Core constructor.
     */
    constructor(config, versionModels, cas, blockchain = new Blockchain_1.default(config.blockchainServiceUri)) {
        this.config = config;
        this.cas = cas;
        this.blockchain = blockchain;
        // Component dependency construction & injection.
        this.versionManager = new VersionManager_1.default(config, versionModels); // `VersionManager` is first constructed component as multiple components depend on it.
        this.serviceInfo = new ServiceInfoProvider_1.default('core');
        this.serviceStateStore = new MongoDbServiceStateStore_1.default(this.config.mongoDbConnectionString, this.config.databaseName);
        this.operationStore = new MongoDbOperationStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.downloadManager = new DownloadManager_1.default(config.maxConcurrentDownloads, this.cas);
        this.resolver = new Resolver_1.default(this.versionManager, this.operationStore);
        this.transactionStore = new MongoDbTransactionStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.unresolvableTransactionStore = new MongoDbUnresolvableTransactionStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.confirmationStore = new MongoDbConfirmationStore_1.default(config.mongoDbConnectionString, config.databaseName);
        // Only enable real blockchain time pull if observer is enabled
        const enableRealBlockchainTimePull = config.observingIntervalInSeconds > 0;
        this.blockchainClock = new BlockchainClock_1.default(this.blockchain, this.serviceStateStore, enableRealBlockchainTimePull);
        this.batchScheduler = new BatchScheduler_1.default(this.versionManager, this.blockchain, config.batchingIntervalInSeconds);
        this.observer = new Observer_1.default(this.versionManager, this.blockchain, config.maxConcurrentDownloads, this.operationStore, this.transactionStore, this.unresolvableTransactionStore, this.confirmationStore, config.observingIntervalInSeconds);
        this.monitor = new Monitor_1.default(this.config, this.versionManager, this.blockchain);
    }
    /**
     * The initialization method that must be called before consumption of this core object.
     * The method starts the Observer and Batch Writer.
     */
    initialize(customLogger, customEventEmitter) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.initialize(customLogger);
            EventEmitter_1.default.initialize(customEventEmitter);
            // DB initializations.
            yield this.initializeDataStores(this.config.observingIntervalInSeconds);
            yield this.versionManager.initialize(this.blockchain, this.cas, this.downloadManager, this.operationStore, this.resolver, this.transactionStore, this.confirmationStore); // `VersionManager` is last initialized component as it needs many shared/common components to be ready first.
            if (this.config.observingIntervalInSeconds > 0) {
                yield this.observer.startPeriodicProcessing();
            }
            else {
                Logger_1.default.warn(LogColor_1.default.yellow(`Transaction observer is disabled.`));
            }
            // Only pull real blockchain time when observer is enabled, else only read from db.
            yield this.blockchainClock.startPeriodicPullLatestBlockchainTime();
            if (this.config.batchingIntervalInSeconds > 0) {
                this.batchScheduler.startPeriodicBatchWriting();
            }
            else {
                Logger_1.default.warn(LogColor_1.default.yellow(`Batch writing is disabled.`));
            }
            this.downloadManager.start();
            yield this.monitor.initialize();
        });
    }
    /**
     * Attempts to initialize data stores until success.
     * @param retryWaitTimeOnFailureInSeconds Time to wait if initialization failed.
     */
    initializeDataStores(retryWaitTimeOnFailureInSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            // Keep retrying until success to handle the case when DB is not yet available upon initialization, e.g. better docker-compose startup support.
            while (true) {
                try {
                    yield this.serviceStateStore.initialize();
                    yield this.transactionStore.initialize();
                    yield this.unresolvableTransactionStore.initialize();
                    yield this.operationStore.initialize();
                    yield this.confirmationStore.initialize();
                    yield this.upgradeDatabaseIfNeeded();
                    return;
                }
                catch (error) {
                    Logger_1.default.info(LogColor_1.default.yellow(`Unable to initialize data stores: ${error}.`));
                }
                Logger_1.default.info(`Retry data store initialization after ${retryWaitTimeOnFailureInSeconds} seconds...`);
                yield new Promise(resolve => setTimeout(resolve, retryWaitTimeOnFailureInSeconds * 1000));
            }
        });
    }
    /**
     * Handles an operation request.
     */
    handleOperationRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = this.blockchainClock.getTime();
            const requestHandler = this.versionManager.getRequestHandler(currentTime);
            const response = requestHandler.handleOperationRequest(request);
            return response;
        });
    }
    /**
     * Handles resolve operation.
     * @param didOrDidDocument Can either be:
     *   1. Fully qualified DID. e.g. 'did:sidetree:abc' or
     *   2. An encoded DID Document prefixed by the DID method name. e.g. 'did:sidetree:<encoded-DID-Document>'.
     */
    handleResolveRequest(didOrDidDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = this.blockchainClock.getTime();
            const requestHandler = this.versionManager.getRequestHandler(currentTime);
            const response = requestHandler.handleResolveRequest(didOrDidDocument);
            return response;
        });
    }
    /**
     * Handles the get version request. It gets the versions from the dependent services
     * as well.
     */
    handleGetVersionRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            const responses = [
                this.serviceInfo.getServiceVersion(),
                yield this.blockchain.getServiceVersion()
            ];
            return {
                status: ResponseStatus_1.default.Succeeded,
                body: JSON.stringify(responses)
            };
        });
    }
    upgradeDatabaseIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            // If this node is not the active Observer node, do not perform DB upgrade.
            // Since only one active Observer is supported, this ensures only one node is performing the DB upgrade.
            if (this.config.observingIntervalInSeconds === 0) {
                return;
            }
            const expectedDbVersion = '1.1.0';
            const savedServiceState = yield this.serviceStateStore.get();
            const actualDbVersion = savedServiceState.databaseVersion;
            if (expectedDbVersion === actualDbVersion) {
                return;
            }
            // Throw if attempting to downgrade.
            if (actualDbVersion !== undefined && semver.lt(expectedDbVersion, actualDbVersion)) {
                Logger_1.default.error(LogColor_1.default.red(`Downgrading DB from version ${LogColor_1.default.green(actualDbVersion)} to  ${LogColor_1.default.green(expectedDbVersion)} is not allowed.`));
                throw new SidetreeError_1.default(ErrorCode_1.default.DatabaseDowngradeNotAllowed);
            }
            // Add DB upgrade code below.
            Logger_1.default.warn(LogColor_1.default.yellow(`Upgrading DB from version ${LogColor_1.default.green(actualDbVersion)} to ${LogColor_1.default.green(expectedDbVersion)}...`));
            // Current upgrade action is simply clearing/deleting existing DB such that initial sync can occur from genesis block.
            const timer = timeSpan();
            yield this.operationStore.delete();
            yield this.transactionStore.clearCollection();
            yield this.unresolvableTransactionStore.clearCollection();
            // There was a index change/addition in from v1.0.0 -> v1.0.1 of the DB, this line ensures new indices are created,
            // but can be optional in the future when v1.0.0 is so old that we don't care about upgrade path from it.
            yield this.operationStore.createIndex();
            yield this.serviceStateStore.put({ databaseVersion: expectedDbVersion });
            Logger_1.default.warn(LogColor_1.default.yellow(`DB upgraded in: ${LogColor_1.default.green(timer.rounded())} ms.`));
        });
    }
}
exports.default = Core;
//# sourceMappingURL=Core.js.map