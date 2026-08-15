INT Document Archive
│
├── Dashboard
│
├── Departments
│   ├── HR
│   ├── Finance
│   ├── Legal
│   ├── Administration
│   ├── IT
│   ├── Operations
│   ├── Procurement
│   └── Management
│
├── My Documents
├── Shared Documents
├── Recent Documents
├── Expiring Documents
├── Favorites
├── Trash
│
├── Document Categories
├── Users & Permissions
├── Document Templates
├── Audit Logs
├── Reports
└── Settings



6. User Roles

أقترح عدم إعطاء الصلاحيات بشكل عشوائي لكل مستخدم، وإنما استخدام Roles.

Super Admin

يستطيع:

الوصول لكل الأقسام.
إنشاء المستخدمين.
إنشاء الأقسام.
تعديل الصلاحيات.
حذف/استرجاع الملفات.
رؤية Audit Logs.
إدارة Settings.
Department Manager

يستطيع:

رؤية ملفات قسمه.
رفع الملفات.
تعديل الملفات.
حذف الملفات حسب الصلاحية.
إنشاء folders.
إضافة مستخدمين للقسم إذا سمح له.
مشاركة ملفات مع مستخدمين آخرين.
رؤية Activity الخاصة بالقسم.
Department User

يستطيع:

رفع الملفات.
مشاهدة ملفات القسم.
تحميل الملفات.
تعديل الملفات التي يملكها.
البحث في ملفات القسم.
Viewer

يستطيع:

مشاهدة الملفات.
تحميل الملفات إذا سمح له.
لا يستطيع التعديل أو الحذف.
7. Document Structure

كل ملف يجب أن يحتوي على Metadata وليس مجرد File Upload.

مثال:

Field	Description
Document Name	اسم المستند
Document Number	رقم المستند
Department	القسم
Category	نوع المستند
Folder	المجلد
Description	وصف
Issue Date	تاريخ الإصدار
Expiry Date	تاريخ الانتهاء
Document Owner	صاحب المستند
Uploaded By	من قام بالرفع
Upload Date	تاريخ الرفع
Version	رقم النسخة
Status	Active / Expired / Archived
Confidentiality	Normal / Confidential / Highly Confidential
Tags	كلمات البحث
File	المستند
8. Folder System

يجب أن يكون النظام شبيهًا بـGoogle Drive من ناحية تنظيم الملفات.

مثلاً:

HR
└── Employees
    ├── Employee 001
    │   ├── Contract
    │   ├── ID
    │   ├── Passport
    │   ├── Certificates
    │   └── Other
    │
    └── Employee 002
        ├── Contract
        ├── ID
        └── Passport

ويستطيع المستخدم:

New Folder

ثم:

Folder Name
Parent Folder
Description
Access Permission
9. Upload Document

عند الضغط على:

Upload Document

تظهر:

Basic Information
Document Name
Document Number
Category
Folder
Description
Dates
Issue Date
Expiry Date
Classification
Normal
Confidential
Highly Confidential
File

Drag & Drop

Drag & Drop your files here

or

Browse Files

ثم:

Upload Document

10. Multiple File Upload

يجب دعم رفع أكثر من ملف في نفس الوقت.

مثلاً:

Upload Documents

✓ Employee Contract.pdf
✓ Passport.pdf
✓ National ID.jpg
✓ Certificate.pdf

مع Progress:

Employee Contract.pdf       100%
Passport.pdf                100%
National ID.jpg              75%
Certificate.pdf              20%
11. Document Preview

بدلاً من إجبار المستخدم على تحميل الملف، يكون هناك:

Preview

يدعم:

PDF Preview
Image Preview
Word Preview
Excel Preview

مع معلومات جانبية:

Document Information

Name: Employee Contract
Department: HR
Category: Contract
Uploaded By: Ahmed
Upload Date: 08 Aug 2026
Expiry Date: 08 Aug 2027
Version: V2
Classification: Confidential
12. Document Versioning

هذه نقطة مهمة جدًا للشركة.

إذا تم رفع عقد جديد لنفس المستند:

Employee Contract

Version 1
08 Jan 2026

Version 2
08 Aug 2026

النظام لا يقوم باستبدال الملف القديم نهائيًا.

بل يحتفظ بـ:

V1
V2
V3
...

مع:

Uploaded By
Date
Changes
Version Number
13. Document Sharing

يمكن مشاركة ملف مع:

User

مثلاً:

Share With:

☑ Ahmed
☑ Mohamed
☐ Ali

أو:

Department
Share With Department:

Legal
Finance
HR

وتحديد الصلاحية:

View
Download
Edit
Share
14. Expiry Management

هذه من أهم وظائف النظام.

أي مستند له:

Expiry Date

يتم مراقبته تلقائيًا.

مثلاً:

Expiring Documents

Document             Expiry       Remaining
------------------------------------------------
Company License      15 Aug 2026   6 Days
Employee Contract    20 Aug 2026   11 Days
Insurance            01 Sep 2026   23 Days
Passport             10 Sep 2026   32 Days

والنظام يرسل Notifications:

30 days before
15 days before
7 days before
1 day before
Expired

ويمكن جعل هذه المدة قابلة للتعديل من Settings.

15. Notifications

يكون هناك Notification Center.

مثلاً:

🔔 Document Expiring

Company License will expire in 7 days.

🔔 New Document

Ahmed uploaded a new document to Finance.

🔔 Shared Document

Legal Department shared a document with you.

🔔 Document Updated

Employee Contract has been updated to Version 3.