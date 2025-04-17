using Amazon.CDK;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Constructs;
using Amazon.CDK.AWS.CloudFront;
using Microsoft.Extensions.Configuration;
using Music.Infra.Models.Settings;
using System.Collections.Generic;

namespace Music.Infra.Stacks;

/// <summary>
/// Defines the stack for the admin.music.mariolopez.org website.
/// This stack hosts the admin panel that allows managing Apple Music history data.
/// </summary>
public class AdminPanelFrontendStack : Stack
{
    internal AdminPanelFrontendStack(Construct scope, string id, IStackProps? props = null, IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region Bucket

        // Create an S3 bucket configured for website hosting
        var adminBucket = new Bucket(this, "Music-AdminAssets", new BucketProps
        {
            WebsiteIndexDocument = "index.html",
            WebsiteErrorDocument = "error.html",
            PublicReadAccess = true,
            RemovalPolicy = RemovalPolicy.DESTROY,
            BlockPublicAccess = new BlockPublicAccess(new BlockPublicAccessOptions { BlockPublicPolicy = false })
        });

        #endregion

        #region Site Deployment

        // Deploy admin panel static site assets
        var deployAdminSite = new BucketDeployment(this, "Music-DeployAdminSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-admin-panel/music-admin-panel-react/dist")],
            DestinationBucket = adminBucket
        });

        #endregion

        #region Distribution

        // Certificate for `*.music.mariolopez.org`
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-AdminSiteCertificate", rootCertificateArn!);

        // Import the API Gateway's custom domain name
        var importedApiDomainName = Fn.ImportValue("Music-AdminApiGatewayCustomDomainName");

        // Create CloudFront distribution for the admin panel
        var distribution = new Distribution(this, "Music-AdminSiteDistribution", new DistributionProps
        {
            // Distribution serving the admin panel frontend for music.mariolopez.org
            DefaultBehavior = new BehaviorOptions
            {
                Origin = new S3StaticWebsiteOrigin(adminBucket),
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                // Disable caching during development
                CachePolicy = CachePolicy.CACHING_DISABLED
            },
            // Define additional behaviors, including one for the root path
            AdditionalBehaviors = new Dictionary<string, IBehaviorOptions>
            {
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
                    ResponseHeadersPolicy = ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
                }
            },
            Certificate = rootCertificate,
            DomainNames = ["admin.music.mariolopez.org"]
        });

        #endregion
    }
}
