# 🌍 Global Dock Tally

A modern web application for managing Ocean and Air cargo dock tally reports with real-time data tracking and PDF generation.

## ✨ Features

- **Dual Mode Support**: Ocean and Air cargo management
- **CSV Upload**: Easy data import with validation
- **Smart Tracking**: Automatic detection of new, updated, and removed items
- **PDF Generation**: Professional dock tally reports with customizable layouts
- **Real-time Metrics**: Live dashboard with filterable data
- **Data Persistence**: Cloud storage with Supabase (or local fallback)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd csv-dock-tally
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### With Supabase (Optional)

1. **Create `.env.local` file**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your Supabase credentials**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run the schema**
   - Go to your Supabase SQL Editor
   - Run the contents of `supabase-schema.sql`

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel and Supabase.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/csv-dock-tally)

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Styling**: Custom CSS with CSS Variables
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **PDF Generation**: html2pdf.js + pdf-lib
- **Icons**: Lucide React

## 📋 Usage

### Ocean Mode

1. Click **Ocean** tab
2. Upload Ocean CSV with columns:
   - MBL, HB, CONTAINER, DEST, OUTER QTY, PCS
   - Optional: FRL DATE, TDF DATE, VBOND DATE
3. View metrics and filtered data
4. Generate PDF reports

### Air Mode

1. Click **Air** tab
2. Upload Air CSV with columns:
   - MAWB, HAWB, FLIGHT NUMBER, DESTINATION
   - SLAC, QTY, CFS LOCATION, LOG
3. View metrics and filtered data
4. Generate PDF reports

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | No* |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | No* |

*If not provided, app runs in local-only mode with localStorage

## 📝 CSV Format

### Ocean CSV
```csv
MBL,HB,CONTAINER,DEST,OUTER QTY,PCS,FRL DATE,TDF DATE,VBOND DATE
ACLU1234,HB001,CONT123,LAX,10,50,1/1/24,1/2/24,1/3/24
```

### Air CSV
```csv
MAWB,HAWB,FLIGHT NUMBER,DESTINATION,SLAC,QTY,CFS LOCATION,LOG
016-12345678,4720123456,BR123,ORD,24,5,A1,Entry notes
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🐛 Troubleshooting

### PDF Generation Issues
- Ensure you've selected items before generating
- Try refreshing the page if downloads fail
- Check browser console for errors

### Data Not Persisting
- Verify Supabase credentials in `.env.local`
- Check Supabase dashboard for connection issues
- Ensure database schema is properly set up

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is 18 or higher
- Check for missing environment variables

## 📞 Support

For issues or questions:
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Review browser console for errors
- Verify Supabase connection in dashboard

---

Built with ❤️ for efficient cargo management
