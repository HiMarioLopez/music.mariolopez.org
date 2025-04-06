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
/// - OpenAI API key storage for moderation
/// </remarks>
public class RecommendationStack : Stack
{
    internal RecommendationStack(Construct scope, string id, IStackProps? props = null, IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region Recommendations Table (metadata, votes, etc.)

        var recommendationTable = new Table(this, "MusicRecommendations", new TableProps
        {
            TableName = "MusicRecommendations",
            PartitionKey = new Attribute
            {
                Name = "recommendationId",
                Type = AttributeType.STRING
            },
            BillingMode = BillingMode.PAY_PER_REQUEST,
        });

        // GSI for sorting by votes (for Recommendation Leaderboards)
        recommendationTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
        {
            IndexName = "EntityTypeVotesIndex",
            PartitionKey = new Attribute { Name = "entityType", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "votes", Type = AttributeType.NUMBER },
            ProjectionType = ProjectionType.ALL
        });

        #endregion

        #region Notes Table (individual notes with moderation status)

        var notesTable = new Table(this, "MusicRecommendationNotes", new TableProps
        {
            TableName = "MusicRecommendationNotes",
            PartitionKey = new Attribute
            {
                Name = "recommendationId",
                Type = AttributeType.STRING
            },
            SortKey = new Attribute
            {
                Name = "noteId",
                Type = AttributeType.STRING
            },
            BillingMode = BillingMode.PAY_PER_REQUEST,
        });

        // GSI to find all notes pending moderation (for moderation queue)
        notesTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
        {
            IndexName = "NoteModerationStatusIndex",
            PartitionKey = new Attribute { Name = "moderationStatus", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "noteTimestamp", Type = AttributeType.STRING },
            ProjectionType = ProjectionType.ALL
        });

        // GSI to find all notes from (me) Mario (These notes resemble a 'review' of the recommendation)
        notesTable.AddGlobalSecondaryIndex(new GlobalSecondaryIndexProps
        {
            IndexName = "UserNotesIndex",
            PartitionKey = new Attribute
            {
                Name = "isFromUser",
                Type = AttributeType.NUMBER // This is a bit of a hack to get around the fact that DynamoDB doesn't support boolean types
            },
            SortKey = new Attribute
            {
                Name = "noteTimestamp",
                Type = AttributeType.STRING
            },
            ProjectionType = ProjectionType.ALL
        });

        #endregion

        #region Secrets and SSM Parameters

        var recommendationTableNameParameter = new StringParameter(this, "RecommendationTableNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/Recommendations/TableName",
            StringValue = recommendationTable.TableName,
            Description = "DynamoDB table for music recommendations"
        });

        var recommendationTableIndexNameParameter = new StringParameter(this, "RecommendationTableIndexNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/Recommendations/EntityTypeVotesIndexName",
            StringValue = "EntityTypeVotesIndex",
            Description = "GSI for sorting by votes (for Recommendation Leaderboards)"
        });

        var notesTableNameParameter = new StringParameter(this, "NotesTableNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/Recommendations/NotesTableName",
            StringValue = notesTable.TableName,
            Description = "DynamoDB table for recommendation notes"
        });

        var notesModerationIndexNameParameter = new StringParameter(this, "NotesModerationIndexNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/Recommendations/NotesModerationStatusIndexName",
            StringValue = "NoteModerationStatusIndex",
            Description = "GSI for filtering notes by moderation status (for moderation queue)"
        });

        var userNotesIndexNameParameter = new StringParameter(this, "UserNotesIndexNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/Recommendations/UserNotesIndexName",
            StringValue = "UserNotesIndex",
            Description = "GSI for querying Mario's reviews"
        });


        var openAiApiKeyParameter = new StringParameter(this, "OpenAIApiKeyParameter", new StringParameterProps
        {
            ParameterName = "/Music/Moderation/OpenAIApiKey",
            StringValue = "PLACEHOLDER-POPULATE-AFTER-DEPLOYMENT",
            Description = "OpenAI API Key for moderation"
        });

        #endregion
    }
}
