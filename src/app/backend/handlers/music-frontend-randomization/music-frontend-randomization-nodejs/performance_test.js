'use strict';
const crypto = require('crypto');

// Original handler function
const originalHandler = (event, context, callback) => {
    const siteVersions = [
        '/lit',
        '/qwik',
        '/react',
        '/solid',
        '/svelte',
        '/vanilla',
        '/vue',
        '/preact',
        '/next',
        '/angular',
        '/blazor',
        '/leptos'
    ];

    const request = event.Records[0].cf.request;
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    if (!siteVersions.includes(firstPathSegment)) {
        const randomIndex = Math.floor(Math.random() * siteVersions.length);
        request.uri = siteVersions[randomIndex] + defaultUri;
    }

    callback(null, request);
};

const siteVersions = [
    '/lit',
    '/qwik',
    '/react',
    '/solid',
    '/svelte',
    '/vanilla',
    '/vue',
    '/preact',
    '/next',
    '/angular',
    '/blazor',
    '/leptos'
];

const slightlyOptimizedHandler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    if (!siteVersions.includes(firstPathSegment)) {
        const randomIndex = Math.floor(Math.random() * siteVersions.length);
        request.uri = siteVersions[randomIndex] + defaultUri;
    }

    callback(null, request);
};

const refactoredHardcodedLengthHandler = ({ Records: [{ cf: { request } }] }, context, callback) => {
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    request.uri = siteVersions.includes(firstPathSegment)
        ? defaultUri
        : siteVersions[Math.floor(Math.random() * 11)] + defaultUri; // 12 is the length of the siteVersions array

    callback(null, request);
};

const refactoredReferencedLengthHandler = ({ Records: [{ cf: { request } }] }, context, callback) => {
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    request.uri = siteVersions.includes(firstPathSegment)
        ? defaultUri
        : siteVersions[Math.floor(Math.random() * (siteVersions.length - 1))] + defaultUri;

    callback(null, request);
};

function shiftRand(iterations) {
    var r = 0;
    var raw = 0;
    for (var i = iterations; i > 0; i--) {
        raw = Math.floor(Math.random() * 16);
        for (var j = 0; j < Math.floor(32 / 4); j++) {
            r = raw & 15;
            raw = raw >> 4;
            i--;
            if (i === 0) break;
        }
    }
    return r;
}

const shiftRandomHandler = ({ Records: [{ cf: { request } }] }, context, callback) => {
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    request.uri = siteVersions.includes(firstPathSegment)
        ? defaultUri
        : `${siteVersions[shiftRand(1)]}${defaultUri}`;

    callback(null, request);
};

function shiftCryptoRand(iterations) {
    let r = 0;
    let raw = 0;
    for (let i = iterations; i > 0; i--) {
        // Use crypto.randomInt for a cryptographically secure random number
        raw = crypto.randomInt(0, 16);
        for (let j = 0; j < Math.floor(32 / 4); j++) {
            r = raw & 15;
            raw = raw >> 4;
            i--;
            if (i === 0) break;
        }
    }
    return r;
}

const shiftCryptoRandomHandler = ({ Records: [{ cf: { request } }] }, context, callback) => {
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    request.uri = siteVersions.includes(firstPathSegment)
        ? defaultUri
        : `${siteVersions[shiftCryptoRand(1)]}${defaultUri}`;

    callback(null, request);
};

const cryptoRandomHardcodedLengthHandler = ({ Records: [{ cf: { request } }] }, context, callback) => {
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    request.uri = siteVersions.includes(firstPathSegment)
        ? defaultUri
        : `${siteVersions[crypto.randomInt(0, 12)]}${defaultUri}`; // 11 is the length of the siteVersions array

    callback(null, request);
};

const cryptoRandomReferencedLengthHandler = ({ Records: [{ cf: { request } }] }, context, callback) => {
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    request.uri = siteVersions.includes(firstPathSegment)
        ? defaultUri
        : `${siteVersions[crypto.randomInt(0, siteVersions.length)]}${defaultUri}`;

    callback(null, request);
};


// Helper function to measure execution time
const measurePerformance = (handler, iterations) => {
    const event = {
        // Mock event object with 'root' request URI so it randomizes the URI
        Records: [{ cf: { request: { uri: '/' } } }]
    };
    const context = {};
    const callback = () => { };

    const startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
        handler(event, context, callback);
    }
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    console.log(`Average execution time of ${executionTime / iterations} ms for ${handler.name}`);
};

// Run performance tests
const iterations = 10000000; // Adjust the number of iterations as needed

console.log(`Running performance tests with ${iterations} iterations...`);
measurePerformance(originalHandler, iterations);
measurePerformance(slightlyOptimizedHandler, iterations);
measurePerformance(refactoredHardcodedLengthHandler, iterations);
measurePerformance(refactoredReferencedLengthHandler, iterations);
measurePerformance(shiftRandomHandler, iterations);
measurePerformance(shiftCryptoRandomHandler, iterations);
measurePerformance(cryptoRandomHardcodedLengthHandler, iterations);
measurePerformance(cryptoRandomReferencedLengthHandler, iterations);

// Node.js is the winner! I'm not quite sure what version of the Node.js function to use, though.