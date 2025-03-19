import { SSMClient, PutParameterCommand } from "@aws-sdk/client-ssm";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const ssm = new SSMClient({});

const validateScheduleRate = (rate: string): boolean => {
    // Validate rate(n units) format
    const rateRegex = /^rate\((\d+)\s+(minute|minutes|hour|hours|day|days)\)$/;
    // Validate cron format
    const cronRegex = /^cron\([0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[0-9*,\-/\s]+\s[?*,\-/\s]+\s[0-9*,\-/\s]+\)$/;

    return rateRegex.test(rate) || cronRegex.test(rate);
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing request body" }),
            };
        }

        const { rate } = JSON.parse(event.body);

        if (!rate || !validateScheduleRate(rate)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid schedule rate format. Must be either 'rate(n units)' or a valid cron expression"
                }),
            };
        }

        await ssm.send(new PutParameterCommand({
            Name: process.env.PARAMETER_NAME,
            Value: rate,
            Type: "String",
            Overwrite: true,
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Schedule rate updated successfully",
                rate
            }),
        };
    } catch (error) {
        console.error("Error updating schedule rate:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
}; 