using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Experimental;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Cdklabs.CdkNag;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Models.Settings;

namespace Music.Infra.Stacks;

/// <summary>
///     Defines the stack for the music.mariolopez.org website(s).
/// </summary>
/// <remarks>
///     Pricing Information:
///     - https://aws.amazon.com/lambda/pricing/
///     - https://aws.amazon.com/cloudfront/pricing/
///     - https://aws.amazon.com/s3/pricing/
/// </remarks>
public sealed class MusicFrontendStack : Stack
{
    public MusicFrontendStack(Construct scope, string id, IStackProps? props = null,
        IConfiguration? configuration = null) : base(scope, id, props)
    {
        #region Bucket

        var logBucket = new Bucket(this, "Music-SiteLogBucket", new BucketProps
        {
            RemovalPolicy = RemovalPolicy.DESTROY,
            BlockPublicAccess = new BlockPublicAccess(new BlockPublicAccessOptions
            {
                BlockPublicPolicy = true,
                RestrictPublicBuckets = true,
                BlockPublicAcls = false,
                IgnorePublicAcls = false
            }),
            EnforceSSL = true,
            ObjectOwnership = ObjectOwnership.BUCKET_OWNER_PREFERRED
        });

        var siteBucket = new Bucket(this, "Music-SiteAssets", new BucketProps
        {
            RemovalPolicy = RemovalPolicy.DESTROY,
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            EnforceSSL = true,
            ServerAccessLogsBucket = logBucket,
            ServerAccessLogsPrefix = "site-logs/"
        });

        #endregion

        #region Site Deployments

        // Deploy Lit static site assets
        var deployLitSite = new BucketDeployment(this, "Music-DeployLitSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-lit/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "lit",
            MemoryLimit = 256
        });

        // Deploy Qwik static site assets
        var deployQwikSite = new BucketDeployment(this, "Music-DeployQkiwSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-qwik/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "qwik",
            MemoryLimit = 256
        });

        // Deploy React static site assets
        var deployReactSite = new BucketDeployment(this, "Music-DeployReactSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-react/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "react",
            MemoryLimit = 256
        });

        // Deploy Solid static site assets
        var deploySolidSite = new BucketDeployment(this, "Music-DeploySolidSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-solid/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "solid",
            MemoryLimit = 256
        });

        // Deploy Svelte static site assets
        var deploySvelteSite = new BucketDeployment(this, "Music-DeploySvelteSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-svelte/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "svelte",
            MemoryLimit = 256
        });

        // Deploy Vanilla static site assets
        var deployVanillaSite = new BucketDeployment(this, "Music-DeployVanillaSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-vanilla/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "vanilla",
            MemoryLimit = 256
        });

        // Deploy Vue static site assets
        var deployVueSite = new BucketDeployment(this, "Music-DeployVueSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-vue/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "vue",
            MemoryLimit = 256
        });

        // Deploy Preact static site assets
        var deployPreactSite = new BucketDeployment(this, "Music-DeployPreactSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-preact/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "preact",
            MemoryLimit = 256
        });

        // Deploy Next static site assets
        var deployNextSite = new BucketDeployment(this, "Music-DeployNextSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-next/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "next",
            MemoryLimit = 256
        });

        // Deploy Angular static site assets
        var deployAngularSite = new BucketDeployment(this, "Music-DeployAngularSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music/music-angular/dist/music-angular/browser")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "angular",
            MemoryLimit = 256
        });

        #endregion

        #region Route Randomization Handler

        var edgeFunction = new EdgeFunction(this, "Music-EdgeFunction", new EdgeFunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "music-frontend-randomization.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/frontend"),
            Description = "Randomizes the frontend to be served on `music.mariolopez.org`.",
            CurrentVersionOptions = new VersionOptions
            {
                RemovalPolicy = RemovalPolicy.DESTROY
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region CloudFront Distribution (CDN)

        // Certificate for `music.mariolopez.org`
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-SiteCertificate", rootCertificateArn!);

        var importedApiDomainName = Fn.ImportValue("Music-ApiGatewayCustomDomainName");

        var siteOrigin = S3BucketOrigin.WithOriginAccessControl(siteBucket, new S3BucketOriginWithOACProps
        {
            OriginAccessLevels = [AccessLevel.READ]
        });

        // Keep your Certificate and Distribution setup as before
        var distribution = new Distribution(this, "Music-SiteDistribution", new DistributionProps
        {
            Certificate = rootCertificate,
            DomainNames = ["music.mariolopez.org"],
            // Default Behavior: Redirect to the static site assets S3 bucket
            DefaultBehavior = new BehaviorOptions
            {
                Origin = siteOrigin,
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                CachePolicy = CachePolicy.CACHING_DISABLED,
                EdgeLambdas =
                [
                    new EdgeLambda
                    {
                        FunctionVersion = edgeFunction.CurrentVersion,
                        EventType = LambdaEdgeEventType.ORIGIN_REQUEST
                    }
                ]
            },
            // Define additional behaviors, including one for the root path
            AdditionalBehaviors = new Dictionary<string, IBehaviorOptions>
            {
                // Root Path: Randomize the frontend
                ["/"] = new BehaviorOptions
                {
                    Origin = siteOrigin,
                    ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    EdgeLambdas =
                    [
                        new EdgeLambda
                        {
                            FunctionVersion = edgeFunction.CurrentVersion,
                            EventType = LambdaEdgeEventType.ORIGIN_REQUEST
                        }
                    ],
                    // Disable caching due to the randomization
                    CachePolicy = CachePolicy.CACHING_DISABLED
                },
                // API Path: Proxy to the API Gateway
                ["/api/*"] = new BehaviorOptions
                {
                    Origin = new HttpOrigin(importedApiDomainName, new HttpOriginProps
                    {
                        ProtocolPolicy = OriginProtocolPolicy.HTTPS_ONLY
                    }),
                    ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    CachePolicy = CachePolicy.CACHING_DISABLED,
                    AllowedMethods = AllowedMethods.ALLOW_ALL,
                    OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER,
                    ResponseHeadersPolicy = ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS
                }
            },
            EnableLogging = true,
            LogBucket = logBucket,
            LogFilePrefix = "cloudfront-logs/"
        });

        // Note: You will need to manually update the DNS records for `music.mariolopez.org` to point to the CloudFront distribution.
        // I tried doing this in CDK, but it's buggy as hell. Would not recommend (for now).

        #endregion

        #region CDK Nag Suppressions

        NagSuppressions.AddStackSuppressions(this, [
            new NagPackSuppression
            {
                Id = "AwsSolutions-IAM4",
                Reason = "Permissions are implicitly defined with managed policies."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-IAM5",
                Reason = "Permissions are implicitly defined with wildcards."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-L1",
                Reason = "Latest Node.js version is not always supported by Lambda@Edge; " +
                         "We don't manage the Node.js version for BucketDeployments' backing Lambda."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-CFR1",
                Reason = "We don't want to restrict our CDN to any regions."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-CFR2",
                Reason = "Default protections are fine; Extra fees associated with WAF."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-S2",
                Reason = "Public bucket access is blocked, only allowing Public ACLs for CloudFront logging bucket."
            }
        ]);

        #endregion
    }
}