# Analysis

It's clear to me that Node.js v20 is _much_ faster than Python 3.12 for this
Lambda@Edge route randomizer, by a factor of 3-4 times. With that, I wanted
to crunch some numbers on the most optimal Node.js implementation.

```python
# Provided execution times for each handler across multiple runs

execution_times = {
    'originalHandler': [0.00015844517, 0.00015461099, 0.00016602773, 0.00016123388, 0.00016669059],
    'slightlyOptimizedHandler': [0.00016363823, 0.00016238593, 0.00016114997, 0.00016262263999999998, 0.00016554601],
    'refactoredHardcodedLengthHandler': [0.00016169129999999996, 0.00016221593000000003, 0.00016836913, 0.00016065402999999997, 0.00016150674999999997],
    'refactoredReferencedLengthHandler': [0.00015652106000000005, 0.00016122209999999996, 0.00017565114999999997, 0.00015989483999999992, 0.00017124992],
    'shiftRandomHandler': [0.00016402669999999997, 0.00019242319999999998, 0.0001800933000000001, 0.00016192030000000004, 0.00017274925000000004],
    'shiftCryptoRandomHandler': [0.00016852182000000004, 0.0001837134, 0.00018601324999999996, 0.00016722685999999995, 0.00017518594999999987],
    'cryptoRandomHardcodedLengthHandler': [0.00016581293000000004, 0.00015853601, 0.00016658403, 0.00016222768000000013, 0.00016733263999999998],
    'cryptoRandomReferencedLengthHandler': [0.00016989174000000003, 0.00016127403999999988, 0.00017790861000000003, 0.00016511175999999996, 0.00016848014000000002]
}

# Calculate the average execution time for each handler
average_execution_times = {handler: sum(times)/len(times) for handler, times in execution_times.items()}

# Resulting values
average_execution_times
{
 'originalHandler': 0.000161401672,
 'slightlyOptimizedHandler': 0.000163068556,
 'refactoredHardcodedLengthHandler': 0.00016288742799999998,
 'refactoredReferencedLengthHandler': 0.000164907814,
 'shiftRandomHandler': 0.00017424255000000004,
 'shiftCryptoRandomHandler': 0.00017613225599999997,
 'cryptoRandomHardcodedLengthHandler': 0.00016409865800000003,
 'cryptoRandomReferencedLengthHandler': 0.00016853325799999998
}
```

Based on the calculations, here are the average execution times for each
handler, measured in milliseconds (ms) per operation, over multiple runs
with 10,000,000 iterations:

1. **originalHandler**: 0.0001614 ms
1. **slightlyOptimizedHandler**: 0.0001631 ms
1. **refactoredHardcodedLengthHandler**: 0.0001629 ms
1. **refactoredReferencedLengthHandler**: 0.0001649 ms
1. **shiftRandomHandler**: 0.0001742 ms
1. **shiftCryptoRandomHandler**: 0.0001761 ms
1. **cryptoRandomHardcodedLengthHandler**: 0.0001641 ms
1. **cryptoRandomReferencedLengthHandler**: 0.0001685 ms

From these statistics, the handler with the fastest average execution time
is the originalHandler at 0.0001614 ms per operation. On the other hand, the
shiftCryptoRandomHandler shows the slowest average execution time at
0.0001761 ms per operation.

These results suggest that while cryptographic methods(like those used in
shiftCryptoRandomHandler and cryptoRandomReferencedLengthHandler) add a
layer of security, they slightly reduce performance compared to the non -
cryptographic random generation in originalHandler.However, the differences
in execution times are very small, typically on the order of ten -
thousandths of a millisecond per operation, indicating that all methods are
quite efficient for large numbers of iterations.

I find it hilarious that the original, 'unoptimized' implementation won out
in these tests. But hey, it was a fun thing to explore.
