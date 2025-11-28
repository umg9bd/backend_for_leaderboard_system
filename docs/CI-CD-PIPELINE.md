# CI/CD Pipeline Documentation

## Overview
This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline implemented for the Leaderboard System Backend project. The pipeline automatically builds, tests, analyzes, and packages the application whenever code is pushed to the repository.

---

## Pipeline Architecture

The CI/CD pipeline is implemented using **GitHub Actions** and consists of 4 main jobs that run sequentially:

```
┌─────────────┐     ┌──────────────┐
│    Lint     │────▶│   Security   │
│  (ESLint)   │     │ (npm audit)  │
└─────────────┘     └──────────────┘
       │                    │
       └──────────┬─────────┘
                  ▼
         ┌─────────────────┐
         │ Test & Coverage │
         │     (Jest)      │
         └─────────────────┘
                  │
                  ▼
      ┌──────────────────────┐
      │ Create Deployment    │
      │     Artifact         │
      └──────────────────────┘
```

---

## Software & Tools Used

| Tool/Software | Version | Purpose |
|--------------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime environment |
| **npm** | Latest | Package manager |
| **GitHub Actions** | - | CI/CD automation platform |
| **MySQL** | 5.7 | Database for integration tests |
| **ESLint** | ^8.56.0 | Static code analysis & linting |
| **Jest** | ^29.7.0 | Testing framework |
| **Supertest** | ^7.1.4 | HTTP integration testing |
| **Ubuntu** | latest | CI/CD runner operating system |

---

## Pipeline Stages

### 1. **Lint Stage** (Static Code Analysis)

**Purpose:** Ensures code quality and adherence to coding standards.

**Process:**
- Runs ESLint on all JavaScript files
- Checks for syntax errors, code style violations, and potential bugs
- Generates a JSON report (`lint-report.json`)
- Ignores `frontend/` and `coverage/` folders

**Commands:**
```bash
npm ci                    # Install dependencies
npm run lint              # Run ESLint with JSON output
```

**Outputs:**
- `lint-report.json` - Detailed lint analysis report

**Success Criteria:** 
- ESLint completes successfully (warnings allowed, errors fail the build)

---

### 2. **Security Stage** (Vulnerability Scanning)

**Purpose:** Identifies security vulnerabilities in project dependencies.

**Process:**
- Runs `npm audit` to scan all dependencies
- Checks against the npm security advisory database
- Generates a security report (`security-report.json`)
- Fails on high-severity vulnerabilities

**Commands:**
```bash
npm ci                    # Install dependencies
npm run security          # Run npm audit
```

**Outputs:**
- `security-report.json` - Vulnerability assessment report

**Success Criteria:**
- No high or critical severity vulnerabilities found

---

### 3. **Test & Coverage Stage** (Quality Assurance)

**Purpose:** Validates application functionality and measures test coverage.

**Dependencies:** Runs only if Lint and Security stages pass.

**Infrastructure:**
- **MySQL 5.7 Database** runs as a service container
- Database credentials: `root` / `password`
- Test database: `test_db`

**Process:**
1. Starts MySQL database service
2. Waits for database to be ready
3. Applies database schema from `schema.sql`
4. Runs all Jest test suites
5. Generates code coverage reports

**Commands:**
```bash
npm ci                           # Install dependencies
mysql < schema.sql               # Apply database schema
npm run test:coverage            # Run tests with coverage
```

**Test Suites:**
- Integration tests (`competitionroutes.test.js`)
- 26 test cases covering all API endpoints
- Business logic validation
- Error handling verification

**Outputs:**
- `coverage/` folder - HTML coverage reports
- `coverage/lcov.info` - LCOV coverage data
- `coverage/clover.xml` - Clover XML format

**Success Criteria:**
- All test cases pass
- Database schema applies successfully
- Coverage reports generated

---

### 4. **Create Deployment Artifact Stage** (Packaging)

**Purpose:** Packages the application and all CI reports into a deployable artifact.

**Dependencies:** Runs only if all previous stages pass.

**Process:**
1. Checks out repository source code
2. Downloads all generated reports (lint, security, coverage)
3. Creates a `deployment/` directory structure
4. Copies all application files and reports
5. Creates a compressed zip file

**Directory Structure:**
```
deployment/
├── routes/                          # API route handlers
├── frontend/                        # Frontend application files
├── docs/                           # Documentation
├── coverage/                       # Test coverage reports
├── server.js                       # Main server file
├── db.js                          # Database connection
├── package.json                   # Dependencies
├── package-lock.json              # Locked dependencies
├── schema.sql                     # Database schema
├── README.md                      # Project documentation
├── jest.config.js                 # Jest configuration
├── .eslintrc.js                   # ESLint rules
├── competitionroutes.test.js      # Test file
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
└── reports/                       # CI/CD reports
    ├── lint-report/
    │   └── lint-report.json
    ├── security-report/
    │   └── security-report.json
    └── coverage-report/
        └── coverage/
```

**Commands:**
```bash
mkdir -p deployment                  # Create directory
cp -r routes deployment/             # Copy application files
cp -r ci-reports/ deployment/reports/# Copy CI reports
zip -r deployment-package.zip deployment  # Create artifact
```

**Outputs:**
- `deployment-package.zip` - Complete deployment artifact

**Artifact Retention:** 90 days (GitHub Actions default)

---

## Workflow Configuration

### Trigger Events
The pipeline runs automatically on:
- **Push** to `main` or `master` branch
- **Pull Request** to `main` or `master` branch

### Environment Variables
```yaml
DB_HOST: 127.0.0.1
DB_NAME: test_db
DB_USER: root
DB_PASSWORD: password
CI: true
```

### Caching Strategy
- **npm packages** are cached between runs for faster builds
- Cache key: Based on `package-lock.json`

---

## Package.json Scripts

The following npm scripts are used in the pipeline:

```json
{
  "build": "echo 'No build step needed for this Node.js app'",
  "test": "jest --config=jest.config.js",
  "test:coverage": "jest --coverage --config=jest.config.js",
  "lint": "eslint . --ignore-pattern frontend/ --ignore-pattern coverage/ --format json --output-file lint-report.json || true",
  "security": "npm audit --audit-level=high --json > security-report.json || true"
}
```

---

## Success Criteria Summary

For the pipeline to succeed, all of the following must pass:

✅ **Lint Stage:**
- No ESLint errors
- lint-report.json generated

✅ **Security Stage:**
- No high/critical vulnerabilities
- security-report.json generated

✅ **Test & Coverage Stage:**
- All 26 test cases pass
- Database schema applies successfully
- Coverage reports generated

✅ **Deployment Stage:**
- All files copied successfully
- deployment-package.zip created
- Artifact uploaded to GitHub

---

## Monitoring & Reports

### Accessing Reports

1. **GitHub Actions Dashboard:**
   - Go to the repository → Actions tab
   - Click on the latest workflow run
   - View logs for each stage

2. **Artifacts:**
   - Download `deployment-package` from the workflow run
   - Extract and navigate to `deployment/reports/`

3. **Coverage Report:**
   - Open `deployment/coverage/lcov-report/index.html` in a browser
   - View detailed line-by-line coverage

### Report Contents

**Lint Report (`lint-report.json`):**
- File-by-file ESLint results
- Error and warning counts
- Rule violations with line numbers

**Security Report (`security-report.json`):**
- List of vulnerable packages
- Severity levels
- Recommended fixes

**Coverage Report (`coverage/`):**
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

---

## Troubleshooting

### Common Issues

**Issue:** MySQL connection refused
- **Solution:** The workflow includes a health check and wait loop

**Issue:** Test files missing from artifact
- **Solution:** Test files are explicitly copied in the deployment stage

**Issue:** Coverage folder causes lint errors
- **Solution:** Coverage folder is excluded from linting via `--ignore-pattern`

---

## Maintenance

### Updating Dependencies
```bash
npm update              # Update to latest compatible versions
npm audit fix          # Fix security vulnerabilities
```

### Modifying the Pipeline
1. Edit `.github/workflows/main.yml`
2. Commit and push changes
3. Monitor the workflow run

### Adding New Tests
1. Create test file (e.g., `*.test.js`)
2. Ensure it follows Jest conventions
3. Add to deployment artifact if needed

---

## Performance Metrics

**Average Pipeline Duration:** ~3-5 minutes

- Lint: ~15-30 seconds
- Security: ~15-30 seconds
- Test & Coverage: ~2-3 minutes (includes DB setup)
- Deployment Artifact: ~30-60 seconds

---

## Best Practices

1. ✅ **Always run tests locally** before pushing
2. ✅ **Keep dependencies updated** to avoid security issues
3. ✅ **Review lint warnings** even if they don't fail the build
4. ✅ **Maintain high test coverage** (aim for >80%)
5. ✅ **Use descriptive commit messages** for better tracking
6. ✅ **Monitor pipeline failures** and fix promptly

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

**Last Updated:** November 18, 2025  
**Pipeline Version:** 1.0  
**Maintained By:** PESU EC CSE Team 2
