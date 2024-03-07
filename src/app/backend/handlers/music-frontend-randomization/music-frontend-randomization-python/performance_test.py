import random
import timeit

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

# Helper function to create a test event
def create_test_event():
    return {
        'Records': [
            {
                'cf': {
                    'request': {
                        # Mock event object with 'root' request URI so it randomizes the URI
                        'uri': '/'
                    }
                }
            }
        ]
    }

# Run performance tests
iterations = 10000000  # Adjust the number of iterations as needed

print(f"Running performance tests with {iterations} iterations...")
execution_time = timeit.timeit(
    "lambda_handler(create_test_event(), None)",
    setup="from __main__ import lambda_handler, create_test_event",
    number=iterations
)
print(f"Average execution time: {execution_time / iterations * 1000} miliseconds")

# Output:

# Run #1:
# Running performance tests with 10000000 iterations...
# Average execution time: 0.0006535594000000856 miliseconds

# Run #2:
# Running performance tests with 10000000 iterations...
# Average execution time: 0.0006635221299999102 miliseconds

# Run #3:
# Running performance tests with 10000000 iterations...
# Average execution time: 0.0006814986600002157 miliseconds

# Python is around 3-4 times slower than JavaScript / Node.js...