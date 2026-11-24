#!/bin/bash
# Deploy the portfolio to S3 and refresh the CloudFront cache.
set -euo pipefail
export AWS_PAGER=""
BUCKET=shoaibsrbucket
DIST=E3V4CXUQ0J48V4
cd "$(dirname "$0")"

aws s3 sync . "s3://$BUCKET" --delete \
  --exclude ".*" --exclude "*/.*" --exclude "deploy.sh" --exclude "README.md" \
  --cache-control "public, max-age=300"

aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" \
  --query 'Invalidation.Id' --output text
echo "Deployed. Live at https://d3r8nll5h7sqin.cloudfront.net/"
