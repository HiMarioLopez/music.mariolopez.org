import random

SITE_VERSIONS = [
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
]

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    default_uri = request['uri']
    
    # Extract the first path segment
    first_path_segment = '/' + (default_uri.split('/')[1] or '')
    
    # If the segment doesn't match, assign a random site version
    if first_path_segment not in SITE_VERSIONS:
        random_index = random.randint(0, len(SITE_VERSIONS) - 1)
        request['uri'] = SITE_VERSIONS[random_index] + default_uri
    
    return request