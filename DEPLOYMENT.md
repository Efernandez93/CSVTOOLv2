# Deployment Guide - Global Dock Tally

This guide will walk you through deploying the Global Dock Tally application to Vercel with Supabase as the database backend.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Supabase account (sign up at https://supabase.com)

## Phase 1: Supabase Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `global-dock-tally`
   - **Database Password**: (create a strong password and save it)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup to complete

### 2. Get Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy and save these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy and paste the schema from `supabase-schema.sql` (we'll create this next)
4. Click "Run"

## Phase 2: Update Application Code

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Create Environment Variables File

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Never commit `.env.local` to Git (it's already in `.gitignore`)

### 3. Update Code

The application will be updated to:
- Replace localStorage with Supabase database
- Store CSV uploads in Supabase Storage
- Persist data across sessions and devices

## Phase 3: Deploy to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `csv-dock-tally` repository
4. Click "Import"

### 3. Configure Environment Variables

In Vercel deployment settings:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   - `VITE_SUPABASE_URL` = (your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)
3. Click "Save"

### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployed app at the provided URL

## Post-Deployment

### Testing

1. Upload Ocean CSV
2. Upload Air CSV
3. Generate reports for both modes
4. Verify data persists after page refresh

### Custom Domain (Optional)

1. Go to **Settings** → **Domains** in Vercel
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify Node version compatibility (should be 18+)

### Database Connection Issues
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Review browser console for errors

### Data Not Persisting
- Check browser console for Supabase errors
- Verify database schema was created correctly
- Check Supabase dashboard for data

## Support

For issues or questions, check:
- Vercel documentation: https://vercel.com/docs
- Supabase documentation: https://supabase.com/docs
