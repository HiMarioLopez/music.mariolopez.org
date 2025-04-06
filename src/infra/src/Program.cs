using Amazon.CDK;
using Music.Infra.Stacks;
using Music.Infra.Config;

namespace Music.Infra;

public static class Program
{
    public static void Main()
    {
        var app = new App();
        var configuration = ConfigurationHelper.BuildConfiguration();

        var accountId = configuration["AWS:AccountId"];
        var defaultRegion = configuration["AWS:Region"];

        var env = new Environment { Account = accountId, Region = defaultRegion };

        var apiStack = new IntegrationApiStack(app, "IntegrationApiStack", new StackProps
        {
            Env = env,
            StackName = "IntegrationApiStack",
            Description = "This stack contains the API Gateway and Lambda function(s) for the Music application."
        }, configuration);

        var frontendStack = new MusicFrontendStack(app, "MusicFrontendStack", new StackProps
        {
            Env = env,
            StackName = "MusicFrontendStack",
            Description = "This stack contains the S3 bucket and CloudFront distribution for the primary Music application."
        }, configuration);

        frontendStack.AddDependency(apiStack);

        var adminPanelStack = new AdminPanelStack(app, "AdminPanelStack", new StackProps
        {
            Env = env,
            StackName = "AdminPanelStack",
            Description = "This stack contains resources for the admin panel for the Music application."
        }, configuration);

        adminPanelStack.AddDependency(apiStack);
        adminPanelStack.AddDependency(frontendStack);

        // Add Apple Music History stack
        var historyStack = new AppleMusicHistoryStack(app, "AppleMusicHistoryStack", new StackProps
        {
            Env = env,
            StackName = "AppleMusicHistoryStack",
            Description = "This stack contains resources for recording and displaying Apple Music listening history."
        }, configuration);

        // Add dependency on the API stack as we'll need the Apple Music token
        historyStack.AddDependency(apiStack);

        // Add Recommendation stack
        var recommendationStack = new RecommendationStack(app, "RecommendationStack", new StackProps
        {
            Env = env,
            StackName = "RecommendationStack",
            Description = "This stack contains resources for storing and retrieving music recommendations."
        }, configuration);

        // Add dependency on the API stack for integration
        recommendationStack.AddDependency(apiStack);

        // Add CloudWatch Dashboards stack
        var observabilityStack = new ObservabilityStack(app, "ObservabilityStack", new StackProps
        {
            Env = env,
            StackName = "ObservabilityStack",
            Description = "This stack contains CloudWatch dashboards for monitoring the Music application."
        });

        // Add dependency on the API stack as we need the Lambda functions for the dashboards
        observabilityStack.AddDependency(apiStack);

        // Add widgets to the Apple Music dashboard
        observabilityStack.AddAppleMusicDashboardWidgets(
            observabilityStack.AppleMusicDashboard,
            apiStack.AppleMusicDataFetchingLambdaName,
            apiStack.TokenRefreshNotificationLambdaName);

        // Add widgets to the MusicBrainz dashboard
        observabilityStack.AddMusicBrainzDashboardWidgets(
            observabilityStack.MusicBrainzDashboard,
            apiStack.MusicBrainzDataFetchingLambdaName);

        // Add widgets to the Recommendations dashboard
        observabilityStack.AddRecommendationsDashboardWidgets(
            observabilityStack.RecommendationsDashboard,
            apiStack.GetRecommendationsLambdaName,
            apiStack.SetRecommendationsLambdaName,
            apiStack.GetRecommendationNotesLambdaName,
            apiStack.SetRecommendationNotesLambdaName,
            apiStack.GetRecommendationReviewsLambdaName,
            apiStack.SetRecommendationReviewLambdaName);

        app.Synth();
    }
}
