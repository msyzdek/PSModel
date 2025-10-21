# Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Code Quality
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No linting errors
- [ ] Type checking passes
- [ ] Documentation updated

### Security
- [ ] Environment variables reviewed
- [ ] Secrets rotated (JWT_SECRET_KEY, ADMIN_PASSWORD)
- [ ] CORS origins configured for production only
- [ ] No sensitive data in code or logs
- [ ] Dependencies updated and audited
- [ ] Security headers configured

### Configuration
- [ ] Backend `.env` file configured
- [ ] Frontend `.env.production` or environment variables set
- [ ] Database path configured correctly
- [ ] API URL points to production backend
- [ ] CORS origins include production frontend URL
- [ ] Debug mode disabled (`API_RELOAD=false`)

## Backend Deployment

### Preparation
- [ ] Python 3.11+ installed (if not using Docker)
- [ ] Virtual environment created
- [ ] Dependencies installed from `requirements.txt`
- [ ] Database directory created with proper permissions
- [ ] Backup strategy implemented

### Database
- [ ] Database migrations reviewed
- [ ] Backup of existing database (if applicable)
- [ ] Run migrations: `alembic upgrade head`
- [ ] Verify database schema
- [ ] Test database connectivity

### Application
- [ ] Environment variables set correctly
- [ ] Application starts without errors
- [ ] Health check endpoint responds: `/health`
- [ ] API documentation accessible: `/docs`
- [ ] Authentication working
- [ ] CORS configured correctly

### Infrastructure
- [ ] Reverse proxy configured (nginx/Apache)
- [ ] SSL/TLS certificate installed
- [ ] Firewall rules configured
- [ ] Process manager configured (systemd/supervisor)
- [ ] Log rotation configured
- [ ] Monitoring set up

## Frontend Deployment

### Build
- [ ] `NEXT_PUBLIC_API_URL` set to production API
- [ ] Build completes successfully: `npm run build`
- [ ] No build warnings or errors
- [ ] Bundle size acceptable
- [ ] Static assets generated

### Deployment Platform

#### Vercel
- [ ] Project linked to Git repository
- [ ] Environment variables configured
- [ ] Build settings verified
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

#### Docker
- [ ] Image built successfully
- [ ] Container starts without errors
- [ ] Port mapping configured
- [ ] Environment variables passed correctly
- [ ] Health check working

#### Other Platforms
- [ ] Platform-specific configuration complete
- [ ] Build command configured
- [ ] Environment variables set
- [ ] Domain/DNS configured

## Post-Deployment

### Verification
- [ ] Frontend loads successfully
- [ ] Can access login page
- [ ] Can authenticate with admin credentials
- [ ] Can create a new period
- [ ] Can view existing periods
- [ ] Calculations working correctly
- [ ] Navigation working
- [ ] API requests succeeding

### Testing
- [ ] Test all critical user flows
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Test error handling
- [ ] Test authentication/authorization
- [ ] Verify data persistence

### Monitoring
- [ ] Application logs accessible
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring set up
- [ ] Alerts configured

### Documentation
- [ ] Deployment documented
- [ ] Credentials stored securely
- [ ] Runbook created for common issues
- [ ] Team notified of deployment
- [ ] Changelog updated

## Rollback Plan

### Preparation
- [ ] Previous version tagged in Git
- [ ] Database backup available
- [ ] Rollback procedure documented
- [ ] Team aware of rollback process

### If Issues Occur
1. [ ] Identify the issue
2. [ ] Assess severity
3. [ ] Decide: fix forward or rollback
4. [ ] Execute rollback if needed:
   - [ ] Revert to previous Docker image/deployment
   - [ ] Restore database backup (if schema changed)
   - [ ] Verify rollback successful
5. [ ] Document the issue
6. [ ] Plan fix for next deployment

## Environment-Specific Checklists

### Development
- [ ] Local database initialized
- [ ] Development credentials set
- [ ] Hot reload enabled
- [ ] Debug logging enabled

### Staging
- [ ] Separate database from production
- [ ] Staging-specific credentials
- [ ] Similar configuration to production
- [ ] Test data available

### Production
- [ ] Strong credentials set
- [ ] Debug mode disabled
- [ ] Production database configured
- [ ] Backups automated
- [ ] Monitoring active
- [ ] SSL/TLS enabled

## Security Checklist

### Authentication
- [ ] Default password changed
- [ ] Strong password policy enforced
- [ ] JWT secret is cryptographically secure
- [ ] Token expiration configured appropriately

### Network Security
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Firewall rules in place
- [ ] Rate limiting configured (if applicable)

### Data Security
- [ ] Database file permissions set correctly
- [ ] Sensitive data encrypted
- [ ] Backup encryption enabled
- [ ] Access logs enabled

### Application Security
- [ ] Input validation working
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Security headers configured
- [ ] Dependencies scanned for vulnerabilities

## Performance Checklist

### Backend
- [ ] Database queries optimized
- [ ] Response times acceptable
- [ ] Memory usage normal
- [ ] CPU usage normal

### Frontend
- [ ] Page load time < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Caching configured

## Compliance Checklist

### Data Privacy
- [ ] Data retention policy implemented
- [ ] User data handling documented
- [ ] Privacy policy updated (if applicable)

### Audit Trail
- [ ] Important actions logged
- [ ] Logs retained appropriately
- [ ] Audit reports available

## Communication

### Before Deployment
- [ ] Stakeholders notified of deployment window
- [ ] Maintenance window scheduled (if needed)
- [ ] Team available for support

### After Deployment
- [ ] Stakeholders notified of completion
- [ ] Known issues communicated
- [ ] Support team briefed
- [ ] Documentation shared

## Sign-Off

- [ ] Technical lead approval
- [ ] QA approval
- [ ] Product owner approval
- [ ] Security review completed

## Notes

Use this section to document deployment-specific notes:

**Deployment Date:** _______________

**Deployed By:** _______________

**Version/Tag:** _______________

**Issues Encountered:**


**Resolution:**


**Follow-up Actions:**
