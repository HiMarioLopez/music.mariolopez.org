using Amazon.CDK;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.SSM;
using Constructs;
using Microsoft.Extensions.Configuration;

namespace Music.Infra.Stacks;

/// <summary>
/// Defines the stack for the Music Recommendations feature.
/// </summary>
/// <remarks>
/// This stack contains resources for storing and retrieving music recommendations:
/// - DynamoDB table for recommendation storage
/// - Lambda functions for getting and setting recommendations
/// - SSM Parameters for configuration
/// </remarks>
public class RecommendationStack : Stack
{
    internal RecommendationStack(Construct scope, string id, IStackProps props = null, IConfiguration configuration = null)
        : base(scope, id, props)
    {
        #region DynamoDB Table

        var recommendationTable = new Table(this, "MusicRecommendations", new TableProps
        {
            TableName = "MusicRecommendations",
            PartitionKey = new Attribute { Name = "entityType", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "timestamp", Type = AttributeType.STRING },  // Using timestamp as sort key for uniqueness
            BillingMode = BillingMode.PAY_PER_REQUEST,
        });

        // Add a Global Secondary Index for sorting by votes (for Recommendation Leaderboards)
        recommendationTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
        {
            IndexName = "EntityTypeVotesIndex",
            PartitionKey = new Attribute { Name = "entityType", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "votes", Type = AttributeType.NUMBER },
            ProjectionType = ProjectionType.ALL
        });

        #endregion

        #region SSM Parameters

        // Store the table name in SSM Parameter Store for easy retrieval
        var recommendationTableNameParameter = new StringParameter(this, "RecommendationTableNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/Recommendations/TableName",
            StringValue = recommendationTable.TableName,
            Description = "Name of the DynamoDB table storing music recommendations"
        });

        var recommendationTableIndexNameParameter = new StringParameter(this, "RecommendationTableIndexNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/Recommendations/EntityTypeVotesIndexName",
            StringValue = "EntityTypeVotesIndex",
            Description = "Name of the DynamoDB table index storing music recommendations"
        });

        #endregion
    }
}
