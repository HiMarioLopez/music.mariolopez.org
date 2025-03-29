// Add this new utility function for artificial delay
export const simulateNetworkDelay = (ms: number = 1500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
