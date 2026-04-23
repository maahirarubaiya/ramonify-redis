# Ramonify – Redis Extension
CS 3200: Database Design | Project 3
Professor: John Alexis Guerra Gómez
Student: Maahira Rubaiya

## Project Overview
Ramonify is a personal finance tracking application that helps students and individuals manage their income and expenses. This project extends the existing relational (SQLite / Project 1) and document-based (MongoDB / Project 2) implementations with an in-memory key-value layer using Redis.

## Redis Features
| Feature | Redis Structure | Key Pattern |
|---|---|---|
| Session Management | Hash | session:userId |
| Budget Status Cache | Sorted Set | budgetStatus:userId |
| Top Spending Categories | Sorted Set | topCategories |

## How to Run
1. Make sure Redis is running locally on port 6379
2. Clone this repository
3. Install dependencies:
   npm install
4. Start the app:
   node server.js
5. Open your browser at http://localhost:3000

## Video Demo
https://youtu.be/NqQdYfePNJc

## AI Usage Disclosure
AI Tool Used: Claude (claude.ai)

How AI Was Used:
- Helped structure and format the requirements document
- Explained Redis data structure trade-offs and best practices
- Reviewed Redis command syntax for correctness
- Helped build the Node + Express application

What I Did Myself:
- Selected which Redis features to implement and why
- Made all design decisions on key patterns, data structures, and TTL values
- Ran and tested all Redis commands
- Recorded the demo video

AI was used as a tutor and reviewer. All design decisions and final implementation are my own.
