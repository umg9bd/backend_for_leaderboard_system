Backend Leaderboard System - Developer Guide

1. Overview

This project is the complete backend service for a real-time, scalable leaderboard system. It provides a RESTful API to create and manage multiple competitions, submit scores for players, and retrieve complex ranked leaderboards with support for time-window filtering and tie-breaking logic.

This service is built with a focus on code quality, automated testing, and a complete CI/CD pipeline.

2. Technology Stack

Backend: Node.js, Express.js

Database: MySQL (using mysql2 library)

Testing: Jest (for Unit, Integration, and System tests), Supertest

Code Quality: ESLint

Security: npm audit

CI/CD: GitHub Actions

3. Project Structure

This project follows an industry-standard layout that separates source code, test suites, and configuration.

.
├── .github/
│   └── workflows/
│       └── main.yml        # 6-stage CI/CD pipeline (Test, Lint, Security, Coverage, Deploy)
├── routes/
│   └── competitionRoutes.js # All API endpoint logic (Controllers)
├── tests/
│   ├── unit/
│   │   └── logic.test.js   # Unit tests (fast, isolated, no DB)
│   ├── integration/
│   │   └── competitionRoutes.test.js # Integration tests (API + Test DB)
│   └── system/
│       └── workflow.test.js  # System tests (E2E user/admin workflows)
├── .env                  # Local secrets (DO NOT COMMIT)
├── .env.example          # Template for environment variables
├── .eslintrc.js          # ESLint configuration rules
├── .gitignore
├── db.js                 # Database connection pool
├── index.js              # Express server entry point
├── jest.config.js        # Jest test runner & coverage config
├── package.json          # Project dependencies & scripts
└── schema.sql            # Database table definitions


4. Local Setup & Installation

Follow these steps to set up the project on your local machine.

Prerequisites

Node.js (v20 or higher)

[suspicious link removed] (v5.7 or higher)

A Git client

Step 1: Clone the Repository

git clone https://github.com/pestechnology/PESU_EC_CSE_K_P75_Backend_for_a_Leaderboard_System_Team-2
cd PESU_EC_CSE_K_P75_Backend_for_a_Leaderboard_System_Team-2 


Step 2: Install Dependencies

This will install all packages listed in package.json (like Express, Jest, etc.).

npm install


Step 3: Set Up Your Database

You need to create two databases: one for development and one for testing.

Log in to your MySQL server:

mysql -u root -p


Create your development and test databases:

CREATE DATABASE leaderboard_db;
CREATE DATABASE leaderboard_test_db;


Apply the schema to both databases.

# Apply to development DB
mysql -u root -p leaderboard_db < schema.sql

# Apply to test DB
mysql -u root -p leaderboard_test_db < schema.sql


Step 4: Configure Environment Variables

Create a .env file in the root of the project. The Template is:

cp .env.example .env


Edit the .env file with your local database credentials. This file is used when you run npm start or npm run dev.

# .env - For local development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=leaderboard_db


5. Running the Application

There are two ways to run the server:

Development Mode (Recommended): Uses nodemon to automatically restart the server on file changes.

npm run dev


Production Mode:

npm start


The server will start on http://localhost:3000.

6. Testing (The "Quality Net")

This project uses Jest for a 3-tier testing strategy as required by the rubric.

Important: Our test scripts are configured to run against the leaderboard_test_db database. The CI pipeline does this automatically, but to run locally, you must first change your .env file to point to the test database:

# .env - Temporarily change for testing
DB_NAME=leaderboard_test_db


Test Commands

Run ALL Tests:
This executes all unit, integration, and system tests.

npm test


Run Tests with Coverage:
This runs all tests and generates a full HTML report in the /coverage folder.

npm run test:coverage


Run Code Linter:
This checks your code for style errors using ESLint and generates lint-report.json.

npm run lint


Run Security Scan:
This checks your dependencies for known vulnerabilities and generates security-report.json.

npm run security


7. API Endpoint Overview

All routes are prefixed with /api/competitions.

Competition Routes

GET /: Get all competitions.

POST /: Create a new competition.

GET /:unique_id/leaderboard: Get the leaderboard for a competition.

POST /:unique_id/finalize: (Admin) Finalizes a competition and saves a snapshot.

POST /:unique_id/reset: (Admin) Wipes all data for a competition.

GET /:unique_id/snapshots: Get all historical snapshots for a completed competition.

Player Routes

POST /:unique_id/scores: Submit a new score for a player.

GET /:unique_id/players/:player_name/rank: Get a single player's rank and score.

GET /:unique_id/players/:player_name/scores: Get a player's full score history for one competition.

GET /:unique_id/neighbours/:player_name: Get the players ranked immediately above and below a specific player.

GET /players/:player_name/history: Get a player's career history across all completed competitions.

Admin & Debug Routes

POST /bulk: (Admin) Bulk-initialize the database with multiple competitions and scores.

POST /:unique_id/tiebreak: (Debug) Check the result of a tie-break for a player.

GET /debug/all-scores: (Debug) Dumps the entire scores table.

8. CI/CD Pipeline

This project uses a 6-stage GitHub Actions pipeline defined in .github/workflows/main.yml.

Triggers: Runs on every push and pull_request to the main or master branches.

Quality Gates: The pipeline will fail if any tests fail.

Pipeline Stages

Build: Installs all npm dependencies.

Test: Spins up a temporary mysql:5.7 database, applies the schema, and runs the entire automated test suite (npm test).

Lint: Runs npm run lint and uploads the lint-report.json as an artifact.

Security: Runs npm run security and uploads the security-report.json as an artifact.

Coverage: Runs npm run test:coverage against the live test database and uploads the coverage/ (HTML report) as an artifact.

Create Deployment Artifact: If all previous stages pass, this zips the entire project (source code, reports, etc.) into a deployment-package.zip file, which is uploaded as the final artifact.

9. How to Contribute

Create a new feature branch from main:

git checkout -b feature/my-new-feature


Make your code changes.

Run tests locally to ensure you haven't broken anything:

# Point .env to test DB
npm test


Commit your changes with a descriptive message:

git commit -m "Feat: Add player avatar endpoint"


Push your branch to GitHub:

git push origin feature/my-new-feature


Open a Pull Request on GitHub.

Wait for all CI/CD checks to pass (Test, Lint, Security, Coverage).

Request a review from a team member.

Once approved and all checks are green, your branch can be merged into main.


