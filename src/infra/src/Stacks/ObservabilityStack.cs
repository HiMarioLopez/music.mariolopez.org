using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.CloudWatch;
using Constructs;

namespace Music.Infra.Stacks;

/// <summary>
/// Stack for CloudWatch dashboards and monitoring resources
/// </summary>
public class ObservabilityStack : Stack
{
    /// <summary>
    /// Dashboard for Apple Music API metrics
    /// </summary>
    public Dashboard AppleMusicDashboard { get; }

    /// <summary>
    /// Dashboard for MusicBrainz API metrics
    /// </summary>
    public Dashboard MusicBrainzDashboard { get; }

    /// <summary>
    /// Dashboard for Recommendations API metrics
    /// </summary>
    public Dashboard RecommendationsDashboard { get; }

    /// <summary>
    /// Dashboard for Apple Music History metrics
    /// </summary>
    public Dashboard AppleMusicHistoryDashboard { get; }

    internal ObservabilityStack(Construct scope, string id, IStackProps? props = null)
        : base(scope, id, props)
    {
        // Create the Apple Music API dashboard
        AppleMusicDashboard = new Dashboard(this, "AppleMusicApiDashboard", new DashboardProps
        {
            DashboardName = "AppleMusicApiDashboard"
        });

        // Create the MusicBrainz API dashboard
        MusicBrainzDashboard = new Dashboard(this, "MusicBrainzApiDashboard", new DashboardProps
        {
            DashboardName = "MusicBrainzApiDashboard"
        });

        // Create the Recommendations API dashboard
        RecommendationsDashboard = new Dashboard(this, "RecommendationsApiDashboard", new DashboardProps
        {
            DashboardName = "RecommendationsApiDashboard"
        });

        // Create the Apple Music History dashboard
        AppleMusicHistoryDashboard = new Dashboard(this, "AppleMusicHistoryDashboard", new DashboardProps
        {
            DashboardName = "AppleMusicHistoryDashboard"
        });
    }

    /// <summary>
    /// Adds widgets to the Apple Music API dashboard
    /// </summary>
    public void AddAppleMusicDashboardWidgets(Dashboard dashboard, string dataFetchingLambdaName, string tokenRefreshNotificationLambdaName)
    {
        // Add standard Lambda metrics for data fetching Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Apple Music Data Fetching Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Apple Music Data Fetching Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Apple Music Data Fetching Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for data fetching Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Apple Music Data Fetching - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/AppleMusicApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/AppleMusicApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/AppleMusicApi",
                        MetricName = "CacheHitCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/AppleMusicApi",
                        MetricName = "CacheMissCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add standard Lambda metrics for token refresh notification Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Token Refresh Notification Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = tokenRefreshNotificationLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Token Refresh Notification Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = tokenRefreshNotificationLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Token Refresh Notification Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = tokenRefreshNotificationLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for token refresh notification Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Token Refresh Notification - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/AppleMusicApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = tokenRefreshNotificationLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/AppleMusicApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = tokenRefreshNotificationLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/AppleMusicApi",
                        MetricName = "EmailSentCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = tokenRefreshNotificationLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add error log widget
        dashboard.AddWidgets(
            new LogQueryWidget(new LogQueryWidgetProps
            {
                Title = "Apple Music API Error Logs",
                LogGroupNames = [
                    $"/aws/lambda/{dataFetchingLambdaName}",
                    $"/aws/lambda/{tokenRefreshNotificationLambdaName}"
                ],
                QueryLines = [
                    "fields @timestamp, @message",
                    "filter level = 'ERROR'",
                    "sort @timestamp desc",
                    "limit 20"
                ],
                Width = 24,
                Height = 8
            })
        );
    }

    /// <summary>
    /// Adds widgets to the MusicBrainz API dashboard
    /// </summary>
    public void AddMusicBrainzDashboardWidgets(Dashboard dashboard, string dataFetchingLambdaName)
    {
        // Add standard Lambda metrics
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "MusicBrainz Data Fetching Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "MusicBrainz Data Fetching Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "MusicBrainz Data Fetching Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "MusicBrainz Data Fetching - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/MusicBrainzApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/MusicBrainzApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/MusicBrainzApi",
                        MetricName = "CacheHitCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/MusicBrainzApi",
                        MetricName = "CacheMissCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = dataFetchingLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add error log widget
        dashboard.AddWidgets(
            new LogQueryWidget(new LogQueryWidgetProps
            {
                Title = "MusicBrainz API Error Logs",
                LogGroupNames = [
                    $"/aws/lambda/{dataFetchingLambdaName}"
                ],
                QueryLines = [
                    "fields @timestamp, @message",
                    "filter level = 'ERROR'",
                    "sort @timestamp desc",
                    "limit 20"
                ],
                Width = 24,
                Height = 8
            })
        );
    }

    /// <summary>
    /// Adds widgets to the Recommendations API dashboard
    /// </summary>
    public void AddRecommendationsDashboardWidgets(
        Dashboard dashboard,
        string getRecommendationsLambdaName,
        string setRecommendationsLambdaName,
        string getRecommendationNotesLambdaName,
        string setRecommendationNotesLambdaName,
        string getRecommendationReviewsLambdaName,
        string setRecommendationReviewLambdaName)
    {
        // Add standard Lambda metrics for Get Recommendations Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendations Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendations Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendations Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationsLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for Get Recommendations Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendations - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ResultCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add standard Lambda metrics for Set Recommendations Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendations Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendations Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendations Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationsLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for Set Recommendations Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendations - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "CreationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "UpdateCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add standard Lambda metrics for Get Recommendation Notes Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Notes Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Notes Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Notes Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationNotesLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for Get Recommendation Notes Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Notes - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ResultCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add standard Lambda metrics for Set Recommendation Notes Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Notes Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Notes Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Notes Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationNotesLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for Set Recommendation Notes Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Notes - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "CreationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "UpdateCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationNotesLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add standard Lambda metrics for Get Recommendation Reviews Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Reviews Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationReviewsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Reviews Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationReviewsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Reviews Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationReviewsLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for Get Recommendation Reviews Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Get Recommendation Reviews - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationReviewsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationReviewsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ResultCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = getRecommendationReviewsLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add standard Lambda metrics for Set Recommendation Review Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Review Lambda - Invocations",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationReviewLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Review Lambda - Errors",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationReviewLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Review Lambda - Duration",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationReviewLambdaName
                        },
                        Statistic = "Average",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 12,
                Height = 6
            })
        );

        // Add custom metrics for Set Recommendation Review Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Set Recommendation Review - Custom Metrics",
                Left = [
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "InvocationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationReviewLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "ErrorCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationReviewLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "CreationCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationReviewLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "Music/RecommendationsApi",
                        MetricName = "UpdateCount",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            ["FunctionName"] = setRecommendationReviewLambdaName
                        },
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                Width = 24,
                Height = 8
            })
        );

        // Add error log widget
        dashboard.AddWidgets(
            new LogQueryWidget(new LogQueryWidgetProps
            {
                Title = "Recommendations API Error Logs",
                LogGroupNames = [
                    $"/aws/lambda/{getRecommendationsLambdaName}",
                    $"/aws/lambda/{setRecommendationsLambdaName}",
                    $"/aws/lambda/{getRecommendationNotesLambdaName}",
                    $"/aws/lambda/{setRecommendationNotesLambdaName}",
                    $"/aws/lambda/{getRecommendationReviewsLambdaName}",
                    $"/aws/lambda/{setRecommendationReviewLambdaName}"
                ],
                QueryLines = [
                    "fields @timestamp, @message",
                    "filter level = 'ERROR'",
                    "sort @timestamp desc",
                    "limit 20"
                ],
                Width = 24,
                Height = 8
            })
        );
    }

    /// <summary>
    /// Adds widgets to the Apple Music History dashboard
    /// </summary>
    public void AddAppleMusicHistoryDashboardWidgets(
        Dashboard dashboard,
        string updateHistoryJobLambdaName,
        string historyTableName)
    {
        dashboard.AddWidgets(
        [
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Update Apple Music History Job",
                Width = 12,
                Height = 6,
                Left =
                [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", updateHistoryJobLambdaName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", updateHistoryJobLambdaName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", updateHistoryJobLambdaName }
                        }
                    })
                ]
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "DynamoDB Table",
                Width = 12,
                Height = 6,
                Left =
                [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/DynamoDB",
                        MetricName = "ConsumedReadCapacityUnits",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "TableName", historyTableName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/DynamoDB",
                        MetricName = "ConsumedWriteCapacityUnits",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "TableName", historyTableName }
                        }
                    })
                ]
            }),
            new LogQueryWidget(new LogQueryWidgetProps
            {
                Title = "Error Logs",
                Width = 24,
                Height = 6,
                LogGroupNames =
                [
                    $"/aws/lambda/{updateHistoryJobLambdaName}"
                ],
                QueryString = "filter @message like /Error/\n| sort @timestamp desc\n| limit 20"
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Songs Processed",
                Width = 24,
                Height = 8,
                Left =
                [
                    new Metric(new MetricProps
                    {
                        Namespace = "AppleMusicHistory",
                        MetricName = "SongsProcessed",
                        Statistic = "Sum",
                        Period = Duration.Minutes(5)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AppleMusicHistory",
                        MetricName = "NewSongsStored",
                        Statistic = "Sum",
                        Period = Duration.Minutes(5)
                    })
                ],
                View = GraphWidgetView.TIME_SERIES
            })
        ]);
    }
}