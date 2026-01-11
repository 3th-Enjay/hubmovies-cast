# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `web` directory with the following variables:

```env
# NextAuth Secret (REQUIRED for authentication)
# Generate a new secret with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=cVcu7sXfHOGc/ekEwDUcZ1dtKMa3q2n/dmrVAHHJfG4=

# MongoDB Connection String (REQUIRED)
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/hubmovies-cast

# NextAuth URL (for email verification links)
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (for password reset and verification emails)
# If using Gmail, you'll need an App Password: https://support.google.com/accounts/answer/185833
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@hubmovies.com

# Cloudinary (for media uploads)
# Get these from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Quick Setup

1. **Create `.env.local` file** in the `web` directory
2. **Copy the content above** into the file
3. **Update the values**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `EMAIL_SERVER_USER`: Your email address
   - `EMAIL_SERVER_PASSWORD`: Your email app password (for Gmail, use App Password)
   - `CLOUDINARY_*`: Your Cloudinary credentials (if using media uploads)

## Generate a New Secret

If you want to generate a new `NEXTAUTH_SECRET`, run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Notes

- `.env.local` is gitignored and won't be committed to the repository
- The `NEXTAUTH_SECRET` is already set with a secure random value
- You can use the default values for development, but update them for production

