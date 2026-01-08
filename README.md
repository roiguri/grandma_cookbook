# AI Recipe Manager

A personal application designed to digitize, manage, and review recipes using the power of Google Gemini AI.

## Access

This is a personal application. Access is restricted to authorized users only. Authentication is verified against an allowed email list via the `VITE_ALLOWED_USER_EMAIL` environment variable.

## Key Features

- **AI-Powered Digitization**: Instantly extract recipe details, ingredients, and steps from images using Google Gemini.
- **Review Workflow**: A dedicated review mode to verify and edit AI-extracted data before finalizing recipes.
- **Library Management**: Organize recipes into "Review" (unreviewed), "Approved" (reviewed), and "Favorites".
- **Mobile-First Experience**: Fully responsive design with PWA support for installation on mobile devices.
- **Advanced Image Viewing**: Custom image viewer supporting multi-touch pinch zoom and double-tap interactions.

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **Backend & Auth**: Firebase (Authentication, Firestore, Storage)
- **AI**: Google Gemini API
- **Deployment**: Netlify
