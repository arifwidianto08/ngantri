# Quickstart Guide: Food Court Ordering System

**Date**: 2025-10-05  
**Feature**: Food Court Ordering System  
**Branch**: 001-build-me-an

## Overview

This guide provides step-by-step scenarios for testing the complete food court ordering system workflow. Each scenario validates critical user journeys and system functionality.

## Prerequisites

- System deployed and accessible via web browser
- Test merchants registered with sample menu data
- QR codes generated and available for scanning
- WhatsApp Business API configured for notifications

## Test Data Setup

### Sample Merchants

1. **Merchant 1**: "Nasi Gudeg Pak Joko" (Phone: +6281234567890, Merchant #001)
2. **Merchant 2**: "Soto Betawi Bu Sri" (Phone: +6281234567891, Merchant #002)
3. **Merchant 3**: "Es Teh Manis Corner" (Phone: +6281234567892, Merchant #003)

### Sample Menu Items

- **Gudeg Pak Joko**: Gudeg Komplit (Rp 25,000), Ayam Bakar (Rp 20,000), Es Teh (Rp 5,000)
- **Soto Bu Sri**: Soto Betawi (Rp 30,000), Kerupuk (Rp 3,000), Es Jeruk (Rp 8,000)
- **Es Teh Corner**: Es Teh Manis (Rp 5,000), Es Kopi (Rp 10,000), Gorengan (Rp 12,000)

## Scenario 1: Merchant Registration and Setup

**Objective**: Verify merchants can register and set up their business profile and menu.

### Steps:

1. **Merchant Registration**

   - Navigate to `/merchant/register`
   - Fill form with test merchant data
   - Submit registration
   - **Expected**: Successful registration, redirect to dashboard

2. **Profile Setup**

   - Upload merchant profile image (test with JPEG, PNG, WebP formats)
   - Verify image upload validation (file type, size limits)
   - Add business description
   - Set availability status to "Available"
   - **Expected**: Profile updated successfully, image displays correctly

3. **Image Upload Testing**

   - Test invalid file types (PDF, GIF, etc.)
   - Test oversized files (>2MB)
   - Test image optimization and resizing
   - **Expected**: Proper validation errors and optimized image storage

4. **Menu Category Creation**

   - Create categories: "Main Dishes", "Beverages", "Snacks"
   - **Expected**: Categories appear in merchant dashboard

5. **Menu Item Creation**

   - Add menu items to each category
   - Set prices, descriptions, and availability
   - Upload item images for each menu item
   - Test image upload validation and optimization
   - **Expected**: Menu items display correctly with optimized images

6. **Menu Management**
   - Toggle item availability on/off
   - Update prices and descriptions
   - **Expected**: Changes reflect immediately in system

### Validation Criteria:

- [ ] Merchant can register with phone number and password
- [ ] Profile information saves and displays correctly
- [ ] Image upload works with proper file validation (type, size)
- [ ] Uploaded images are optimized and stored correctly
- [ ] Images serve properly as static assets with good performance
- [ ] Menu categories and items are created successfully
- [ ] Price formatting displays correctly (Indonesian Rupiah - IDR)
- [ ] Availability toggles work in real-time
- [ ] File upload error handling provides clear feedback

## Scenario 2: Customer QR Code Access and Browsing

**Objective**: Verify customers can access the system via QR codes and browse available menus.

### Steps:

1. **QR Code Scanning**

   - Use mobile device to scan table QR code
   - **Expected**: Redirect to commerce homepage

2. **Merchant Discovery**

   - View list of available merchants
   - See merchant images, names, and availability status
   - **Expected**: Only available merchants display

3. **Menu Browsing**

   - Select a merchant to view their menu
   - Browse by categories
   - View item details, prices, and images
   - **Expected**: Menu loads quickly with proper mobile formatting

4. **Multi-Merchant Browsing**
   - Navigate between different merchant menus
   - Compare prices and options
   - **Expected**: Smooth navigation, consistent UI patterns

### Validation Criteria:

- [ ] QR code redirects work on mobile devices
- [ ] Homepage loads within 3 seconds
- [ ] Merchant list displays correctly with proper formatting
- [ ] Menu items show accurate prices and availability
- [ ] Images load optimally for mobile viewing
- [ ] Navigation between merchants is intuitive

## Scenario 3: Multi-Merchant Cart Management

**Objective**: Verify customers can add items from multiple merchants to cart and manage quantities.

### Steps:

1. **Add Items to Cart**

   - Add 2x Gudeg Komplit from Merchant 1
   - Add 1x Soto Betawi from Merchant 2
   - Add 1x Es Teh Manis from Merchant 3
   - **Expected**: Cart shows items grouped by merchant

2. **Cart Management**

   - Update quantities for existing items
   - Remove one item completely
   - Add more items from existing merchants
   - **Expected**: Cart totals update correctly

3. **Cart Persistence**

   - Navigate away from cart and return
   - **Expected**: Cart contents preserved during session

4. **Cart Display**
   - View cart organized by merchant
   - See individual merchant totals
   - View overall cart summary
   - **Expected**: Clear organization, accurate calculations

### Validation Criteria:

- [ ] Items from multiple merchants can be added to cart
- [ ] Cart groups items by merchant correctly
- [ ] Quantity updates reflect immediately
- [ ] Price calculations are accurate (no floating-point errors)
- [ ] Cart persists during browser session
- [ ] Mobile cart interface is user-friendly

## Scenario 4: Checkout and Order Creation

**Objective**: Verify checkout process creates orders correctly and handles multi-merchant scenarios.

### Steps:

1. **Checkout Initiation**

   - Click checkout with multi-merchant cart
   - **Expected**: Prompt for customer information

2. **Customer Information**

   - Enter name: "Test Customer"
   - Enter WhatsApp number: +6281234567893
   - Submit checkout form
   - **Expected**: Form validation works correctly

3. **Order Generation**

   - System creates separate orders for each merchant
   - Generate unique order numbers (YYMMDD-XXXX format)
   - **Expected**: Multiple orders created with correct data

4. **Order Confirmation**
   - Display order confirmations with unique numbers
   - Show merchant locations (numbers) for in-person payment
   - Provide order access links
   - **Expected**: Clear confirmation with actionable information

### Validation Criteria:

- [ ] Checkout requires valid customer information
- [ ] Phone number validation works correctly
- [ ] Separate orders created for each merchant
- [ ] Order numbers follow correct format and are unique
- [ ] Order confirmation displays all necessary information
- [ ] Time-limited access links are generated

## Scenario 5: In-Person Payment and Order Acceptance

**Objective**: Verify merchants can view orders, accept payments, and update order status.

### Steps:

1. **Order Notification**

   - Merchant logs into dashboard
   - Views new orders in "Payment Pending" status
   - **Expected**: Orders display with customer and item details

2. **Payment Acceptance**

   - Customer visits merchant location using merchant number
   - Merchant verifies order details
   - Customer pays in person
   - Merchant updates order status to "Paid"
   - **Expected**: Status update reflects immediately

3. **Order Preparation**
   - Merchant updates status to "Preparing"
   - **Expected**: Status visible to both merchant and customer

### Validation Criteria:

- [ ] Merchants receive orders immediately after checkout
- [ ] Order details are complete and accurate
- [ ] Status updates work correctly
- [ ] Merchant dashboard is user-friendly on mobile
- [ ] Payment confirmation process is straightforward

## Scenario 6: Order Preparation and Customer Notification

**Objective**: Verify merchants can notify customers when orders are ready for pickup.

### Steps:

1. **Order Completion**

   - Merchant finishes preparing order
   - Updates status to "Ready for Pickup"
   - **Expected**: Status change triggers notification options

2. **WhatsApp URL Generation**

   - Merchant clicks "Notify via WhatsApp"
   - System generates wa.me URL with preset message
   - **Expected**: WhatsApp URL opens customer's WhatsApp app

3. **Message Content**

   - Preset message includes merchant name
   - Contains order number for identification
   - Provides pickup instructions
   - **Expected**: Clear, professional message format in WhatsApp

4. **WhatsApp Integration**

   - URL opens WhatsApp app or web client
   - Message is pre-filled in chat
   - Merchant can send message directly
   - **Expected**: Seamless transition to WhatsApp with message ready

5. **Direct Call Option**
   - Merchant can initiate direct call to customer
   - **Expected**: Phone dialer opens with customer number

### Validation Criteria:

- [ ] Status update to "Ready" enables notification options
- [ ] WhatsApp URL generation works correctly
- [ ] wa.me links open WhatsApp app/web properly
- [ ] Preset messages contain proper order information
- [ ] Direct call functionality works on mobile devices
- [ ] Notification timestamps are recorded

## Scenario 7: Order Pickup and Completion

**Objective**: Verify order pickup process and final completion workflow.

### Steps:

1. **Customer Order Access**

   - Customer receives WhatsApp notification
   - Clicks order link (if app was closed)
   - **Expected**: Order details display correctly

2. **Order Pickup**

   - Customer arrives at merchant location
   - Presents order number for verification
   - Collects prepared order
   - **Expected**: Easy order identification process

3. **Order Completion**
   - Merchant marks order as "Picked Up"
   - System updates status to "Completed"
   - **Expected**: Order workflow completes successfully

### Validation Criteria:

- [ ] Order access links work correctly
- [ ] Order details remain accessible after app closure
- [ ] Pickup process is efficient and clear
- [ ] Final status updates work properly
- [ ] Completed orders are properly archived

## Scenario 8: Error Handling and Edge Cases

**Objective**: Verify system handles error conditions gracefully.

### Steps:

1. **Invalid QR Code**

   - Scan invalid or expired QR code
   - **Expected**: Appropriate error message

2. **Unavailable Items**

   - Add item to cart, merchant marks unavailable
   - Proceed to checkout
   - **Expected**: System handles unavailable items gracefully

3. **Session Expiry**

   - Leave cart idle for extended period
   - Return to continue shopping
   - **Expected**: Session handling works appropriately

4. **Network Issues**
   - Simulate poor network conditions
   - Test order submission and status updates
   - **Expected**: Proper error messages and retry mechanisms

### Validation Criteria:

- [ ] Error messages are clear and actionable
- [ ] System prevents invalid transactions
- [ ] Network issues are handled gracefully
- [ ] Data integrity is maintained during errors

## Performance Validation

### Load Testing Scenarios:

1. **Concurrent Ordering**

   - Simulate 10 customers ordering simultaneously
   - **Target**: All orders processed within 5 seconds

2. **Menu Browsing**

   - Multiple users browsing menus concurrently
   - **Target**: Page loads under 3 seconds

3. **Merchant Dashboard**
   - Multiple merchants accessing dashboard simultaneously
   - **Target**: Dashboard responsive under load

### Validation Criteria:

- [ ] System handles concurrent users effectively
- [ ] Response times meet SLA requirements (<200ms API, <3s pages)
- [ ] Database performance remains stable under load
- [ ] Image upload and processing don't create performance issues

## Acceptance Checklist

### Functional Requirements:

- [ ] All merchant registration and management features work
- [ ] Image upload functionality works correctly with validation
- [ ] Public menu browsing functions correctly
- [ ] Cart management handles multi-merchant scenarios
- [ ] Order creation and tracking work end-to-end
- [ ] WhatsApp URL generation works for customer communication
- [ ] Order status workflow completes successfully

### Non-Functional Requirements:

- [ ] Mobile-first design is responsive and user-friendly
- [ ] Performance meets defined SLA targets
- [ ] Error handling provides good user experience
- [ ] Security measures protect user data
- [ ] Accessibility standards are met (WCAG 2.1 AA)

### Constitution Compliance:

- [ ] Code quality standards maintained
- [ ] Test coverage meets targets (90% unit, 80% integration)
- [ ] UX consistency maintained across all interfaces
- [ ] Performance requirements satisfied

## Deployment Validation

### Pre-Production Checklist:

- [ ] Database migrations run successfully
- [ ] Environment variables configured correctly
- [ ] WhatsApp API credentials are valid
- [ ] Static assets deploy and load correctly
- [ ] SSL certificates are properly configured

### Production Readiness:

- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Performance monitoring baseline established
- [ ] Error tracking and logging operational
