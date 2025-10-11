# Track Users Privately

Prefer privacy-first analytics (Plausible, Umami).

1. **Avoid collecting PII.**
   - Don't track names, emails, IP addresses, or precise locations
   - Use anonymized identifiers or aggregate data only
   - Disable fingerprinting and cross-site tracking

2. **Use self-hosted analytics if you want more control.**
   - Host Umami, Matomo, or Plausible on your own infrastructure
   - Keep data within your jurisdiction
   - Full ownership means no third-party data sharing
   - Examples: Deploy Umami via Docker or Vercel

3. **Document what you collect in your privacy policy.**
   - List specific metrics tracked (page views, referrers, device types)
   - Explain retention periods
   - Describe how users can opt out
   - Be transparent about any cookies used

4. **Respect Do Not Track (DNT) and consent preferences.**
   - Honor browser DNT signals
   - Implement cookie consent banners where required (GDPR, CCPA)
   - Allow users to opt out easily

5. **Use privacy-friendly defaults.**
   - Disable IP logging or hash IPs immediately
   - Aggregate data before storage
   - Set short retention periods (e.g., 6-12 months)
   - Avoid session recording unless absolutely necessary

6. **Consider cookieless tracking.**
   - Use server-side analytics
   - Leverage privacy-focused approaches that don't require cookies
   - Example: Cloudflare Web Analytics runs entirely cookieless

7. **Regular privacy audits.**
   - Review what data is actually being collected vs. what's needed
   - Delete unnecessary historical data
   - Update dependencies to patch privacy vulnerabilities