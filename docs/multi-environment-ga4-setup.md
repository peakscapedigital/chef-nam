# Multi-Environment GA4 Setup Guide

## Overview

This guide explains how to set up multiple Google Analytics 4 (GA4) properties for different environments (development, staging, production) using a single Google Tag Manager (GTM) container. This ensures clean data separation while maintaining a simple implementation.

## Architecture

### Single GTM Container, Multiple GA4 Properties
- **GTM Container**: GTM-WCMPN842 (shared across all environments)
- **Google Tag**: GT-MK9LG97Z (shared across all environments)
- **GA4 Properties**:
  - Production: G-74NR9FG5ZR
  - Development: G-[YOUR DEV ID]
  - Staging: G-[STAGING ID] (optional)

### Environment Detection Logic
GTM automatically routes data to the correct GA4 property based on the hostname where the code is running.

## Benefits

### ✅ Advantages
- **Clean Data Separation**: Development testing doesn't pollute production analytics
- **Easy Testing**: See tracking events in real-time during development
- **Single Codebase**: No environment-specific code changes needed
- **Consistent Tracking**: Same tracking setup across all environments
- **Professional Setup**: Industry standard approach for analytics

### ⚠️ Considerations
- **Multiple Properties**: Requires managing multiple GA4 properties
- **Setup Complexity**: Initial setup is more involved than single property
- **Reporting**: Need to check correct property for environment-specific data

## Implementation

### Step 1: Create Development GA4 Property

1. **Navigate to Google Analytics**
   - Go to [analytics.google.com](https://analytics.google.com)
   - Click "Admin" (gear icon)

2. **Create New Property**
   - Account: Use existing Chef Nam Catering account
   - Click "Create Property"
   - Property name: `Chef Nam Catering - Development`
   - Reporting time zone: America/New_York (match production)
   - Currency: USD

3. **Set Up Data Stream**
   - Platform: Web
   - Website URL: `https://chefnamcatering.com`
   - Stream name: `Dev`
   - Enhanced measurement: Enable (match production settings)

4. **Configure Google Tag**
   - Choose: **"Use the Google tag found on your website"**
   - Select existing tag: Chef Nam Catering (GT-MK9LG97Z)
   - This shares your existing GTM setup

5. **Record New Measurement ID**
   - Copy the new GA4 Measurement ID (e.g., G-ABC123DEV)
   - You'll need this for GTM configuration

### Step 2: Configure GTM Environment Variables

#### Create Page Hostname Variable
1. **GTM Variables** → **New**
2. **Configuration**:
   - Name: `Page Hostname`
   - Variable Type: Page URL
   - Component Type: Host Name
   - Strip www: ❌ **Leave unchecked**

#### Create Environment Detection Variable
1. **GTM Variables** → **New**
2. **Configuration**:
   - Name: `Environment`
   - Variable Type: Lookup Table
   - Input Variable: `{{Page Hostname}}`

3. **Lookup Table Rows**:
   | Input | Output |
   |-------|--------|
   | localhost | development |
   | localhost:8080 | development |
   | 127.0.0.1 | development |
   | *.chef-nam-website.pages.dev | staging |
   | chefnamcatering.com | production |
   | www.chefnamcatering.com | production |

4. **Default Value**: `unknown`

#### Create GA4 ID Selector Variable
1. **GTM Variables** → **New**
2. **Configuration**:
   - Name: `GA4 Measurement ID - Environment`
   - Variable Type: Lookup Table
   - Input Variable: `{{Environment}}`

3. **Lookup Table Rows**:
   | Input | Output |
   |-------|--------|
   | development | G-ABC123DEV |
   | staging | G-74NR9FG5ZR |
   | production | G-74NR9FG5ZR |

4. **Default Value**: Leave empty (no tracking for unknown environments)

### Step 3: Update GA4 Configuration Tag

1. **Find Your GA4 Configuration Tag**
   - GTM Tags → Find tag named "GA4 Configuration" or similar

2. **Update Configuration**:
   - Measurement ID: Change from `G-74NR9FG5ZR` to `{{GA4 Measurement ID - Environment}}`
   - This now dynamically selects the correct property

3. **Optional: Add Environment Parameter**
   - In the same tag, under "Fields to Set"
   - Parameter Name: `custom_environment`
   - Value: `{{Environment}}`
   - This tags all events with environment info

### Step 4: Configure Conversion Tracking

#### Copy Conversion Events to Dev Property
1. **Production GA4** → **Admin** → **Events**
2. **Note which events are marked as conversions**:
   - form_submit
   - phone_click
   - Any custom events

3. **Development GA4** → **Admin** → **Events**
4. **Mark same events as conversions** (may need to wait for events to appear first)

#### Set Up Custom Conversions (if any)
Copy any custom conversion events from production to development property with identical configurations.

## Testing & Validation

### GTM Preview Mode Testing
1. **Enable GTM Preview**
   - In GTM, click "Preview"
   - Enter: `http://localhost:8080`

2. **Test Environment Detection**
   - Check Variables tab in GTM debugger
   - Verify: `Environment` = "development"
   - Verify: `GA4 Measurement ID - Environment` = your dev ID

3. **Test Event Firing**
   - Submit a form
   - Click a phone number
   - Check that events fire with correct GA4 ID

### GA4 Real-time Validation
1. **Development Property**
   - GA4 Dev → Reports → Realtime
   - Should see localhost traffic and test events

2. **Production Property**
   - GA4 Production → Reports → Realtime
   - Should NOT see any localhost traffic

### Cross-Environment Testing
1. **Test on Production Site**:
   - Visit `https://chefnamcatering.com`
   - Test form submission
   - Verify events appear in Production GA4 only

2. **Test on Staging (if applicable)**:
   - Visit staging URL
   - Verify correct property receives data

## Environment Configuration Reference

### Hostname Mapping
| URL | Environment | GA4 Property |
|-----|-------------|--------------|
| http://localhost:8080 | development | Dev Property |
| http://127.0.0.1:8080 | development | Dev Property |
| https://abc123.chef-nam-website.pages.dev | staging | Production Property |
| https://chefnamcatering.com | production | Production Property |
| https://www.chefnamcatering.com | production | Production Property |

### GTM Variables Summary
| Variable Name | Type | Purpose |
|---------------|------|---------|
| Page Hostname | Built-in | Detects current domain |
| Environment | Lookup Table | Maps hostname to environment name |
| GA4 Measurement ID - Environment | Lookup Table | Selects correct GA4 property ID |

## Maintenance

### Adding New Environments
1. **Create new GA4 property** (if needed)
2. **Update Environment lookup table** with new hostname
3. **Update GA4 ID lookup table** with new property ID
4. **Test the new environment**

### Updating Property IDs
1. **Update GA4 ID lookup table** in GTM
2. **Publish GTM container**
3. **Test all environments**

### Regular Health Checks
- **Monthly**: Verify each environment is tracking to correct property
- **After deployments**: Test tracking on new staging URLs
- **After domain changes**: Update hostname mappings

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Localhost events in production GA4 | Check Environment variable output in GTM preview |
| No events in development GA4 | Verify dev GA4 property ID in lookup table |
| Events in wrong property | Check Page Hostname variable and lookup table mappings |
| No tracking on new staging URL | Add staging URL to Environment lookup table |

### Debug Steps
1. **GTM Preview Mode**:
   - Check all variables are firing correctly
   - Verify GA4 tags are using correct property ID

2. **Browser Console**:
   ```javascript
   // Check dataLayer contents
   console.log(dataLayer);
   
   // Check GTM variables
   google_tag_manager['GTM-WCMPN842'].dataLayer.get('Environment');
   ```

3. **GA4 Realtime Reports**:
   - Test events should appear in correct property within 1-2 minutes

### Support
- **GTM Issues**: Check GTM container publish status
- **GA4 Issues**: Verify property permissions and configuration
- **Environment Detection**: Test hostname variable in GTM preview

## Best Practices

### Development Workflow
1. **Always test locally first** - Use development property for all testing
2. **Stage before production** - Test on staging URLs when available
3. **Verify before launch** - Check production property only receives production traffic
4. **Monitor both properties** - Keep an eye on both dev and production data

### Data Management
- **Regular cleanup**: Archive old staging properties if no longer needed
- **Documentation**: Keep this guide updated when environments change
- **Access control**: Limit development property access to developers only
- **Reporting**: Use production property for all business reporting

## Implementation Checklist

### Initial Setup
- [ ] Create development GA4 property
- [ ] Configure Google Tag to use existing GTM container
- [ ] Create Page Hostname variable in GTM
- [ ] Create Environment lookup table variable
- [ ] Create GA4 ID selector variable
- [ ] Update GA4 Configuration tag to use environment variable
- [ ] Test localhost tracking in development property
- [ ] Verify production tracking unchanged

### Conversion Setup
- [ ] Copy conversion events to development property
- [ ] Test form submission tracking in both environments
- [ ] Test phone click tracking in both environments
- [ ] Verify conversion data appears in correct properties

### Validation
- [ ] GTM Preview mode shows correct environment detection
- [ ] Development events appear only in dev property
- [ ] Production events appear only in production property
- [ ] No cross-contamination between environments

## File References

### Related Documentation
- [Conversion Tracking Implementation](./conversion-tracking.md)
- Main GTM Container: GTM-WCMPN842
- Production GA4: G-74NR9FG5ZR

### Code Locations
- **Form Tracking**: `/src/pages/start-planning.astro`, `/src/pages/contact.astro`
- **Phone Tracking**: `/src/layouts/Layout.astro`
- **GTM Integration**: `/src/layouts/Layout.astro` (head section)

---

*Last Updated: August 19, 2025*  
*Version: 1.0*