'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    // Define an array of your site prefixes
    const sites = ['lit', 'qwik', 'react', 'solid', 'svelte', 'vanilla', 'vue'];

    // Randomly select a site prefix
    const randomIndex = Math.floor(Math.random() * sites.length);
    const selectedSite = sites[randomIndex];

    // Prepend the selected site prefix to the request URI
    const newPath = `/${selectedSite}` + request.uri;

    // Update the request URI
    request.uri = newPath;

    // Return the modified request
    callback(null, request);
};
