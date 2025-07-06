# MTurk Payment Workflow Documentation

## Overview
This document outlines the typical payment workflow for Amazon Mechanical Turk (MTurk) surveys, including the complete process from HIT creation to worker payment.

## Typical MTurk Survey Payment Workflow

### 1. Worker Accepts Your HIT
- Workers browse available HITs on the MTurk platform
- They accept your HIT and begin the task
- The task involves completing a survey on your web application: https://fakeprofiledetection.github.io/web-data-collection-gcs/pages/hosting/start_study.html

### 2. Your Web App Generates a Unique Survey Code
- After the worker completes the task, your application generates a unique completion code
- Example format: `TASK-20241202-A1B2-X9K7M3` or `ABC123XYZ`
- This code serves as proof that the worker completed your task
- **Important**: Display the code prominently with clear instructions

### 3. Worker Returns to MTurk and Submits the Code
- Workers return to the MTurk HIT page
- They paste the completion code into the "Your Answer" box
- The HIT is submitted for review

### 4. Requester Reviews the Submission
- Log into MTurk Dashboard → Manage → HITs Results
- Review submitted codes against your database/log of generated codes
- Verify the code validity and task completion

### 5. Approve or Reject the Submission
- **Approve**: If the code is valid and the task was completed properly
- **Reject**: If the code is invalid or the task was incomplete
- ⚠️ **Caution**: Too many rejections can hurt your reputation as a requester

### 6. Payment Processing
- Once approved, MTurk automatically transfers the HIT payment from your account to the worker
- Workers see the payment as "Paid" in their MTurk dashboard
- Payment includes the base HIT amount you specified when creating the HIT

## Optional: Bonus Payments 🔁

You can provide additional compensation for exceptional work:
- Navigate to: MTurk Dashboard → Workers → Bonus
- Enter the Worker ID and bonus amount
- Bonus payments are processed separately from the main HIT payment

## Best Practices 📝

### Code Generation and Display
- Store all survey codes in a database for verification
- Use clear, prominent display of completion codes
- The web application (https://fakeprofiledetection.github.io/web-data-collection-gcs/pages/hosting/start_study.html) generates codes upon completion
- Example display message:
  ```
  "Please copy this code and paste it into MTurk to receive payment: SURV123XYZ"
  ```

### Automation
- Consider auto-approval for codes if you're confident in your code generation process
- Implement validation endpoints to verify codes in real-time (see technical implementation below)

### Code Security 🔐
To prevent fraud and random code guessing:
- Use unique, unguessable codes (e.g., UUID format)
- Implement time-based expiration for codes
- Track code usage to prevent reuse
- Consider tying codes to MTurk Worker IDs or session information

## Technical Implementation

### Code Validation System
Based on the current implementation in `mturk_keystroke_study_template_v2.html`, the system includes:

1. **Real-time Validation**: Codes are validated as workers type them
2. **Visual Feedback**: Workers see immediate feedback (✅ valid, ❌ invalid, ⏳ loading)
3. **Submission Control**: Submit button is disabled until a valid code is entered
4. **API Integration**: Validation endpoint checks code validity, usage, and expiration

### Code Format
Current implementation uses format: `TASK-YYYYMMDD-XXXX-XXXXX`
- `TASK`: Prefix identifier
- `YYYYMMDD`: Date stamp
- `XXXX-XXXXX`: Unique identifier components

### Validation States
- **Valid**: Code exists, unused, and not expired
- **Used**: Code has already been submitted by another worker
- **Expired**: Code has passed its expiration time
- **Invalid**: Code doesn't exist in the system

## Security Considerations

### Fraud Prevention
1. **Unique Code Generation**: Each code should be cryptographically unique
2. **Time Limits**: Implement reasonable expiration times for codes
3. **Usage Tracking**: Prevent code reuse across multiple submissions
4. **Session Validation**: Optionally tie codes to specific worker sessions

### Database Security
- Store codes securely with appropriate access controls
- Log all validation attempts for audit purposes
- Implement rate limiting on validation endpoints
- Consider encryption for sensitive code data

## Monitoring and Analytics

### Key Metrics to Track
- Code generation rate
- Validation attempts vs. successful validations
- Time between code generation and submission
- Rejection/approval rates
- Worker satisfaction scores

### Error Handling
- Graceful handling of network issues during validation
- Clear error messages for workers
- Fallback procedures for system outages
- Support contact information for workers with issues

## Troubleshooting Common Issues

### Invalid Code Submissions
1. Check code format requirements
2. Verify database connectivity
3. Confirm code hasn't expired
4. Ensure code wasn't already used

### Worker Complaints
1. Provide clear instructions on code location
2. Offer multiple contact methods for support
3. Have a process for manual verification if needed
4. Consider implementing a grace period for technical issues

## Compliance and Ethics

### MTurk Terms of Service
- Ensure your HITs comply with MTurk's terms of service
- Provide fair compensation for time invested
- Maintain reasonable approval rates
- Respond to worker communications promptly

### Data Privacy
- Follow applicable privacy laws (GDPR, CCPA, etc.)
- Clearly communicate data usage in your HIT description
- Implement appropriate data retention policies
- Secure all collected data appropriately

---

*This documentation is based on the current implementation and MTurk best practices. Review and update regularly as requirements change.*