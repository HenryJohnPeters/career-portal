# 🚀 Career Portal - Automated Deployment Guide

This project includes **fully automated deployment scripts** that handle everything via CLI commands. No manual dashboard clicking required!

## 📋 What Gets Deployed

- **Frontend**: React + Vite (served via Nginx)
- **Backend**: NestJS API with Prisma ORM
- **Database**: PostgreSQL (automatically provisioned)
- **Platform**: Railway (CLI-driven deployment)

## 🎯 One-Command Deployment

For first-time deployment, run:

```bash
./scripts/deploy-all.sh
```

This single command will:

1. ✅ Install Railway CLI automatically
2. ✅ Authenticate you with Railway
3. ✅ Create a new Railway project
4. ✅ Provision PostgreSQL database
5. ✅ Create API and Web services
6. ✅ Configure all environment variables
7. ✅ Deploy both services
8. ✅ Run database migrations automatically

## 📦 Prerequisites

You'll need:

- **Node.js** 20+ (for Railway CLI installation)
- **pnpm** 9.15.0 (already configured in package.json)
- **Git** repository initialized
- The following API keys ready:
  - OpenAI API key
  - Stripe secret key, price ID, and webhook secret
  - (Optional) Supabase URL, JWT secret, and anon key

## 🔧 Step-by-Step Deployment

If you prefer to run each step separately:

### 1. Initial Setup (First Time Only)

```bash
./scripts/deploy-setup.sh
```

This will:

- Install Railway CLI
- Log you into Railway (opens browser)
- Create a new project called "career-portal"
- Provision PostgreSQL database
- Create "api" and "web" services

### 2. Configure Environment Variables

```bash
./scripts/deploy-env.sh
```

You'll be prompted to enter:

- OpenAI API Key
- Stripe credentials (secret key, price ID, webhook secret)
- Supabase credentials (optional)

The script automatically:

- Sets all environment variables via CLI
- Links the database to the API service
- Generates public domains for both services
- Cross-configures URLs (API ↔ Web)

### 3. Deploy Services

```bash
./scripts/deploy.sh
```

Deploys both API and Web services in sequence. The API includes automatic database migration on startup.

## 🔄 Redeployment (Updates)

For subsequent deployments after making code changes:

```bash
./scripts/deploy.sh
```

That's it! This will rebuild and redeploy both services.

Or deploy individually:

```bash
# Deploy only API
railway service api
railway up

# Deploy only Web
railway service web
railway up
```

## 🏗️ Project Structure

```
career-portal/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/
│   └── web/              # React frontend
│       └── src/
├── scripts/
│   ├── deploy-all.sh     # Complete automated deployment
│   ├── deploy-setup.sh   # Initial Railway setup
│   ├── deploy-env.sh     # Environment configuration
│   └── deploy.sh         # Deploy services
├── Dockerfile.api        # Backend container
├── Dockerfile.web        # Frontend container (Nginx)
├── nginx.conf            # Nginx configuration for SPA
├── railway.json          # API service config
└── railway.web.json      # Web service config
```

## 🔐 Environment Variables

### Backend (API)

Required:

- `DATABASE_URL` - Auto-configured by Railway Postgres
- `OPENAI_API_KEY` - Your OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PRICE_ID` - Stripe price/plan ID
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `CLIENT_URL` - Frontend URL (auto-configured)
- `PORT` - API port (default: 3000)
- `NODE_ENV` - Set to "production"

Optional:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_JWT_SECRET` - Supabase JWT secret

### Frontend (Web)

Build-time variables:

- `VITE_API_URL` - Backend API URL (auto-configured)
- `VITE_SUPABASE_URL` - Supabase URL (optional)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (optional)

## 🗄️ Database Migrations

Migrations run automatically on API startup via the Docker CMD:

```dockerfile
CMD npx prisma migrate deploy && node dist/main.js
```

To create new migrations locally:

```bash
pnpm db:migrate
```

## 🛠️ Manual Railway Commands

If you need more control:

```bash
# List all services
railway service

# Switch to a service
railway service api

# View logs
railway logs

# View environment variables
railway variables

# Set a variable
railway variables set KEY=value

# Generate/view domain
railway domain

# Open Railway dashboard
railway open
```

## 🧪 Local Development

```bash
# Start local database
pnpm db:up

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start API (port 3000)
pnpm api

# Start Web (port 4200)
pnpm web
```

## 📊 Monitoring & Logs

Check deployment status and logs:

```bash
# API logs
railway service api
railway logs

# Web logs
railway service web
railway logs

# Open Railway dashboard
railway open
```

## 🔒 Security Notes

- All secrets are stored in Railway's encrypted environment variables
- Database credentials are automatically managed by Railway
- Never commit `.env` files with real credentials
- Use `.env.example` as a template

## 🚨 Troubleshooting

### Railway CLI not found

```bash
npm install -g @railway/cli
```

### Database connection issues

Ensure the Postgres service is linked to the API:

```bash
railway service api
railway link
# Select your postgres service
```

### Build failures

Check logs:

```bash
railway logs
```

Common issues:

- Missing environment variables
- Prisma migration errors
- Node/pnpm version mismatches

### Domain not accessible

After first deployment, domains may take 1-2 minutes to become active. Check:

```bash
railway domain
```

## 🎉 Success!

After successful deployment:

1. **API**: `https://api-production-xxxx.railway.app`

   - Health check: `/`
   - API docs: `/docs` (development only)

2. **Web**: `https://web-production-xxxx.railway.app`

   - Your React application

3. **Database**: Automatically managed by Railway
   - Connection string available in Railway variables

## 💰 Cost Estimation

Railway pricing (as of 2026):

- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage
- Database and services consume compute credits based on usage
- Most startups fit within $20-50/month

## 🆘 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- NestJS Docs: https://docs.nestjs.com
- Prisma Docs: https://www.prisma.io/docs

## 📝 License

[Your License]

---

**Built with ❤️ using automated DevOps practices**
