using Amazon.CDK;
using Cdklabs.CdkNag;
using Music.Infra.Config;
using Music.Infra.Stacks;

namespace Music.Infra;

public static class Program
{
    public static void Main()
    {
        var app = new App();

        Aspects.Of(app).Add(new AwsSolutionsChecks());

        var configuration = ConfigurationHelper.BuildConfiguration();

        var accountId = configuration["AWS:AccountId"];
        var defaultRegion = configuration["AWS:Region"];

        var env = new Environment { Account = accountId, Region = defaultRegion };

        var tokenRefreshNotificationStack = new TokenRefreshNotificationStack(app, "TokenRefreshNotificationStack", new StackProps
        {
            Env = env,
            StackName = "TokenRefreshNotificationStack",
            Description = "This stack contains resources for automated (usually chron) jobs."
        }, configuration);

        var integrationApiStack = new IntegrationApiStack(app, "IntegrationApiStack",
            tokenRefreshNotificationStack.TokenRefreshTopic,
            new StackProps
            {
                Env = env,
                StackName = "IntegrationApiStack",
                Description = "This stack contains the API Gateway and Lambda function(s) for the Music application."
            }, configuration);

        integrationApiStack.AddDependency(tokenRefreshNotificationStack);

        var frontendStack = new MusicFrontendStack(app, "MusicFrontendStack", new StackProps
        {
            Env = env,
            StackName = "MusicFrontendStack",
            Description =
                "This stack contains the S3 bucket and CloudFront distribution for the primary Music application."
        }, configuration);

        frontendStack.AddDependency(integrationApiStack);

        var adminApiStack = new AdminApiStack(app, "AdminApiStack", new StackProps
        {
            Env = env,
            StackName = "AdminApiStack",
            Description =
                "This stack contains the API Gateway and Lambda function(s) for the admin panel for the Music application."
        }, configuration);

        var adminPanelFrontendStack = new AdminPanelFrontendStack(app, "AdminPanelFrontendStack", new StackProps
        {
            Env = env,
            StackName = "AdminPanelFrontendStack",
            Description = "This stack contains resources for the admin panel for the Music application."
        }, configuration);

        adminPanelFrontendStack.AddDependency(adminApiStack);

        var historyStack = new AppleMusicHistoryStack(app, "AppleMusicHistoryStack", new StackProps
        {
            Env = env,
            StackName = "AppleMusicHistoryStack",
            Description = "This stack contains resources for recording and displaying Apple Music listening history."
        }, configuration);

        historyStack.AddDependency(integrationApiStack);

        var recommendationStack = new RecommendationStack(app, "RecommendationStack", new StackProps
        {
            Env = env,
            StackName = "RecommendationStack",
            Description = "This stack contains resources for storing and retrieving music recommendations."
        }, configuration);

        recommendationStack.AddDependency(integrationApiStack);

        var moderationJobStack = new ModerationJobStack(app, "ModerationJobStack", new StackProps
        {
            Env = env,
            StackName = "ModerationJobStack",
            Description = "This stack contains resources for the moderation (chron) job."
        }, configuration);

        #region Observability Stack (Disabled for cost reasons)

        // var observabilityStack = new ObservabilityStack(app, "ObservabilityStack", new StackProps
        // {
        //     Env = env,
        //     StackName = "ObservabilityStack",
        //     Description = "This stack contains CloudWatch dashboards for monitoring the Music application."
        // });

        // observabilityStack.AddDependency(integrationApiStack);
        // observabilityStack.AddDependency(historyStack);
        // observabilityStack.AddDependency(tokenRefreshNotificationStack);

        // // Add widgets to the Apple Music dashboard
        // observabilityStack.AddAppleMusicDashboardWidgets(
        //     observabilityStack.AppleMusicDashboard,
        //     integrationApiStack.AppleMusicDataFetchingLambdaName);

        // // Add widgets to the MusicBrainz dashboard
        // observabilityStack.AddMusicBrainzDashboardWidgets(
        //     observabilityStack.MusicBrainzDashboard,
        //     integrationApiStack.MusicBrainzDataFetchingLambdaName);

        // // Add widgets to the Recommendations dashboard
        // observabilityStack.AddRecommendationsDashboardWidgets(
        //     observabilityStack.RecommendationsDashboard,
        //     integrationApiStack.GetRecommendationsLambdaName,
        //     integrationApiStack.SetRecommendationsLambdaName,
        //     integrationApiStack.GetRecommendationNotesLambdaName,
        //     integrationApiStack.SetRecommendationNotesLambdaName,
        //     integrationApiStack.GetRecommendationReviewsLambdaName,
        //     integrationApiStack.SetRecommendationReviewLambdaName);

        // // Add widgets to the Apple Music History dashboard
        // observabilityStack.AddAppleMusicHistoryDashboardWidgets(
        //     observabilityStack.AppleMusicHistoryDashboard,
        //     historyStack.UpdateHistoryJobLambdaName,
        //     historyStack.HistoryTableName);

        // // Add widgets to the Token Refresh Job dashboard
        // observabilityStack.AddTokenRefreshJobWidgets(
        //     observabilityStack.TokenRefreshJobDashboard,
        //     tokenRefreshNotificationStack.TokenRefreshNotificationLambdaName);

        #endregion

        app.Synth();
    }
}