#!/bin/bash

# Todo Tool AWS Deployment Script
set -e

# Configuration
ENVIRONMENT=${1:-prod}
AWS_REGION=${2:-us-east-1}
STACK_NAME="todo-tool-${ENVIRONMENT}"
DB_PASSWORD=${3:-$(openssl rand -base64 32)}

echo "🚀 Deploying Todo Tool to AWS"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "Stack: $STACK_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Step 1: Deploy Infrastructure
echo "📦 Deploying infrastructure..."
aws cloudformation deploy \
    --template-file aws/cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DBPassword=$DB_PASSWORD \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

echo "✅ Infrastructure deployed"

# Get outputs from CloudFormation
DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)

echo "Database Endpoint: $DB_ENDPOINT"
echo "Frontend Bucket: $FRONTEND_BUCKET"

# Step 2: Build and Push Backend Docker Image
echo "🐳 Building backend Docker image..."
cd backend

# Create ECR repository if it doesn't exist
REPO_NAME="todo-tool-backend"
aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION

# Get ECR login token
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# Build and tag image
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest"

docker build -t $REPO_NAME .
docker tag $REPO_NAME:latest $IMAGE_URI
docker push $IMAGE_URI

echo "✅ Backend image pushed to ECR: $IMAGE_URI"
cd ..

# Step 3: Deploy Backend to ECS (simplified - you might want to use ECS CLI or CDK)
echo "🚀 Backend deployment to ECS would go here..."
echo "   You'll need to create ECS cluster, task definition, and service"
echo "   Image URI: $IMAGE_URI"
echo "   Database URL: postgresql://todouser:$DB_PASSWORD@$DB_ENDPOINT:5432/todoapp"

# Step 4: Build and Deploy Frontend
echo "🌐 Building and deploying frontend..."
cd frontend

# Install dependencies and build
npm install
npm run build

# Deploy to S3
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete --region $AWS_REGION

echo "✅ Frontend deployed to S3"
cd ..

# Step 5: Output final URLs
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue' \
    --output text)

echo ""
echo "🎉 Deployment Complete!"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend Image: $IMAGE_URI"
echo "Database Endpoint: $DB_ENDPOINT"
echo ""
echo "⚠️  Next Steps:"
echo "1. Set up ECS cluster and deploy backend container"
echo "2. Configure CloudFront distribution for frontend"
echo "3. Set up custom domain with Route 53 (optional)"
echo "4. Configure SSL certificate with ACM (optional)"
echo ""
echo "💾 Save these credentials:"
echo "Database Password: $DB_PASSWORD"
