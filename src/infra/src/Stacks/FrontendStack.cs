using Amazon.CDK;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Experimental;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Constructs;
using System.Collections.Generic;

namespace Music.Infra.Stacks;

/// <summary>
/// Defines the stack for the music.mariolopez.org website(s).
/// </summary>
/// <remarks>
/// Pricing Information:
///     - https://aws.amazon.com/lambda/pricing/
///     - https://aws.amazon.com/cloudfront/pricing/
///     - https://aws.amazon.com/s3/pricing/
/// </remarks>
public class FrontendStack : Stack
{
    public FrontendStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
    {
        #region Bucket

        // Create an S3 bucket configured for website hosting
        var siteBucket = new Bucket(this, "Music-SiteAssets", new BucketProps
        {
            WebsiteIndexDocument = "index.html",
            WebsiteErrorDocument = "error.html",
            PublicReadAccess = true,
            RemovalPolicy = RemovalPolicy.DESTROY,
            BlockPublicAccess = new BlockPublicAccess(new BlockPublicAccessOptions { BlockPublicPolicy = false })
        });

        #endregion

        #region Site Deployments

        // Deploy Lit static site assets
        new BucketDeployment(this, "Music-DeployLitSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-lit/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "lit",
        });

        // Deploy Qwik static site assets
        new BucketDeployment(this, "Music-DeployQkiwSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-qwik/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "qwik",
        });

        // Deploy React static site assets
        new BucketDeployment(this, "Music-DeployReactSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-react/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "react",
        });

        // Deploy Solid static site assets
        new BucketDeployment(this, "Music-DeploySolidSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-solid/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "solid",
        });

        // Deploy Svelte static site assets
        new BucketDeployment(this, "Music-DeploySvelteSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-svelte/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "svelte",
        });

        // Deploy Vanilla static site assets
        new BucketDeployment(this, "Music-DeployVanillaSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-vanilla/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "vanilla",
        });

        // Deploy Vue static site assets
        new BucketDeployment(this, "Music-DeployVueSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-vue/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "vue",
        });

        // Deploy Preact static site assets
        new BucketDeployment(this, "Music-DeployPreactSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-preact/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "preact",
        });

        // Deploy Next static site assets
        new BucketDeployment(this, "Music-DeployNextSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-next/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "next",
        });

        // Deploy Angular static site assets
        new BucketDeployment(this, "Music-DeployAngularSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-angular/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "angular",
        });

        // Deploy Blazor static site assets
        new BucketDeployment(this, "Music-DeployBlazorSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-blazor/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "blazor",
        });

        // Deploy Leptos static site assets
        new BucketDeployment(this, "Music-DeployLeptosSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-leptos/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "leptos",
        });

        #endregion

        #region Route Randomization Handler

        var edgeFunction = new EdgeFunction(this, "Music-EdgeFunction", new EdgeFunctionProps
        {
            Runtime = Runtime.NODEJS_20_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../app/backend/handlers/music-frontend-randomization"),
            Description = "Randomizes the frontend to be served on `music.mariolopez.org`.",
            CurrentVersionOptions = new VersionOptions
            {
                RemovalPolicy = RemovalPolicy.DESTROY,
            }
        });

        #endregion

        #region Distribution

        // Certificate for `music.mariolopez.org`
        var rootCertificateArn = "arn:aws:acm:us-east-1:851725225504:certificate/70d15630-f6b4-495e-9d0c-572c64804dfc";
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-SiteCertificate", rootCertificateArn);

        // Import the API Gateway's custom domain name
        var importedApiDomainName = Fn.ImportValue("Music-ApiGatewayCustomDomainName");

        // Keep your Certificate and Distribution setup as before
        var distribution = new Distribution(this, "Music-SiteDistribution", new DistributionProps
        {
            // Define additional behaviors, including one for the root path
            AdditionalBehaviors = new Dictionary<string, IBehaviorOptions>
            {
                // Root Path: Randomize the frontend
                ["/"] = new BehaviorOptions
                {
                    Origin = new S3Origin(siteBucket),
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
                    OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER
                }
            },
            // Default Behavior: Redirect to the static site assets S3 bucket
            DefaultBehavior = new BehaviorOptions
            {
                Origin = new S3Origin(siteBucket),
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                // TODO: Once frontend development is 'complete', enable caching
                CachePolicy = CachePolicy.CACHING_DISABLED
            },
            Certificate = rootCertificate,
            DomainNames = ["music.mariolopez.org"]
        });

        // Note: You will need to manually update the DNS records for `music.mariolopez.org` to point to the CloudFront distribution.
        // I tried doing this in CDK but it's buggy as hell. Would not recommend (for now).

        #endregion
    }
}
