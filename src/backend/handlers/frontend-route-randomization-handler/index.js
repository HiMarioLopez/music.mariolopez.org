'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    // Define base path mappings to site versions
    const siteMappings = {
        '/lit': '/lit',
        '/qwik': '/qwik',
        '/react': '/react',
        '/solid': '/solid',
        '/svelte': '/svelte',
        '/vanilla': '/vanilla',
        '/vue': '/vue',
        '/preact': '/preact'
    };

    // Extract the first part of the URI path
    const firstPathSegment = '/' + (request.uri.split('/')[1] || '');

    // Check if the first path segment matches any predefined site versions
    if (siteMappings[firstPathSegment]) {
        // Serve content from the specified site version
        request.uri = request.uri.replace(firstPathSegment, siteMappings[firstPathSegment]);
    } else {
        // Random site selection logic for when no specific site version is requested
        const sites = Object.values(siteMappings);
        const randomSite = sites[Math.floor(Math.random() * sites.length)];
        request.uri = randomSite + request.uri;
    }

    callback(null, request);
};
