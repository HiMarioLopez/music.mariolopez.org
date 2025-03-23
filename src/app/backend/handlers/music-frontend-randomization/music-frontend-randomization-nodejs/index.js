'use strict';

/**
 * An array of site versions used for route randomization.
 * Each version corresponds to a specific framework or library.
 * @type {string[]}
 */
const siteVersions = [
    '/react',
    // '/vanilla', // Under construction
    // '/lit', // Under construction
    // '/qwik', // Under construction
    // '/solid', // Under construction
    // '/svelte', // Under construction
    // '/vue', // Under construction
    // '/preact', // Under construction
    // '/next',
    // '/angular',
    // '/blazor',
    // '/leptos'
];

/**
 * LambdaEdge handler function for route randomization.
 *
 * This function inspects the incoming request URI and checks if the first path segment
 * matches any of the defined site versions. If there is a match, the request URI remains
 * unchanged. If there is no match, a random site version is selected and prepended to
 * the request URI.
 *
 * @param {Object} event - The LambdaEdge event object.
 * @param {Object} context - The LambdaEdge context object.
 * @param {Function} callback - The callback function to be invoked with the modified request.
 */
exports.handler = ({ Records: [{ cf: { request } }] }, context, callback) => {
    // Extract the first path segment from the request URI
    const firstPathSegment = `/${request.uri.split('/')[1] || ''}`;

    // Check if the first path segment matches any of the defined site versions
    // If there is no match, select a random site version and prepend it to the request URI
    if (!siteVersions.includes(firstPathSegment)) {
        const randomIndex = Math.floor(Math.random() * siteVersions.length);
        request.uri = siteVersions[randomIndex] + request.uri;
    }

    // Invoke the callback function with the modified request
    callback(null, request);
};