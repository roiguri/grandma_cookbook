# AI Recipe Manager

A personal application designed to digitize, manage, and review recipes using the power of Google Gemini AI.

> **Live demo:** [grandmacookbook.netlify.app](https://grandmacookbook.netlify.app/) — access restricted to a family allowlist (sign-in is gated to specific email addresses).

## Goal

Built to digitize my grandmother's handwritten recipe collection — photos of handwritten cards become a searchable, Hebrew-supported digital library, with a review step before each recipe is saved.

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

## Setup

This is a personal family app, but the codebase is self-contained — you can run your own instance:

1. Clone and install:
   ```bash
   git clone https://github.com/roiguri/grandma_cookbook.git
   cd grandma_cookbook
   npm install
   ```

2. Set up a Firebase project (Auth + Firestore + Storage) and create a Google Gemini API key.

3. Copy `.env.example` to `.env` and fill in your Firebase web config + Gemini API key:
   ```bash
   cp .env.example .env
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

For production deployment to Netlify, set the server-side environment variables (`GEMINI_API_KEY`, `FIREBASE_API_KEY`, `ALLOWED_EMAILS`) in the Netlify dashboard. The `analyze-recipe` serverless function verifies each request's Firebase ID token and enforces the email allowlist before calling Gemini.
