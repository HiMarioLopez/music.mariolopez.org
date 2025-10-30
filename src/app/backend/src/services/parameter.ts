import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DeleteParameterCommand, GetParameterCommand, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const logger = new Logger({ serviceName: 'parameter-service' });
const tracer = new Tracer({ serviceName: 'parameter-service' });

const ssmClient = new SSMClient();

// Instrument the AWS client with tracer
tracer.captureAWSv3Client(ssmClient);

/**
 * Get a parameter from AWS SSM Parameter Store
 * 
 * @param parameterName - Name of the parameter to retrieve
 * @returns Promise resolving to the parameter value or undefined if not found
 */
export const getParameter = async (parameterName: string): Promise<string | undefined> => {
    try {
        const response = await ssmClient.send(
            new GetParameterCommand({
                Name: parameterName,
                WithDecryption: true
            })
        );
        logger.info('Parameter retrieved successfully', { parameterName });
        return response.Parameter?.Value;
    } catch (error) {
        if ((error as any).name === 'ParameterNotFound') {
            logger.warn('Parameter not found', { parameterName });
            return undefined;
        }
        logger.error('Error getting parameter', { parameterName, error });
        throw error;
    }
};

/**
 * Update a parameter in AWS SSM Parameter Store
 * 
 * @param parameterName - Name of the parameter to update
 * @param value - New value for the parameter
 * @returns Promise that resolves when the parameter is updated
 */
export const updateParameter = async (parameterName: string, value: string): Promise<void> => {
    try {
        await ssmClient.send(
            new PutParameterCommand({
                Name: parameterName,
                Value: value,
                Type: 'String',
                Overwrite: true
            })
        );
        logger.info('Parameter updated successfully', { parameterName });
    } catch (error) {
        logger.error('Error updating parameter', { parameterName, error });
        throw error;
    }
};

/**
 * Delete a parameter from AWS SSM Parameter Store
 * 
 * @param parameterName - Name of the parameter to delete
 * @returns Promise that resolves when the parameter is deleted
 */
export const deleteParameter = async (parameterName: string): Promise<void> => {
    try {
        await ssmClient.send(
            new DeleteParameterCommand({
                Name: parameterName
            })
        );
        logger.info('Parameter deleted successfully', { parameterName });
    } catch (error) {
        if ((error as any).name === 'ParameterNotFound') {
            logger.warn('Parameter not found for deletion', { parameterName });
            return; // Don't throw if parameter doesn't exist
        }
        logger.error('Error deleting parameter', { parameterName, error });
        throw error;
    }
};
