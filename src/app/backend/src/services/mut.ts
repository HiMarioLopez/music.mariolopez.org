import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({ serviceName: 'mut-service' });
const tracer = new Tracer({ serviceName: 'mut-service' });

const ssmClient = new SSMClient({});

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(ssmClient);

interface MUTConfig {
    parameterName: string;
}

/**
 * Retrieves the Music User Token (MUT) from AWS SSM Parameter Store
 * 
 * @param config - Configuration containing the SSM parameter name
 * @returns Promise resolving to the MUT value
 * @throws Error if the MUT cannot be found
 */
export const getMUT = async (config: MUTConfig): Promise<string> => {
    try {
        const response = await ssmClient.send(new GetParameterCommand({
            Name: config.parameterName,
            WithDecryption: true,
        }));

        if (!response.Parameter?.Value) {
            throw new Error('MUT not found');
        }

        logger.info('Successfully retrieved MUT');
        return response.Parameter.Value;
    } catch (error) {
        logger.error('Error retrieving MUT from SSM', { error });
        throw error;
    }
};
