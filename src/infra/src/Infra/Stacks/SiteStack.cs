using Amazon.CDK;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.CloudFront;
using Constructs;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;

namespace Infra.Stacks;

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

        #region CloudFront

        // Create a CloudFront OAI for the S3 bucket
        var originAccessIdentity = new OriginAccessIdentity(this, "Music-OAI", new OriginAccessIdentityProps
        {
            Comment = "OAI for React Site"
        });

        // Restrict bucket access to the OAI
        siteBucket.GrantRead(originAccessIdentity);

        var certificateArn = "arn:aws:acm:us-east-1:851725225504:certificate/27ef25f9-83b8-4a24-8a59-a3e2c32dfb74";
        var certificate = Certificate.FromCertificateArn(this, "Music-SiteCertificate", certificateArn);

        // Create a CloudFront distribution for the S3 bucket
        var distribution = new CloudFrontWebDistribution(this, "Music-SiteDistribution", new CloudFrontWebDistributionProps
        {
            OriginConfigs = [
                new SourceConfiguration {
                    S3OriginSource = new S3OriginConfig {
                        S3BucketSource = siteBucket,
                        OriginAccessIdentity = originAccessIdentity
                    },
                    Behaviors = [
                        new Behavior {
                            PathPattern = "/react/*",
                            IsDefaultBehavior = true
                        },
                    ]
                }
            ],
            // Configure the default behavior if needed, or specify a custom error page.
            ErrorConfigurations = [
                new CfnDistribution.CustomErrorResponseProperty {
                    ErrorCode = 404,
                    ResponsePagePath = "/react/index.html", // Default app or specify per app basis
                    ResponseCode = 200,
                    ErrorCachingMinTtl = 300
                }
            ],
            // Adding custom domain and ACM certificate
            ViewerCertificate = ViewerCertificate.FromAcmCertificate(certificate, new ViewerCertificateOptions
            {
                Aliases = ["music.mariolopez.org"],
                SecurityPolicy = SecurityPolicyProtocol.TLS_V1_2_2021,
                SslMethod = SSLMethod.SNI
            }),
        });

        // Output the distribution domain name so you can easily access it
        new CfnOutput(this, "Music-DistributionDomainName", new CfnOutputProps
        {
            Value = distribution.DistributionDomainName
        });

        #endregion

        #region Site Asset Upload(s)

        // Deploy React site assets
        new BucketDeployment(this, "Music-DeployReactSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../frontend/music-react/dist")],
            DestinationBucket = siteBucket,
            DestinationKeyPrefix = "react",
        });

        #endregion

        #region Domain Resolution

        // Lookup the hosted zone for music.mariolopez.org
        var hostedZone = HostedZone.FromLookup(this, "HostedZone", new HostedZoneProviderProps
        {
            DomainName = "music.mariolopez.org",
        });

        // Create an A record for the CloudFront distribution
        new ARecord(this, "AliasRecord", new ARecordProps
        {
            Zone = hostedZone,
            RecordName = "", // For the root of music.mariolopez.org, you leave this empty
            Target = RecordTarget.FromAlias(new CloudFrontTarget(distribution)),
        });

        #endregion
    }
}
