# 🚀 AWS Deployment Guide for Todo Tool

This guide provides step-by-step instructions to deploy your Todo Tool application to AWS.

## 📋 Prerequisites

### Required Tools
1. **AWS CLI** - [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **Docker** - [Install Guide](https://docs.docker.com/get-docker/)
3. **Node.js** (v18+) - [Install Guide](https://nodejs.org/)
4. **Git** - [Install Guide](https://git-scm.com/downloads)

### AWS Account Setup
1. **AWS Account** with appropriate permissions
2. **AWS CLI configured** with your credentials:
   ```bash
   aws configure
   ```

## 🏗️ Architecture Overview

Your application will be deployed with:
- **Frontend**: React app → S3 + CloudFront
- **Backend**: FastAPI → ECS Fargate
- **Database**: PostgreSQL → RDS
- **Load Balancer**: Application Load Balancer
- **Container Registry**: ECR

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)
```bash
# Make script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh prod us-east-1

# Deploy to staging
./deploy.sh staging us-west-2
```

### Option 2: Manual Step-by-Step

#### Step 1: Deploy Infrastructure
```bash
# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file aws/cloudformation-template.yaml \
    --stack-name todo-tool-prod \
    --parameter-overrides \
        Environment=prod \
        DBPassword=YourSecurePassword123! \
    --capabilities CAPABILITY_IAM \
    --region us-east-1
```

#### Step 2: Build and Push Backend
```bash
# Navigate to backend
cd backend

# Create ECR repository
aws ecr create-repository --repository-name todo-tool-backend --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Build and push
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_URI="$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/todo-tool-backend:latest"

docker build -t todo-tool-backend .
docker tag todo-tool-backend:latest $IMAGE_URI
docker push $IMAGE_URI
```

#### Step 3: Deploy Backend to ECS
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name todo-tool-prod --region us-east-1

# Create task definition (see ecs-task-definition.json)
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json --region us-east-1

# Create ECS service
aws ecs create-service \
    --cluster todo-tool-prod \
    --service-name todo-tool-backend \
    --task-definition todo-tool-backend:1 \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
    --region us-east-1
```

#### Step 4: Build and Deploy Frontend
```bash
# Navigate to frontend
cd frontend

# Install dependencies and build
npm install
npm run build

# Get S3 bucket name from CloudFormation outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name todo-tool-prod \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)

# Deploy to S3
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region us-east-1
```

## 🔧 Configuration

### Environment Variables
Set these in your ECS task definition:

```json
{
  "environment": [
    {
      "name": "DATABASE_URL",
      "value": "postgresql://todouser:password@your-db-endpoint:5432/todoapp"
    },
    {
      "name": "ENVIRONMENT",
      "value": "production"
    }
  ]
}
```

### Frontend Configuration
Update `frontend/src/services/api.js` for production:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api'
  : 'http://localhost:8000/api'
```

## 🔒 Security Considerations

### Database Security
- Database is in private subnets
- Security groups restrict access to backend only
- Encrypted at rest and in transit

### API Security
- CORS configured for your domain only
- HTTPS enforced via ALB
- Security groups restrict access

### Frontend Security
- S3 bucket configured for static website hosting
- CloudFront for HTTPS and caching
- No sensitive data in frontend code

## 💰 Cost Estimation

### Monthly AWS Costs (approximate):
- **RDS (db.t3.micro)**: $15-20
- **ECS Fargate (2 tasks)**: $30-40
- **ALB**: $20-25
- **S3 + CloudFront**: $5-10
- **Data Transfer**: $5-15
- **Total**: ~$75-110/month

### Cost Optimization:
- Use Reserved Instances for predictable workloads
- Enable S3 lifecycle policies
- Set up CloudWatch alarms for cost monitoring

## 🔍 Monitoring & Logging

### CloudWatch Setup
```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/todo-tool-backend --region us-east-1
aws logs create-log-group --log-group-name /aws/rds/instance/todo-db/postgresql --region us-east-1
```

### Health Checks
- Backend: `GET /health`
- Database: RDS monitoring
- Frontend: CloudFront monitoring

## 🚨 Troubleshooting

### Common Issues

#### Backend not starting:
```bash
# Check ECS service events
aws ecs describe-services --cluster todo-tool-prod --services todo-tool-backend --region us-east-1

# Check task logs
aws logs get-log-events --log-group-name /ecs/todo-tool-backend --log-stream-name [stream-name] --region us-east-1
```

#### Database connection issues:
```bash
# Test database connectivity from ECS task
aws ecs execute-command \
    --cluster todo-tool-prod \
    --task [task-id] \
    --container backend \
    --command "pg_isready -h [db-endpoint] -U todouser" \
    --interactive \
    --region us-east-1
```

#### Frontend not loading:
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket [bucket-name] --region us-east-1

# Check CloudFront distribution
aws cloudfront list-distributions --region us-east-1
```

## 🔄 Updates & Maintenance

### Backend Updates
```bash
# Build new image
docker build -t todo-tool-backend .
docker tag todo-tool-backend:latest $IMAGE_URI
docker push $IMAGE_URI

# Update ECS service
aws ecs update-service \
    --cluster todo-tool-prod \
    --service todo-tool-backend \
    --force-new-deployment \
    --region us-east-1
```

### Frontend Updates
```bash
# Build and deploy
npm run build
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region us-east-1

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id [distribution-id] \
    --paths "/*" \
    --region us-east-1
```

### Database Migrations
```bash
# Run migrations from ECS task
aws ecs run-task \
    --cluster todo-tool-prod \
    --task-definition todo-tool-migration \
    --launch-type FARGATE \
    --region us-east-1
```

## 📞 Support

For deployment issues:
1. Check CloudFormation events
2. Review ECS service logs
3. Verify security group rules
4. Test database connectivity

## 🎯 Next Steps

After deployment:
1. Set up custom domain with Route 53
2. Configure SSL certificate with ACM
3. Set up monitoring and alerting
4. Implement backup strategy
5. Set up CI/CD pipeline
