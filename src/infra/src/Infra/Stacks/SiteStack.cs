using Amazon.CDK;
using Amazon.CDK.AWS.S3;
using Constructs;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.CloudFront.Experimental;
using Amazon.CDK.AWS.Lambda;

namespace Infra.Stacks;

/// <summary>
/// Defines the stack for the music.mariolopez.org website(s).
/// </summary>
/// <remarks>
/// Pricing Information:
///     - https://aws.amazon.com/lambda/pricing/
///     - https://aws.amazon.com/cloudfront/pricing/
///     - https://aws.amazon.com/s3/pricing/
/// </remarks>
public class SiteStack : Stack
{
    public SiteStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
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

        // Deploy Lit site assets
        new BucketDeployment(this, "Music-DeployLitSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-lit/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "lit",
        });

        // Deploy Qwik site assets
        new BucketDeployment(this, "Music-DeployQkiwSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-qwik/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "qwik",
        });

        // Deploy React site assets
        new BucketDeployment(this, "Music-DeployReactSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-react/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "react",
        });

        // Deploy Solid site assets
        new BucketDeployment(this, "Music-DeploySolidSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-solid/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "solid",
        });

        // Deploy Svelte site assets
        new BucketDeployment(this, "Music-DeploySvelteSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-svelte/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "svelte",
        });

        // Deploy Vanilla site assets
        new BucketDeployment(this, "Music-DeployVanillaSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-vanilla/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "vanilla",
        });

        // Deploy Vue site assets
        new BucketDeployment(this, "Music-DeployVueSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-vue/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "vue",
        });

        // Deploy Preact site assets
        new BucketDeployment(this, "Music-DeployPreactSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-preact/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "preact",
        });

        // Deploy Next site assets
        new BucketDeployment(this, "Music-DeployNextSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-next/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "next",
        });

        // Deploy Angular site assets
        new BucketDeployment(this, "Music-DeployAngularSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-angular/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "angular",
        });

        #endregion

        #region Route Randomization Handler

        var edgeFunction = new EdgeFunction(this, "Music-EdgeFunction", new EdgeFunctionProps
        {
            Runtime = Runtime.NODEJS_20_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../backend/handlers/frontend-route-randomization-handler"),
            Description = "Randomizes the frontend to be served on `music.mariolopez.org`.",
            CurrentVersionOptions = new VersionOptions
            {
                RemovalPolicy = RemovalPolicy.DESTROY,
            }
        });

        #endregion

        #region Distribution

        // Certificate for music.mariolopez.org
        var rootCertificateArn = "arn:aws:acm:us-east-1:851725225504:certificate/70d15630-f6b4-495e-9d0c-572c64804dfc";
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-SiteCertificate", rootCertificateArn);

        // Create a CloudFront distribution for the S3 bucket
        var distribution = new Distribution(this, "Music-SiteDistribution", new DistributionProps
        {
            DefaultBehavior = new BehaviorOptions
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
                CachePolicy = CachePolicy.CACHING_DISABLED
            },
            Certificate = rootCertificate,
            DomainNames = ["music.mariolopez.org"]
        });

        // Output the distribution domain name
        new CfnOutput(this, "Music-DistributionDomainName", new CfnOutputProps
        {
            Value = distribution.DistributionDomainName
        });

        #endregion
    }
}
