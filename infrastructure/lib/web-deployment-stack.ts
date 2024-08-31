import * as cdk from "aws-cdk-lib";
import {Distribution, OriginAccessIdentity} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";
import {Construct} from "constructs";
import {existsSync} from "fs";
import path = require("path");

export class WebDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const distDir = path.join(__dirname, "../..", "web", "dist");
    if (!existsSync(distDir)) {
      console.warn(`Web distribution directory ${distDir} does not exist`);
      return;
    }

    const deploymentBucket = new Bucket(this, "WebDeploymentBucket");
    const originIdentity = new OriginAccessIdentity(
      this,
      "OriginAccessIdentity",
    );
    deploymentBucket.grantRead(originIdentity);
    const distribution = new Distribution(this, "WebDeploymentDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new S3Origin(deploymentBucket, {
          originAccessIdentity: originIdentity,
        }),
      },
    });

    new BucketDeployment(this, "WebDeployment", {
      destinationBucket: deploymentBucket,
      sources: [Source.asset(distDir)],
      distribution,
      // distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "WebDeploymentDistributionDomainName", {
      value: distribution.distributionDomainName,
    });
  }
}
