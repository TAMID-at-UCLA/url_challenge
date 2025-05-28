# TAMID URL Shortener Tech Challenge

A URL shortener built by the TAMID at UCLA Tech Team to showcase our technical abilities, generate compact links, track usage, and deliver a clean, responsive interface.

## Overview

In building a URL shortener, our team’s goal was to introduce a new chapter of technical development within TAMID at UCLA's organization. Through innovation and collaboration, we constructed a functional, scalable product that not only served a practical purpose, but also reflected our collective skills and dedication to advancing TAMID’s technological presence.

## Development Process

To ensure the project was scalable and maintainable, we followed a structured development process:

1. **Planning & Setup**: We began by outlining core features and choosing a tech stack that balanced performance, learning potential, and ease of use. We selected Flask for the backend and PostgreSQL via Supabase for our database.

2. **Backend Development**: We implemented routes to handle URL creation, redirection, and click tracking. We used a 'slug' to create unique short links and built in error-handling for robustness.

3. **Frontend Design**: We developed a responsive user interface using HTML, CSS, and JavaScript. The design prioritized clarity, mobile responsiveness, and seamless integration with the backend.

4. **Database Integration**: Supabase allowed us to persistently store long URLs, their associated short forms, and the click activity. We structured our tables to avoid duplication and ensure fast lookups.

5. **Deployment**: We deployed the app on Render, managing environment variables, database connections, and remote testing to ensure public access.

6. **Testing & Iteration**: We tested all routes and features locally and in production. Final tweaks focused on improving UI behavior and input handling.

Throughout the project, we used Git and GitHub for collaboration, pull requests, and issue tracking.

## Challenges Faced

One of the biggest technical hurdles we faced was syncing our database updates with the frontend display. This was mainly difficult because we had to ensure that click counts could be incremented properly without duplication or data loss. This meant refining our POST/GET handling and implementing extensive error-checking logic. Deploying the URL shortener also posed some coordination challenges as we organized our app structure and set up environment variables to select a cloud platform like Render.

## If We Had More Time...

With more time, we would have expanded the project with the following features:

- **User Authentication**: Allow users to register and manage their own URLs, with saved link history.
- **Custom Short Links**: Give users the ability to define their own short URL aliases.
- **Advanced Analytics**: Add a dashboard with data visualizations for link usage over time, geographic breakdowns, and device types.
- **Enhanced Error Feedback**: Display real-time feedback for invalid inputs or expired links.
- **QR Code Generation**: Automatically generate a QR code for each short link.

These enhancements would have made the tool more personalized, feature-rich, and aligned with the expectations of modern URL shorteners.

## Conclusion

This project is just the beginning of our effort to embed meaningful technology into the TAMID community. It gave us the opportunity to ship a real product while gaining hands-on experience across the full stack. We look forward to continuing to build and expand projects like this as part of TAMID's ongoing technical efforts.
