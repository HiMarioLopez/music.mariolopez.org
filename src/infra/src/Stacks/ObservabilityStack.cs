using Amazon.CDK;
using Amazon.CDK.AWS.CloudWatch;
using Constructs;
using System.Collections.Generic;

namespace Music.Infra.Stacks;

/// <summary>
///     Stack for CloudWatch dashboards and monitoring resources
///
///     <para><b>Cost Estimation (for `us-east-1` region as of 06-07-2025):</b></para>
///     <para>
///     This stack provisions resources that incur monthly costs. The estimated baseline cost for the resources
///     defined in this stack is approximately <b>$16.20/month</b>, plus charges for CloudWatch Logs Insights queries.
///     </para>
///     <para><b>Cost Breakdown:</b></para>
///     <list type="bullet">
///         <item>
///             <b>CloudWatch Dashboards:</b> This stack provisions 5 dashboards. With the first 3 per account being free,
///             this results in 2 billable dashboards.
///             <br/><i>Cost: 2 dashboards * $3.00/dashboard = $6.00/month.</i>
///         </item>
///         <item>
///             <b>Custom Metrics:</b> This stack defines approximately 34 unique custom metrics across various namespaces
///             (e.g., `Music/AppleMusicApi`, `Music/RecommendationsApi`).
///             <br/><i>Cost: 34 metrics * $0.30/metric = $10.20/month.</i>
///         </item>
///         <item>
///             <b>Standard Metrics:</b> Standard metrics from AWS services (like AWS/Lambda, AWS/DynamoDB) are used
///             and are included in the AWS Free Tier.
///         </item>
///         <item>
///             <b>CloudWatch Logs Insights:</b> Widgets are provisioned to query logs. Cost is based on usage.
///             <br/><i>Cost: $0.005 per GB of data scanned per query.</i>
///         </item>
///     </list>
///     <para>
///     <i>Note: This is an estimate. Actual costs may vary based on usage and potential changes in AWS pricing.</i>
///     <br/>For up-to-date pricing, see the official <see href="https://aws.amazon.com/cloudwatch/pricing/">AWS CloudWatch Pricing</see> page.
///     </para>
/// </summary>
public sealed class ObservabilityStack : Stack
{
    internal ObservabilityStack(Construct scope, string id, IStackProps? props = null)
        : base(scope, id, props)
    {
        AppleMusicDashboard = new Dashboard(this, "AppleMusicApiDashboard", new DashboardProps
        {
            DashboardName = "AppleMusicApiDashboard"
        });

        MusicBrainzDashboard = new Dashboard(this, "MusicBrainzApiDashboard", new DashboardProps
        {
            DashboardName = "MusicBrainzApiDashboard"
        });

        RecommendationsDashboard = new Dashboard(this, "RecommendationsApiDashboard", new DashboardProps
        {
            DashboardName = "RecommendationsApiDashboard"
        });

        AppleMusicHistoryDashboard = new Dashboard(this, "AppleMusicHistoryDashboard", new DashboardProps
        {
            DashboardName = "AppleMusicHistoryDashboard"
        });

        TokenRefreshJobDashboard = new Dashboard(this, "TokenRefreshJobDashboard", new DashboardProps
        {
            DashboardName = "TokenRefreshJobDashboard"
        });
    }

    public Dashboard AppleMusicDashboard { get; }

    public Dashboard MusicBrainzDashboard { get; }

    public Dashboard RecommendationsDashboard { get; }

    public Dashboard AppleMusicHistoryDashboard { get; }

    public Dashboard TokenRefreshJobDashboard { get; }

    public static void AddAppleMusicDashboardWidgets(Dashboard dashboard, string dataFetchingLambdaName)
    {
        // Add standard Lambda metrics for data fetching Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Apple Music Data Fetching Lambda - Invocations",
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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

        // Add error log widget
        dashboard.AddWidgets(
            new LogQueryWidget(new LogQueryWidgetProps
            {
                Title = "Apple Music API Error Logs",
                LogGroupNames =
                [
                    $"/aws/lambda/{dataFetchingLambdaName}"
                ],
                QueryLines =
                [
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

    public static void AddMusicBrainzDashboardWidgets(Dashboard dashboard, string dataFetchingLambdaName)
    {
        // Add standard Lambda metrics
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "MusicBrainz Data Fetching Lambda - Invocations",
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                LogGroupNames =
                [
                    $"/aws/lambda/{dataFetchingLambdaName}"
                ],
                QueryLines =
                [
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

    public static void AddRecommendationsDashboardWidgets(
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                LogGroupNames =
                [
                    $"/aws/lambda/{getRecommendationsLambdaName}",
                    $"/aws/lambda/{setRecommendationsLambdaName}",
                    $"/aws/lambda/{getRecommendationNotesLambdaName}",
                    $"/aws/lambda/{setRecommendationNotesLambdaName}",
                    $"/aws/lambda/{getRecommendationReviewsLambdaName}",
                    $"/aws/lambda/{setRecommendationReviewLambdaName}"
                ],
                QueryLines =
                [
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

    public static void AddAppleMusicHistoryDashboardWidgets(
        Dashboard dashboard,
        string updateHistoryJobLambdaName,
        string historyTableName)
    {
        // Add standard Lambda metrics for Update Apple Music History Job Lambda
        dashboard.AddWidgets(new GraphWidget(new GraphWidgetProps
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
        }), new GraphWidget(new GraphWidgetProps
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
        }), new LogQueryWidget(new LogQueryWidgetProps
        {
            Title = "Error Logs",
            Width = 24,
            Height = 6,
            LogGroupNames =
            [
                $"/aws/lambda/{updateHistoryJobLambdaName}"
            ],
            QueryString = "filter @message like /Error/\n| sort @timestamp desc\n| limit 20"
        }), new GraphWidget(new GraphWidgetProps
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
        }));
    }

    public static void AddTokenRefreshJobWidgets(Dashboard dashboard, string tokenRefreshNotificationLambdaName)
    {
        // Add standard Lambda metrics for token refresh notification Lambda
        dashboard.AddWidgets(
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Token Refresh Notification Lambda - Invocations",
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                Left =
                [
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
                LogGroupNames =
                [
                    $"/aws/lambda/{tokenRefreshNotificationLambdaName}"
                ],
                QueryLines =
                [
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
}