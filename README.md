# Legal Ease

# INT Legal Management System

## UI/UX & Functional Specification

**Project:** INT Legal Management System  

**Company:** Integrated Technics (INT)  

**Prepared By:** Mr. Hafez Rahim  

**Version:** 1.0
**Language Arabic

---

# 1. Project Overview

The **INT Legal Management System** is designed to help the company's legal department manage all legal operations from one centralized platform.

The system enables the company lawyer to:

- Manage company legal documents.

- Manage employee contracts.

- Track contract and document expiry dates.

- Manage employee custody (company assets).

- Manage legal cases.

- Manage employee violations.

- Receive automatic reminders.

- Track daily legal tasks.

- Store documents securely.

- Generate legal reports.

- Maintain a complete audit trail.

---

# 2. Main Modules

```

Dashboard

Company Legal Documents

Employee Contracts

Employee Custody

Legal Cases

Daily Legal Tasks

Employee Violations

Legal Requests

Document Repository

Reports

Settings

```

---

# 3. Dashboard

## KPI Cards

- Total Employees

- Active Contracts

- Contracts Expiring Soon

- Expired Contracts

- Pending Signatures

- Company Assets Assigned

- Assets Pending Return

- Company Documents

- Expiring Licenses

- Open Legal Cases

- Today's Tasks

- Overdue Tasks

---

## Dashboard Widgets

- Calendar

- Upcoming Expirations

- Today's Tasks

- Notifications

- Recent Activities

- Recently Uploaded Documents

- Pending Approvals

- Employee Custody Alerts

---

# 4. Company Legal Documents

Store all company legal documents.

## Categories

- Commercial Registration

- Tax Card

- VAT Certificate

- Chamber of Commerce

- Import License

- Export License

- Insurance Policies

- Trademark Certificates

- Company Policies

- Lease Agreements

- Government Licenses

- NDA Templates

- Partnership Agreements

- Vendor Agreements

- Customer Agreements

- Internal Legal Documents

---

## Fields

| Field | Description |

|--------|-------------|

| Document Number | Unique Number |

| Document Name | Document Title |

| Category | Document Category |

| Authority | Issuing Authority |

| Issue Date | Issue Date |

| Expiry Date | Expiry Date |

| Reminder Before Expiry | Reminder Days |

| Status | Active / Expired / Archived |

| Responsible Person | Owner |

| Attachment | PDF / Scan |

| Notes | Additional Notes |

---

## Actions

- Upload

- Replace Version

- Download

- Preview

- Print

- Archive

- Share

---

# 5. Employee Contracts

Each employee can have multiple contracts.

## Contract Types

- Employment Contract

- Renewal

- Temporary Contract

- Probation Contract

- Promotion Contract

- Salary Amendment

- Remote Work Agreement

- NDA

- Resignation Agreement

---

## Employee Information

- Employee

- Employee Code

- Department

- Position

- Manager

- National ID

- Passport Number

---

## Contract Information

| Field |

|--------|

| Contract Number |

| Contract Type |

| Issue Date |

| Start Date |

| End Date |

| Duration |

| Salary |

| Currency |

| Working Hours |

| Probation Period |

| Status |

| Auto Renewal |

| Reminder Before Expiry |

| Signed Copy |

| Notes |

---

## Workflow

```

Draft

↓

Under Review

↓

Approved

↓

Signed

↓

Active

↓

Expired

↓

Renewed

```

---

# 6. Employee Custody

Manage all company assets assigned to employees.

## Asset Categories

- Laptop

- Desktop

- Monitor

- Mobile Phone

- Tablet

- SIM Card

- Printer

- Scanner

- Vehicle

- Office Keys

- Access Card

- Router

- Headset

- Power Bank

- USB Token

- Security Key

- Other Equipment

---

## Asset Information

| Field |

|--------|

| Asset Code |

| Asset Name |

| Category |

| Brand |

| Model |

| Serial Number |

| Purchase Date |

| Warranty |

| Condition |

| Current Status |

---

## Assignment Information

| Field |

|--------|

| Employee |

| Department |

| Assigned By |

| Assigned Date |

| Expected Return Date |

| Actual Return Date |

| Condition Before |

| Condition After |

| Employee Signature |

| HR Signature |

| Lawyer Signature |

| Notes |

| Attachments |

---

## Asset Status

- Available

- Assigned

- Returned

- Lost

- Damaged

- Maintenance

- Disposed

---

# 7. Daily Legal Tasks

Task management for the company lawyer.

---

## Task Categories

- Contract Preparation

- Contract Review

- Court Attendance

- Government Office

- License Renewal

- Employee Investigation

- Legal Consultation

- Agreement Review

- Policy Review

- Compliance

- Vendor Contract

- Customer Contract

- Follow-up

---

## Task Fields

| Field |

|--------|

| Task Number |

| Task Title |

| Category |

| Priority |

| Assigned To |

| Created By |

| Due Date |

| Reminder |

| Status |

| Progress |

| Description |

| Attachments |

| Comments |

---

## Task Status

- New

- In Progress

- Waiting

- Completed

- Cancelled

- Overdue

---

# 8. Legal Cases

Track legal cases.

---

## Fields

| Field |

|--------|

| Case Number |

| Case Name |

| Case Type |

| Opponent |

| Court |

| Law Firm |

| Assigned Lawyer |

| Start Date |

| Next Hearing |

| Financial Value |

| Status |

| Priority |

| Documents |

| Notes |

---

## Case Status

- Open

- Under Investigation

- In Court

- Waiting

- Closed

- Archived

---

# 9. Employee Violations

Manage employee disciplinary records.

---

## Violation Types

- Verbal Warning

- First Warning

- Second Warning

- Final Warning

- Investigation

- Suspension

- Termination Recommendation

---

## Fields

- Employee

- Department

- Violation Type

- Description

- Date

- Witnesses

- Attachments

- Decision

- Status

---

# 10. Legal Requests

Employees may submit legal requests.

---

## Request Types

- Contract Copy

- Employment Letter

- Salary Certificate

- NDA

- Visa Letter

- Complaint

- Legal Consultation

- Resignation Review

---

## Workflow

```

Employee

↓

Manager

↓

HR

↓

Lawyer

↓

Completed

```

---

# 11. Document Repository

Centralized storage for all legal files.

---

## Folder Structure

```

Company

Employees

Contracts

Legal Cases

Policies

Government Documents

Assets

Templates

Archived

```

---

## Features

- Version Control

- OCR Search

- Full Text Search

- Tags

- Categories

- Preview

- Download

- Permission Control

---

# 12. Expiry Management

Automatic reminders for:

- Employee Contracts

- Company Licenses

- Commercial Registration

- Tax Card

- Insurance

- Lease Agreements

- Vendor Contracts

- Customer Contracts

- NDA

- Warranty

- Passports

- National IDs

- Residence Permits

- Vehicle Licenses

---

## Reminder Schedule

- 90 Days

- 60 Days

- 30 Days

- 15 Days

- 7 Days

- 1 Day

- Expired

---

# 13. Notifications

Notification Channels

- System Notification

- Email

- SMS

- WhatsApp *(Optional)*

- Mobile Push Notification

---

# 14. Global Search

Search by:

- Employee

- Employee Code

- Contract Number

- Document Number

- Case Number

- Asset Code

- Serial Number

- National ID

- Passport

- Tags

- Category

---

# 15. Reports

## Employee Reports

- Employee Contracts

- Expiring Contracts

- Expired Contracts

---

## Company Reports

- Company Documents

- Expiring Documents

- Renewals

---

## Custody Reports

- Assigned Assets

- Returned Assets

- Lost Assets

- Damaged Assets

---

## Legal Reports

- Legal Cases

- Violations

- Daily Tasks

- Lawyer Productivity

- Upcoming Renewals

---

# 16. User Roles

| Role | Permissions |

|------|-------------|

| System Administrator | Full Access |

| Lawyer | Full Legal Access |

| HR | Employee & Contract Access |

| Department Manager | View Related Employees |

| Employee | Own Records |

| Executive Management | Reports & Dashboard |

| Auditor | Read Only |

---

# 17. Audit Log

Record every system activity.

Examples:

- Login

- Logout

- Upload

- Download

- Edit

- Delete

- Approval

- Assignment

- Asset Return

- Renewal

- Signature

- Archive

---

# 18. Security

- Role-Based Access Control (RBAC)

- Encrypted Document Storage

- Digital Signatures

- Version History

- Watermarking

- Secure File Downloads

- Activity Logs

- Automatic Backup

- Two-Factor Authentication (Optional)

---

# 19. Future Enhancements

- AI-powered document classification

- OCR for scanned documents

- Digital signature workflow

- Contract template generator

- Clause extraction using AI

- Outlook & Google Calendar synchronization

- QR Code for employee custody

- Barcode support

- Mobile application

- Integration with INT HR

- Integration with INT ERP

- Integration with INT Help Desk

- Integration with Microsoft 365

- Power BI dashboards

- Electronic approval workflow

- Compliance monitoring dashboard

---

# 20. System Goals

The INT Legal Management System aims to:

- Centralize all legal operations.

- Reduce paper-based processes.

- Prevent missed contract or license expirations.

- Improve legal compliance.

- Track employee custody accurately.

- Enhance document security.

- Increase operational efficiency.

- Provide management with real-time legal insights.

- Integrate seamlessly with the existing INT ecosystem (HR, ERP, CRM, Help Desk, and Logistics).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/32e82fb5-25d8-4223-9618-0290ccec4b61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
