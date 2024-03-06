const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const secretsManager = new AWS.SecretsManager();

// Helper function to retrieve the PEM private key secret
async function getSecret(secretName) {
    return new Promise((resolve, reject) => {
        secretsManager.getSecretValue({ SecretId: secretName }, (err, result) => {
            if (err) reject(err);
            else resolve(result.SecretString);
        });
    });
}

// Lambda handler
exports.handler = async (event) => {
    try {
        // Fetch the PEM private key from Secrets Manager
        const secretName = process.env.APPLE_AUTH_KEY_SECRET_NAME;
        const applePrivateKey = await getSecret(secretName);

        // Read TEAM_ID and KEY_ID from environment variables
        const teamId = process.env.APPLE_TEAM_ID;
        const keyId = process.env.APPLE_KEY_ID;

        // Ensure the private key is correctly formatted
        const privateKey = applePrivateKey.replace(/\\n/g, '\n');

        // Generate JWT using the private key
        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '1h',
            issuer: teamId,
            header: {
                alg: 'ES256',
                kid: keyId
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ token }),
        };
    } catch (error) {
        console.error("Error fetching secret or generating token:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error processing your request" }),
        };
    }
};
