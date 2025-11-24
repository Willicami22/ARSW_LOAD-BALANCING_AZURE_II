var bigInt = require("big-integer");

// In-memory cache (persists during function instance lifetime)
const memoCache = {};

// Statistics for debugging/demonstration
let stats = {
    cacheHits: 0,
    cacheMisses: 0,
    instanceStartTime: new Date().toISOString()
};

/**
 * Fibonacci with memoization (recursive approach)
 * Cache persists only during the lifetime of the function instance.
 * After ~5 minutes of inactivity, Azure may deallocate the instance (cold start),
 * causing cache loss.
 */
function fibonacciMemo(n) {
    // Check cache first
    if (memoCache[n] !== undefined) {
        stats.cacheHits++;
        return memoCache[n];
    }
    
    stats.cacheMisses++;
    
    // Base cases
    if (n === 0) {
        memoCache[n] = bigInt.zero;
        return memoCache[n];
    }
    if (n === 1) {
        memoCache[n] = bigInt.one;
        return memoCache[n];
    }
    
    // Recursive case with memoization
    memoCache[n] = fibonacciMemo(n - 1).add(fibonacciMemo(n - 2));
    return memoCache[n];
}

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request (FibonacciMemo).');

    let nth = req.body.nth;
    
    if (nth === undefined || nth === null) {
        context.res = {
            status: 400,
            body: "Please provide 'nth' in the request body"
        };
        return;
    }

    if (nth < 0) {
        context.res = {
            status: 400,
            body: "nth must be greater than or equal to 0"
        };
        return;
    }

    try {
        const result = fibonacciMemo(nth);
        
        context.res = {
            body: {
                result: result.toString(),
                nth: nth,
                cacheSize: Object.keys(memoCache).length,
                cacheHits: stats.cacheHits,
                cacheMisses: stats.cacheMisses,
                instanceStartTime: stats.instanceStartTime,
                message: "Cache persists only during instance lifetime. After ~5 min inactivity, cold start resets cache."
            }
        };
    } catch (error) {
        context.log.error('Error calculating Fibonacci:', error);
        context.res = {
            status: 500,
            body: `Error: ${error.message}`
        };
    }
}
