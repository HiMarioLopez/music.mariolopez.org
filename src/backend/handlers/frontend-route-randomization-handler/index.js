'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    // Direct mapping for path to itself, assuming future divergence is possible
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
        '/blazor'
    ];
    const defaultUri = request.uri;
    const firstPathSegment = `/${defaultUri.split('/')[1] || ''}`;

    // If the segment matches, no change is needed. If not, assign a random site version.
    if (!siteVersions.includes(firstPathSegment)) {
        const randomIndex = Math.floor(Math.random() * siteVersions.length);
        request.uri = siteVersions[randomIndex] + defaultUri;
    }

    callback(null, request);
};
