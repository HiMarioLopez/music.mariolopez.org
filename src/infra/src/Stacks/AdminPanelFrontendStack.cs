using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Cdklabs.CdkNag;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Models.Settings;

namespace Music.Infra.Stacks;

/// <summary>
///     Defines the stack for the admin.music.mariolopez.org website.
///     This stack hosts the admin panel that allows managing Apple Music history data.
/// </summary>
public sealed class AdminPanelFrontendStack : Stack
{
    internal AdminPanelFrontendStack(Construct scope, string id, IStackProps? props = null,
        IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region Bucket

        var logBucket = new Bucket(this, "Music-AdminSiteLogBucket", new BucketProps
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

        var adminSiteBucket = new Bucket(this, "Music-AdminAssets", new BucketProps
        {
            RemovalPolicy = RemovalPolicy.DESTROY,
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            EnforceSSL = true,
            ServerAccessLogsBucket = logBucket,
            ServerAccessLogsPrefix = "admin-site-logs/"
        });

        #endregion

        #region Site Deployment

        // Deploy admin panel static site assets
        var deployAdminSite = new BucketDeployment(this, "Music-DeployAdminSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-admin-panel/music-admin-panel-react/dist")],
            DestinationBucket = adminSiteBucket
        });

        #endregion

        #region CloudFront Distribution (CDN)

        // Certificate for `*.music.mariolopez.org`
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-AdminSiteCertificate", rootCertificateArn!);

        var importedApiDomainName = Fn.ImportValue("Music-AdminApiGatewayCustomDomainName");

        var adminSiteOrigin = S3BucketOrigin.WithOriginAccessControl(adminSiteBucket, new S3BucketOriginWithOACProps
        {
            OriginAccessLevels = [AccessLevel.READ]
        });

        var distribution = new Distribution(this, "Music-AdminSiteDistribution", new DistributionProps
        {
            Certificate = rootCertificate,
            DomainNames = ["admin.music.mariolopez.org"],
            DefaultRootObject = "index.html",
            // Distribution serving the admin panel frontend for music.mariolopez.org
            DefaultBehavior = new BehaviorOptions
            {
                Origin = adminSiteOrigin,
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
                    ResponseHeadersPolicy = ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS
                }
            },
            GeoRestriction = GeoRestriction.Allowlist("US"),
            EnableLogging = true,
            LogBucket = logBucket,
            LogFilePrefix = "cloudfront-logs/"
        });

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
                Reason = "We don't manage the Node.js version for BucketDeployments' backing Lambda."
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