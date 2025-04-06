namespace Music.Infra.Models.Settings;

public class AwsSettings
{
    public string AccountId { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string CertificateArn { get; set; } = string.Empty;
}