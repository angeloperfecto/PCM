'use client';

import React, { useState, useId, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { usePCM } from '@/lib/store';
import {
  StudentProfile,
  StudentRequirementItem,
  EnrollmentStatus,
  AdmissionApplication,
} from '@/lib/types';
import {
  calculateStudentAge,
  generateStudentId,
  generateApplicationNumber,
  getDefaultStudentRequirements,
} from '@/lib/studentDefaults';
import { uploadStudentFile, formatFileSize } from '@/lib/storageService';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Church,
  BookOpen,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Eye,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Sparkles,
  HeartHandshake,
  Award,
  Layers,
  Search,
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';

interface StudentRegistrationWizardProps {
  initialAppRef?: string;
  initialAppData?: Partial<any>;
  onCompleted?: (student: StudentProfile) => void;
  onCancel?: () => void;
}

export const StudentRegistrationWizard: React.FC<StudentRegistrationWizardProps> = ({
  initialAppRef,
  initialAppData,
  onCompleted,
  onCancel,
}) => {
  const {
    programs,
    students,
    applications,
    createStudentProfile,
    submitApplication,
    updateApplicationStatus,
    getApplicationByRef,
    fetchApplicationByRef,
    navigateTo,
    addToast,
    logActivity,
  } = usePCM();

  const fileInputId = useId();

  // Current Step: 1 to 9
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedAppNo, setCopiedAppNo] = useState<boolean>(false);
  const [submittedProfile, setSubmittedProfile] = useState<StudentProfile | null>(null);

  // Resolve initial target application from props
  const getInitialTargetApp = (): AdmissionApplication | null => {
    if (initialAppRef) {
      const found = getApplicationByRef(initialAppRef) || applications.find(
        (a) => a.referenceNumber?.trim().toLowerCase() === initialAppRef.trim().toLowerCase()
      );
      if (found) return found;
    }
    if (initialAppData && Object.keys(initialAppData).length > 0) {
      return initialAppData as AdmissionApplication;
    }
    return null;
  };

  const initialApp = getInitialTargetApp();

  // Connected Admissions Application State
  const [linkedApp, setLinkedApp] = useState<AdmissionApplication | null>(initialApp);
  const [syncQuery, setSyncQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Helper to extract parsed names & age from an application
  const extractAppFields = (app: AdmissionApplication) => {
    let fName = '';
    let mName = '';
    let lName = '';
    let sfx = '';

    if (app.fullName) {
      const parts = app.fullName.trim().split(/\s+/);
      if (parts.length === 1) {
        fName = parts[0];
      } else if (parts.length === 2) {
        fName = parts[0];
        lName = parts[1];
      } else if (parts.length >= 3) {
        fName = parts[0];
        mName = parts.slice(1, -1).join(' ');
        lName = parts[parts.length - 1];
      }
    }

    const matchedProgram = programs.find(
      (p) =>
        p.id === app.programId ||
        p.name?.toLowerCase() === app.programName?.toLowerCase() ||
        p.name?.toLowerCase() === app.program?.toLowerCase() ||
        p.title?.toLowerCase() === app.program?.toLowerCase()
    );

    const dob = app.dateOfBirth || app.birthDate;
    const calculatedAge = dob ? calculateStudentAge(dob) : undefined;

    return {
      applicationNumber: app.referenceNumber || '',
      firstName: fName,
      middleName: mName,
      lastName: lName,
      suffix: sfx,
      preferredName: fName,
      email: app.email || '',
      mobileNumber: app.phone || '',
      dateOfBirth: app.dateOfBirth || app.birthDate || '',
      age: calculatedAge !== undefined ? String(calculatedAge) : '',
      sex: (app.gender === 'Female' ? 'Female' : 'Male') as string,
      civilStatus: (app.civilStatus || 'Single') as string,
      currentAddress: app.address || '',
      permanentAddress: app.address || '',
      churchName: app.churchAffiliation || app.churchName || app.church || app.homeChurch || '',
      pastorName: app.pastorName || '',
      pastorContactNumber: app.pastorContact || '',
      callingTestimony:
        app.christianTestimony ||
        app.personalTestimony ||
        app.salvationTestimony ||
        app.callingStatement ||
        '',
      lastSchoolAttended:
        app.highSchool || app.previousCollege || app.previousSchool || '',
      highestEducationalAttainment: app.highestEducation || 'Senior High School Graduate',
      programId: matchedProgram?.id || programs[0]?.id || 'prog-bth',
      programTitle: matchedProgram?.name || app.program || programs[0]?.name || 'Bachelor of Arts in Theology',
    };
  };

  const initialFields = initialApp ? extractAppFields(initialApp) : null;

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    applicantType: 'New Student' as 'New Student' | 'Returning Student' | 'Transfer Student',
    studentIdNumber: generateStudentId('2026-2027'),
    existingStudentId: '',
    applicationNumber: initialFields?.applicationNumber || generateApplicationNumber('2026-2027'),
    firstName: initialFields?.firstName || '',
    middleName: initialFields?.middleName || '',
    lastName: initialFields?.lastName || '',
    suffix: initialFields?.suffix || '',
    preferredName: initialFields?.preferredName || '',
    profilePhoto: '',
    dateOfBirth: initialFields?.dateOfBirth || '',
    placeOfBirth: '',
    age: initialFields?.age || '',
    sex: (initialFields?.sex || 'Male') as string,
    civilStatus: (initialFields?.civilStatus || 'Single') as string,
    nationality: 'Filipino',
    religion: 'Christian (Evangelical / Church of Christ)',

    // Step 2: Contact Information
    mobileNumber: initialFields?.mobileNumber || '',
    email: initialFields?.email || '',
    facebookAccount: '',
    currentAddress: initialFields?.currentAddress || '',
    permanentAddress: initialFields?.permanentAddress || '',
    sameAsCurrentAddress: true,
    city: 'Baguio City',
    province: 'Benguet',
    zipCode: '2600',

    // Step 3: Family & Emergency Contact
    fatherName: '',
    motherName: '',
    guardianName: '',
    guardianRelationship: 'Father',
    guardianContactNumber: '',
    guardianEmail: '',
    guardianAddress: '',
    emergencyContactPerson: '',
    emergencyContactNumber: '',
    emergencyContactRelationship: 'Parent',

    // Step 4: Educational Background
    lastSchoolAttended: initialFields?.lastSchoolAttended || '',
    schoolAddress: '',
    highestEducationalAttainment: initialFields?.highestEducationalAttainment || 'Senior High School Graduate',
    previousCourse: 'GAS (General Academic Strand)',
    yearGraduated: '2025',
    graduationDate: '',
    previousSchoolId: '',
    honorsAwards: '',

    // Step 5: Church & Ministry Information
    churchName: initialFields?.churchName || '',
    churchAddress: '',
    churchContactNumber: '',
    pastorName: initialFields?.pastorName || '',
    pastorContactNumber: initialFields?.pastorContactNumber || '',
    ministryDepartment: 'Youth Ministry',
    ministryRole: 'Youth Leader / Musician',
    yearsInMinistry: '2',
    dateStartedInMinistry: '',
    ministryExperience: '',
    callingTestimony: initialFields?.callingTestimony || '',

    // Step 6: PCM Program & Enrollment
    academicYear: '2026–2027',
    semester: '1st Semester',
    programId: initialFields?.programId || programs[0]?.id || 'prog-bth',
    programTitle: initialFields?.programTitle || programs[0]?.name || 'Bachelor of Arts in Theology',
    major: 'General Pastoral Studies',
    yearLevel: '1st Year',
    section: 'Section A',

    // Agreement
    declarationAgreed: false,
  });

  // Step 7: Requirements List with live upload attachments
  const [requirements, setRequirements] = useState<StudentRequirementItem[]>(() =>
    getDefaultStudentRequirements()
  );
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate age when DOB changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    const calculatedAge = calculateStudentAge(dob);
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: dob,
      age: calculatedAge !== undefined ? String(calculatedAge) : '',
    }));
  };

  // Synchronize wizard fields from an Admissions Application record upon user request
  const autoSyncFromApplication = useCallback(
    (app: AdmissionApplication) => {
      const fields = extractAppFields(app);

      setFormData((prev) => ({
        ...prev,
        applicationNumber: fields.applicationNumber || prev.applicationNumber,
        firstName: fields.firstName || prev.firstName,
        middleName: fields.middleName || prev.middleName,
        lastName: fields.lastName || prev.lastName,
        suffix: fields.suffix || prev.suffix,
        preferredName: fields.preferredName || prev.preferredName,
        email: fields.email || prev.email,
        mobileNumber: fields.mobileNumber || prev.mobileNumber,
        dateOfBirth: fields.dateOfBirth || prev.dateOfBirth,
        age: fields.age || prev.age,
        sex: fields.sex || prev.sex,
        civilStatus: fields.civilStatus || prev.civilStatus,
        currentAddress: fields.currentAddress || prev.currentAddress,
        permanentAddress: fields.permanentAddress || prev.permanentAddress,
        churchName: fields.churchName || prev.churchName,
        pastorName: fields.pastorName || prev.pastorName,
        pastorContactNumber: fields.pastorContactNumber || prev.pastorContactNumber,
        callingTestimony: fields.callingTestimony || prev.callingTestimony,
        lastSchoolAttended: fields.lastSchoolAttended || prev.lastSchoolAttended,
        highestEducationalAttainment: fields.highestEducationalAttainment || prev.highestEducationalAttainment,
        programId: fields.programId || prev.programId,
        programTitle: fields.programTitle || prev.programTitle,
      }));

      setLinkedApp(app);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programs]
  );

  // Manually link & pre-fill by reference code or email
  const handleSyncApplication = async () => {
    const q = syncQuery.trim();
    if (!q) {
      addToast('info', 'Input Required', 'Please enter your Application Reference Number or email.');
      return;
    }

    setIsSyncing(true);
    let found =
      getApplicationByRef(q) ||
      applications.find(
        (a) =>
          a.referenceNumber?.trim().toLowerCase() === q.toLowerCase() ||
          a.email?.trim().toLowerCase() === q.toLowerCase() ||
          a.studentId?.trim().toLowerCase() === q.toLowerCase()
      );

    if (!found && fetchApplicationByRef) {
      found = await fetchApplicationByRef(q);
    }

    if (found) {
      autoSyncFromApplication(found);
      addToast(
        'success',
        'Connected to Admissions Application',
        `Synchronized data for ${found.fullName} (${found.referenceNumber}).`
      );
      setSyncQuery('');
    } else {
      addToast(
        'warning',
        'Application Not Found',
        `No application found matching "${syncQuery}". You may also continue your registration as a new applicant directly.`
      );
    }
    setIsSyncing(false);
  };

  // Duplicate Check
  const checkDuplicate = (): string | null => {
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) return null;

    const existingStudent = students.find(
      (s) => s.email?.trim().toLowerCase() === cleanEmail && s.studentId !== formData.studentIdNumber
    );
    if (existingStudent) {
      return `A student profile with email "${cleanEmail}" already exists with Student ID: ${existingStudent.studentId}. Please login to your existing account or contact the Registrar.`;
    }

    // Auto-link to existing application without throwing an error
    const existingApp = applications.find(
      (a) =>
        (a.email?.trim().toLowerCase() === cleanEmail ||
          a.referenceNumber?.trim().toLowerCase() === formData.applicationNumber.trim().toLowerCase()) &&
        a.status !== 'Rejected'
    );
    if (existingApp && !linkedApp) {
      setLinkedApp(existingApp);
    }

    return null;
  };

  // Step-by-Step Validation
  const validateCurrentStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required.';
      if (!formData.sex) newErrors.sex = 'Sex / Gender is required.';
      if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required.';
    } else if (step === 2) {
      if (!formData.mobileNumber.trim()) {
        newErrors.mobileNumber = 'Mobile number is required.';
      } else if (!/^(\+?63|0)9\d{9}$/.test(formData.mobileNumber.replace(/[\s-]/g, ''))) {
        newErrors.mobileNumber = 'Enter a valid Philippine mobile number (e.g. 09171234567).';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Enter a valid email address.';
      } else {
        const dupMessage = checkDuplicate();
        if (dupMessage) newErrors.email = dupMessage;
      }

      if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Current address is required.';
      if (!formData.city.trim()) newErrors.city = 'City / Municipality is required.';
      if (!formData.province.trim()) newErrors.province = 'Province is required.';
    } else if (step === 3) {
      if (!formData.emergencyContactPerson.trim()) {
        newErrors.emergencyContactPerson = 'Emergency contact person is required.';
      }
      if (!formData.emergencyContactNumber.trim()) {
        newErrors.emergencyContactNumber = 'Emergency contact number is required.';
      }
    } else if (step === 4) {
      if (!formData.lastSchoolAttended.trim()) {
        newErrors.lastSchoolAttended = 'Last school attended is required.';
      }
      if (!formData.highestEducationalAttainment) {
        newErrors.highestEducationalAttainment = 'Highest attainment is required.';
      }
    } else if (step === 5) {
      if (!formData.churchName.trim()) newErrors.churchName = 'Church affiliation is required.';
      if (!formData.pastorName.trim()) newErrors.pastorName = 'Pastor/Leader name is required.';
      if (!formData.callingTestimony.trim()) {
        newErrors.callingTestimony = 'Please briefly share your faith testimony and ministry calling.';
      }
    } else if (step === 6) {
      if (!formData.programTitle) newErrors.programTitle = 'Please choose a program.';
      if (!formData.yearLevel) newErrors.yearLevel = 'Please choose your year level.';
    } else if (step === 7) {
      const missingRequired = requirements.filter((r) => r.required && (!r.file || !r.file.url));
      if (missingRequired.length > 0) {
        addToast(
          'warning',
          'Documents Pending',
          `You have ${missingRequired.length} required document(s) not yet uploaded. You can still submit and upload them later in the portal.`
        );
      }
    } else if (step === 8) {
      if (!formData.declarationAgreed) {
        newErrors.declarationAgreed = 'You must confirm the truthfulness of your submission before filing.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep((prev) => Math.min(9, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast('error', 'Validation Notice', 'Please resolve the highlighted fields to proceed.');
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Upload file for Step 7 requirement
  const handleFileUpload = async (reqId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReqId(reqId);
    const studentIdToUse = formData.studentIdNumber || 'temp-applicant';
    const result = await uploadStudentFile(file, studentIdToUse, 'requirements', reqId);

    if (result.success) {
      setRequirements((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'Submitted',
                file: {
                  name: result.fileName,
                  url: result.url,
                  size: result.fileSize,
                  type: result.fileType,
                },
                uploadDate: new Date().toISOString(),
              }
            : r
        )
      );
      addToast('success', 'Document Uploaded', `${result.fileName} attached successfully.`);
    } else {
      addToast('error', 'Upload Failed', result.error || 'Unable to process document.');
    }
    setUploadingReqId(null);
  };

  // Remove uploaded requirement
  const handleRemoveRequirementFile = (reqId: string) => {
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'Pending',
              file: undefined,
              uploadDate: undefined,
            }
          : r
      )
    );
  };

  // Profile Photo Upload (Step 1)
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadStudentFile(file, formData.studentIdNumber, 'profile', 'avatar');
    if (result.success) {
      setFormData((prev) => ({ ...prev, profilePhoto: result.url }));
      addToast('success', 'Profile Photo Set', 'Photo uploaded.');
    } else {
      addToast('error', 'Photo Upload Failed', result.error || 'Failed to upload photo.');
    }
  };

  // Submit Final Registration (Step 8 -> 9)
  const handleFinalSubmit = async () => {
    if (!validateCurrentStep(8)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const permanentStudentId =
        formData.applicantType === 'Returning Student' && formData.existingStudentId.trim()
          ? formData.existingStudentId.trim()
          : formData.studentIdNumber;

      const permanentAppName = formData.applicationNumber;
      const fullName = [formData.firstName.trim(), formData.middleName.trim(), formData.lastName.trim(), formData.suffix.trim()]
        .filter(Boolean)
        .join(' ');

      const newStudentPayload: Omit<StudentProfile, 'id'> = {
        studentId: permanentStudentId,
        applicationNumber: permanentAppName,
        fullName,
        name: fullName,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        suffix: formData.suffix.trim(),
        preferredName: formData.preferredName.trim() || formData.firstName.trim(),
        email: formData.email.trim(),
        portalPassword: 'pcmstudent',
        avatarUrl:
          formData.profilePhoto ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        profilePhoto: formData.profilePhoto,

        // Personal
        dateOfBirth: formData.dateOfBirth,
        birthDate: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        age: parseInt(formData.age, 10) || 20,
        sex: formData.sex,
        gender: formData.sex,
        civilStatus: formData.civilStatus,
        nationality: formData.nationality,
        religion: formData.religion,

        // Contact
        mobileNumber: formData.mobileNumber,
        contactNumber: formData.mobileNumber,
        phone: formData.mobileNumber,
        facebookAccount: formData.facebookAccount,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.sameAsCurrentAddress ? formData.currentAddress : formData.permanentAddress,
        address: formData.currentAddress,
        city: formData.city,
        province: formData.province,
        zipCode: formData.zipCode,

        // Family
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        guardianName: formData.guardianName || formData.fatherName,
        guardianRelationship: formData.guardianRelationship,
        guardianContactNumber: formData.guardianContactNumber || formData.emergencyContactNumber,
        guardianPhone: formData.guardianContactNumber || formData.emergencyContactNumber,
        guardianEmail: formData.guardianEmail,
        guardianAddress: formData.guardianAddress || formData.currentAddress,
        emergencyContactPerson: formData.emergencyContactPerson,
        emergencyContactName: formData.emergencyContactPerson,
        emergencyContactNumber: formData.emergencyContactNumber,
        emergencyContactPhone: formData.emergencyContactNumber,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactRelation: formData.emergencyContactRelationship,
        emergencyContact: {
          name: formData.emergencyContactPerson,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactNumber,
        },

        // Education
        lastSchoolAttended: formData.lastSchoolAttended,
        schoolAddress: formData.schoolAddress,
        highestEducationalAttainment: formData.highestEducationalAttainment,
        previousCourse: formData.previousCourse,
        yearGraduated: formData.yearGraduated,
        graduationDate: formData.graduationDate,
        previousSchoolId: formData.previousSchoolId,
        honorsAwards: formData.honorsAwards,

        // Church & Ministry
        homeChurch: formData.churchName,
        churchName: formData.churchName,
        churchAddress: formData.churchAddress,
        churchContactNumber: formData.churchContactNumber,
        pastorName: formData.pastorName,
        pastorContactNumber: formData.pastorContactNumber,
        pastorPhone: formData.pastorContactNumber,
        ministryDepartment: formData.ministryDepartment,
        ministryRole: formData.ministryRole,
        yearsInMinistry: formData.yearsInMinistry,
        dateStartedInMinistry: formData.dateStartedInMinistry,
        ministryExperience: formData.ministryExperience,
        churchRecommendationStatus: 'Pending',
        pastorRecommendationStatus: 'Pending',
        mentorName: 'Dr. Benjamin Villanueva',
        spiritualMentor: 'Dr. Benjamin Villanueva',

        // Enrollment
        applicantType: formData.applicantType,
        program: formData.programTitle,
        programId: formData.programId,
        degreeProgram: formData.programTitle,
        major: formData.major,
        specialization: formData.major,
        yearLevel: formData.yearLevel,
        section: formData.section,
        academicStatus: 'Regular',
        enrollmentStatus: 'Submitted' as EnrollmentStatus,
        currentSemester: `${formData.semester}, AY ${formData.academicYear}`,
        semester: formData.semester,
        academicYear: formData.academicYear,
        applicationDate: new Date().toISOString().split('T')[0],

        // Requirements & Documents
        requirements,
        uploadedDocuments: requirements
          .filter((r) => r.file && r.file.url)
          .map((r) => ({
            id: `doc-${Date.now()}-${r.id}`,
            documentType: r.name,
            fileName: r.file!.name,
            fileUrl: r.file!.url,
            fileSize: r.file!.size,
            uploadDate: r.uploadDate || new Date().toISOString().split('T')[0],
            verificationStatus: 'Pending Verification',
            status: 'Pending Verification',
          })),

        // Account
        authProvider: 'PCM Enrollment System',
        accountStatus: 'Active',
        verificationStatus: 'Unverified',
        lastLogin: new Date().toISOString(),
        portalAccess: true,

        // Payments
        enrollmentFee: 1500,
        tuitionTotal: 18500,
        tuitionPaid: 0,
        tuitionBalance: 18500,
        paymentStatus: 'Unpaid',
        paymentRecords: [],
        paymentHistory: [],

        // Academic
        gpa: 0,
        totalUnitsEarned: 0,
        courses: [],
        subjectHistory: [],
        practicumEntries: [],

        adminNotes: `Online enrollment application received on ${new Date().toLocaleDateString()}. Program: ${formData.programTitle}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Create persistent student profile in Firestore
      const createdStudent = await createStudentProfile(newStudentPayload);

      // 2. Synchronize with Admissions Application
      const matchedApp =
        linkedApp ||
        applications.find(
          (a) =>
            a.referenceNumber?.trim().toLowerCase() === formData.applicationNumber.trim().toLowerCase() ||
            a.email?.trim().toLowerCase() === formData.email.trim().toLowerCase()
        );

      if (matchedApp) {
        // Update existing application record so it marks applicant as Enrolled
        await updateApplicationStatus(
          matchedApp.id,
          'Enrolled',
          `Officially completed Online Student Registration & Enrollment. Assigned Student ID: ${permanentStudentId}`
        );
        setLinkedApp({
          ...matchedApp,
          status: 'Enrolled',
          studentId: permanentStudentId,
        });
      } else {
        // Record in applications collection for Admissions Committee review & tracking
        await submitApplication({
          referenceNumber: formData.applicationNumber,
          applicationNumber: formData.applicationNumber,
          studentId: permanentStudentId,
          fullName,
          email: formData.email.trim(),
          phone: formData.mobileNumber,
          dob: formData.dateOfBirth,
          gender: formData.sex,
          address: formData.currentAddress,
          program: formData.programTitle,
          programTitle: formData.programTitle,
          church: formData.churchName,
          pastorName: formData.pastorName,
          pastorContact: formData.pastorContactNumber,
          testimony: formData.callingTestimony,
          highSchool: formData.lastSchoolAttended,
          previousCollege: formData.lastSchoolAttended,
        });
      }

      setSubmittedProfile(createdStudent);
      setCurrentStep(9);
      addToast(
        'success',
        'Enrollment & Profile Registered',
        `Student ID ${permanentStudentId} created and connected to Admissions Record.`
      );

      if (onCompleted) {
        onCompleted(createdStudent);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      addToast('error', 'Submission Failed', err?.message || 'Could not record your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAppNo(true);
    addToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedAppNo(false), 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const stepLabels = [
    'Personal',
    'Contact',
    'Family',
    'Education',
    'Church',
    'Program',
    'Documents',
    'Review',
    'Confirmation',
  ];

  return (
    <div id="pcm-registration-wizard" className="w-full max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden my-6">
      {/* Institutional Top Header */}
      <div className="bg-[#18392B] text-white p-6 border-b-4 border-[#588B76] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest bg-[#588B76]/30 text-[#85AA9B] px-2.5 py-0.5 rounded-full font-bold">
                Academic Year {formData.academicYear}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                Online Admission & Enrollment
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Philippine College of Ministry
            </h2>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Official Student Profile & Degree Program Registration
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-white/10 sm:pl-4">
            <div className="text-[11px] text-slate-300 font-mono">Form Identifier</div>
            <div className="font-mono text-sm font-bold text-[#85AA9B]">
              {formData.applicationNumber}
            </div>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
            {stepLabels.map((label, idx) => {
              const stepNumber = idx + 1;
              const isPassed = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;

              return (
                <div
                  key={label}
                  className={`flex flex-col items-center min-w-[68px] sm:min-w-[80px] text-center transition-all ${
                    isCurrent
                      ? 'text-white font-bold'
                      : isPassed
                      ? 'text-[#85AA9B]'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold mb-1 transition-all ${
                      isCurrent
                        ? 'bg-[#588B76] text-white ring-4 ring-[#588B76]/30 scale-110'
                        : isPassed
                        ? 'bg-[#588B76]/40 text-white'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : stepNumber}
                  </div>
                  <span className="text-[10px] leading-tight truncate w-full px-1">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="p-6 sm:p-8 lg:p-10">
        {/* Connected Admissions Banner (Steps 1 to 8) */}
        {currentStep <= 8 && (
          <>
            {linkedApp ? (
              <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50/90 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-100" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded">
                        Connected to Admissions
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-900">
                        Ref: {linkedApp.referenceNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
                        Status: {linkedApp.status}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 mt-1 leading-snug">
                      Form synchronized with <strong>PCM ADMISSIONS & APPLICATION PORTAL</strong> for{' '}
                      <strong>{linkedApp.fullName}</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => navigateTo('apply')}
                    className="text-xs font-bold text-[#18392B] hover:text-[#588B76] underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Admissions Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkedApp(null)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 font-medium cursor-pointer transition shadow-2xs"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-emerald-50/40 to-slate-50 text-slate-800 shadow-xs">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-[#18392B] text-white text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Admissions Bridge
                      </span>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#18392B]">
                        Already applied through the PCM Admissions Portal?
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 max-w-xl">
                      Enter your Admissions Reference (e.g. <strong>PCM-2026-XXXX</strong>) or email to automatically connect and auto-fill your personal, academic, and church data across all 9 enrollment steps.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-60">
                      <input
                        type="text"
                        value={syncQuery}
                        onChange={(e) => setSyncQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSyncApplication();
                          }
                        }}
                        placeholder="PCM-2026-XXXX or email"
                        className="w-full text-xs py-2 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#588B76] focus:ring-1 focus:ring-[#588B76] font-mono"
                      />
                      {syncQuery && (
                        <button
                          type="button"
                          onClick={() => setSyncQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handleSyncApplication}
                      className="bg-[#18392B] hover:bg-[#255843] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      {isSyncing ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5 text-amber-300" />
                      )}
                      <span>Link & Auto-Fill</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* ========================================================================= */}
        {/* STEP 1: PERSONAL INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <User className="w-5 h-5 text-[#18392B]" />
                Section 1: Personal Information
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Provide your full legal name, date of birth, and official demographic background as reflected on your PSA birth certificate.
              </p>
            </div>

            {/* Applicant Type */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Applicant Classification *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['New Student', 'Returning Student', 'Transfer Student'] as const).map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                      formData.applicantType === type
                        ? 'bg-[#18392B] text-white border-[#18392B]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="applicantType"
                      value={type}
                      checked={formData.applicantType === type}
                      onChange={() => setFormData((prev) => ({ ...prev, applicantType: type }))}
                      className="sr-only"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>

              {formData.applicantType === 'Returning Student' && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Existing Permanent PCM Student ID Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-PCM-0418"
                    value={formData.existingStudentId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, existingStudentId: e.target.value }))}
                    className="w-full sm:w-72 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your permanent student ID will be retained and your existing academic ledger will be linked.
                  </p>
                </div>
              )}
            </div>

            {/* Profile Photo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#18392B] bg-slate-200 shrink-0">
                {formData.profilePhoto ? (
                  <Image
                    src={formData.profilePhoto}
                    alt="Profile Photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <User className="w-10 h-10" />
                    <span className="text-[9px] uppercase font-mono mt-1">Photo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <label className="text-xs font-bold text-slate-800">
                  Formal 2×2 / Passport Profile Photo
                </label>
                <p className="text-[11px] text-slate-500">
                  Upload a clear, formal photo with white background. Max size: 10MB (JPG or PNG).
                </p>
                <div>
                  <label className="inline-flex items-center gap-2 bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samuel"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                    errors.firstName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.firstName && <p className="text-[11px] text-rose-600 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. David"
                  value={formData.middleName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramos"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                    errors.lastName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.lastName && <p className="text-[11px] text-rose-600 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Suffix (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jr., III"
                  value={formData.suffix}
                  onChange={(e) => setFormData((prev) => ({ ...prev, suffix: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred / Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sam"
                  value={formData.preferredName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, preferredName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleDobChange}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                    errors.dateOfBirth ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.dateOfBirth && <p className="text-[11px] text-rose-600 mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Place of Birth
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baguio City, Benguet"
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, placeOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Calculated Age
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.age ? `${formData.age} years old` : '—'}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-lg text-slate-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sex / Gender *
                </label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sex: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Civil Status *
                </label>
                <select
                  value={formData.civilStatus}
                  onChange={(e) => setFormData((prev) => ({ ...prev, civilStatus: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] bg-white"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nationality *
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nationality: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Religion / Denomination *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Evangelical / Church of Christ"
                  value={formData.religion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, religion: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CONTACT INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#18392B]" />
                Section 2: Contact Information
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your permanent email and mobile number are essential for official institutional announcements and portal authentication.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="e.g. 09171234567"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                      errors.mobileNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.mobileNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.mobileNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Active Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. applicant@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                      errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facebook Profile Link / Handle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. facebook.com/juan.delacruz"
                  value={formData.facebookAccount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, facebookAccount: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>

            {/* Current Address */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Residential Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street Address / Barangay *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #14 Seminary Hill, Pinsao Pilot Project"
                    value={formData.currentAddress}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currentAddress: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                      errors.currentAddress ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.currentAddress && <p className="text-[11px] text-rose-600 mt-1">{errors.currentAddress}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Municipality *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baguio City"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                      errors.city ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Province *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Benguet"
                    value={formData.province}
                    onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                      errors.province ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.province && <p className="text-[11px] text-rose-600 mt-1">{errors.province}</p>}
                </div>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2600"
                  value={formData.zipCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] font-mono"
                />
              </div>
            </div>

            {/* Permanent Address */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Permanent Provincial Address
                </h4>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sameAsCurrentAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sameAsCurrentAddress: e.target.checked,
                        permanentAddress: e.target.checked ? prev.currentAddress : prev.permanentAddress,
                      }))
                    }
                    className="rounded text-[#18392B] focus:ring-[#588B76]"
                  />
                  <span>Same as current residential address</span>
                </label>
              </div>

              {!formData.sameAsCurrentAddress && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Permanent Address Details
                  </label>
                  <input
                    type="text"
                    placeholder="Enter complete permanent provincial address"
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData((prev) => ({ ...prev, permanentAddress: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: FAMILY & EMERGENCY CONTACT */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#18392B]" />
                Section 3: Family & Emergency Contact Information
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Provide details for parents, guardians, and designated emergency points of contact in case of campus advisories or health situations.
              </p>
            </div>

            {/* Parents Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father&apos;s Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manuel Ramos Sr."
                  value={formData.fatherName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fatherName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mother&apos;s Full Maiden Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Joy David Ramos"
                  value={formData.motherName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, motherName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>

            {/* Guardian Information */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Legal Guardian Details (if living away from parents)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Guardian Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pastor David Ramos"
                    value={formData.guardianName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, guardianName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relationship to Student
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Uncle / Pastor"
                    value={formData.guardianRelationship}
                    onChange={(e) => setFormData((prev) => ({ ...prev, guardianRelationship: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Guardian Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 09191234567"
                    value={formData.guardianContactNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, guardianContactNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Person */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Primary Emergency Contact Person *
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manuel Ramos Sr."
                    value={formData.emergencyContactPerson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContactPerson: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                      errors.emergencyContactPerson ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.emergencyContactPerson && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.emergencyContactPerson}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emergency Contact Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 09179876543"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContactNumber: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                      errors.emergencyContactNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.emergencyContactNumber && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.emergencyContactNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relationship to Student *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Father / Mother"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: EDUCATIONAL BACKGROUND */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#18392B]" />
                Section 4: Prior Educational Background
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                State your highest educational attainment and school records for prerequisite evaluation and credit transfer.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Last School / University Attended *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baguio City National High School"
                  value={formData.lastSchoolAttended}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastSchoolAttended: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                    errors.lastSchoolAttended ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.lastSchoolAttended && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.lastSchoolAttended}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Governor Pack Road, Baguio City"
                  value={formData.schoolAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, schoolAddress: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Highest Educational Attainment *
                </label>
                <select
                  value={formData.highestEducationalAttainment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, highestEducationalAttainment: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] bg-white"
                >
                  <option value="Senior High School Graduate">Senior High School Graduate</option>
                  <option value="College Undergraduate">College Undergraduate</option>
                  <option value="Associate / Vocational Degree">Associate / Vocational Degree</option>
                  <option value="Bachelor&apos;s Degree Holder">Bachelor&apos;s Degree Holder</option>
                  <option value="Master&apos;s Degree Holder">Master&apos;s Degree Holder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Previous Course / SHS Strand
                </label>
                <input
                  type="text"
                  placeholder="e.g. HUMSS, GAS, AB English"
                  value={formData.previousCourse}
                  onChange={(e) => setFormData((prev) => ({ ...prev, previousCourse: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Year Graduated
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025"
                  value={formData.yearGraduated}
                  onChange={(e) => setFormData((prev) => ({ ...prev, yearGraduated: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Learner Reference Number (LRN) / Student ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102938475612"
                  value={formData.previousSchoolId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, previousSchoolId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Honors & Special Awards (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. With High Honors, Leadership Awardee, Valedictorian"
                value={formData.honorsAwards}
                onChange={(e) => setFormData((prev) => ({ ...prev, honorsAwards: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: CHURCH & MINISTRY INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <Church className="w-5 h-5 text-[#18392B]" />
                Section 5: Church Affiliation & Ministry Calling
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                As an accredited ministry institution, PCM partners with local churches to mentor gospel leaders.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Home Church Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baguio Church of Christ"
                  value={formData.churchName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, churchName: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                    errors.churchName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.churchName && <p className="text-[11px] text-rose-600 mt-1">{errors.churchName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Church Complete Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bokawkan Road, Baguio City"
                  value={formData.churchAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, churchAddress: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pastor / Church Overseer Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rev. Ruben Alcantara"
                  value={formData.pastorName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pastorName: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                    errors.pastorName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.pastorName && <p className="text-[11px] text-rose-600 mt-1">{errors.pastorName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pastor&apos;s Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 09181234567"
                  value={formData.pastorContactNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pastorContactNumber: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Years Active in Ministry
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 years"
                  value={formData.yearsInMinistry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, yearsInMinistry: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ministry Department / Areas of Service
                </label>
                <input
                  type="text"
                  placeholder="e.g. Worship, Children's Ministry, Youth Outreach, Preaching"
                  value={formData.ministryDepartment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ministryDepartment: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Ministry Position / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assistant Youth Leader, Sunday School Teacher"
                  value={formData.ministryRole}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ministryRole: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Spiritual Testimony & Ministry Calling Statement *
              </label>
              <textarea
                rows={4}
                placeholder="Share how you came to personal faith in Christ Jesus, and what motivates you to pursue theological training at Philippine College of Ministry..."
                value={formData.callingTestimony}
                onChange={(e) => setFormData((prev) => ({ ...prev, callingTestimony: e.target.value }))}
                className={`w-full p-3 text-xs border rounded-lg focus:outline-none focus:border-[#588B76] ${
                  errors.callingTestimony ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                }`}
              />
              {errors.callingTestimony && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.callingTestimony}</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: PCM PROGRAM & ENROLLMENT INFORMATION */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <Award className="w-5 h-5 text-[#18392B]" />
                Section 6: Degree Program & Academic Enlistment
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select your intended degree track and academic enrollment standing for Academic Year 2026–2027.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.academicYear}
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-lg font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Semester / Term
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData((prev) => ({ ...prev, semester: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] bg-white"
                >
                  <option value="1st Semester">1st Semester (August – December)</option>
                  <option value="2nd Semester">2nd Semester (January – May)</option>
                  <option value="Summer Term">Summer Intensive Term (June – July)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Desired Degree Program *
              </label>
              <div className="space-y-2.5">
                {programs.map((prog) => {
                  const isSelected = formData.programId === prog.id || formData.programTitle === prog.name;
                  return (
                    <div
                      key={prog.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          programId: prog.id,
                          programTitle: prog.name,
                        }))
                      }
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'border-[#18392B] bg-[#18392B]/5 ring-2 ring-[#18392B]/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-slate-900">
                            {prog.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold bg-[#588B76]/20 text-[#18392B]">
                            {prog.level || 'Degree'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {prog.description || 'Professional biblical and theological training for ministers.'}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-[#18392B] bg-[#18392B]' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Major / Specialization
                </label>
                <select
                  value={formData.major}
                  onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] bg-white"
                >
                  <option value="General Pastoral Studies">General Pastoral Studies</option>
                  <option value="Christian Education">Christian Education & Family</option>
                  <option value="Intercultural & Missiology">Intercultural Studies & Missions</option>
                  <option value="Youth & Campus Ministry">Youth & Campus Ministry</option>
                  <option value="Institutional Chaplaincy">Institutional Chaplaincy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enrolling Year Level *
                </label>
                <select
                  value={formData.yearLevel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, yearLevel: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] bg-white"
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Section
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#588B76] bg-white"
                >
                  <option value="Section A">Section A (Day Cohort)</option>
                  <option value="Section B">Section B (Day Cohort)</option>
                  <option value="Evening / Modular">Evening & Modular Intensive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: UPLOAD REQUIREMENTS */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#18392B]" />
                Section 7: Required Document Uploads
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your digital credentials below. Permitted formats: PDF, DOC, DOCX, JPG, PNG (up to 10MB per file). Any pending documents can be submitted later via the Student Document Vault.
              </p>
            </div>

            <div className="space-y-3">
              {requirements.map((req) => {
                const isUploaded = !!req.file && !!req.file.url;
                const isUploading = uploadingReqId === req.id;

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isUploaded
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{req.name}</span>
                        {req.required ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            Optional
                          </span>
                        )}
                        {isUploaded && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Attached
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{req.description}</p>

                      {isUploaded && req.file && (
                        <div className="mt-2 text-[11px] font-mono text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded inline-flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate max-w-xs">{req.file.name}</span>
                          <span className="text-[10px] text-emerald-600">({req.file.size})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUploaded ? (
                        <>
                          <a
                            href={req.file?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirementFile(req.id)}
                            className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                            title="Remove Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isUploading
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                              : 'bg-[#18392B] hover:bg-[#588B76] text-white'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            disabled={isUploading}
                            onChange={(e) => handleFileUpload(req.id, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: REVIEW APPLICATION */}
        {/* ========================================================================= */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#18392B]" />
                Section 8: Comprehensive Application Review
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Carefully review all submitted information before final submission. Click &quot;Edit&quot; on any section to make corrections.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
              {/* Card 1: Personal & Demographic */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Personal Information
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] font-bold text-[#588B76] hover:underline cursor-pointer"
                  >
                    Edit Step 1
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Full Name:</span>
                    <strong className="text-slate-800">
                      {[formData.firstName, formData.middleName, formData.lastName, formData.suffix].filter(Boolean).join(' ')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date of Birth:</span>
                    <strong className="text-slate-800">{formData.dateOfBirth} ({formData.age} yo)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sex & Civil Status:</span>
                    <strong className="text-slate-800">{formData.sex} • {formData.civilStatus}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Applicant Type:</span>
                    <strong className="text-slate-800">{formData.applicantType}</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Contact */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Contact & Address
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] font-bold text-[#588B76] hover:underline cursor-pointer"
                  >
                    Edit Step 2
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address:</span>
                    <strong className="text-slate-800">{formData.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile Number:</span>
                    <strong className="text-slate-800">{formData.mobileNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Location:</span>
                    <strong className="text-slate-800">
                      {formData.currentAddress}, {formData.city}, {formData.province}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Church & Ministry */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Church Affiliation & Program
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-[11px] font-bold text-[#588B76] hover:underline cursor-pointer"
                  >
                    Edit Step 5 & 6
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Home Church:</span>
                    <strong className="text-slate-800">{formData.churchName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pastor / Overseer:</span>
                    <strong className="text-slate-800">{formData.pastorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Enrolling Degree:</span>
                    <strong className="text-slate-800">{formData.programTitle} ({formData.yearLevel})</strong>
                  </div>
                </div>
              </div>

              {/* Card 4: Documents Uploaded */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Attached Requirement Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(7)}
                    className="text-[11px] font-bold text-[#588B76] hover:underline cursor-pointer"
                  >
                    Edit Step 7
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {requirements.map((r) => (
                    <span
                      key={r.id}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 ${
                        r.file?.url
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.required
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {r.file?.url ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-rose-500" />}
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="bg-[#18392B]/5 p-4 rounded-xl border border-[#18392B]/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.declarationAgreed}
                  onChange={(e) => setFormData((prev) => ({ ...prev, declarationAgreed: e.target.checked }))}
                  className="mt-0.5 rounded text-[#18392B] focus:ring-[#588B76] w-4 h-4"
                />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">
                    Affirmation of Truthfulness & Christian Conduct Commitment
                  </strong>
                  I hereby certify that all information submitted in this application is true, correct, and complete. I understand that any false statement or omission may result in denial of admission or cancellation of enrollment. I willingly agree to abide by the spiritual and academic tenets of the Philippine College of Ministry.
                </div>
              </label>
              {errors.declarationAgreed && (
                <p className="text-[11px] text-rose-600 font-bold mt-2 ml-7">{errors.declarationAgreed}</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 9: OFFICIAL SUBMISSION CONFIRMATION */}
        {/* ========================================================================= */}
        {currentStep === 9 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#588B76]">
                Application Successfully Received
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
                Welcome to Philippine College of Ministry
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                Your admission and enrollment record has been securely submitted to the Registrar and Cloud Firestore database.
              </p>
            </div>

            {/* Official Credentials Box */}
            <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 text-left shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    Official Application Number
                  </span>
                  <span className="text-lg font-mono font-bold text-[#18392B]">
                    {formData.applicationNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(formData.applicationNumber)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  title="Copy Application Number"
                >
                  {copiedAppNo ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Student ID:</span>
                  <strong className="font-mono text-slate-900">{formData.studentIdNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900">{formData.firstName} {formData.lastName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrolling Program:</span>
                  <strong className="text-slate-900">{formData.programTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enlistment Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Under Review / For Verification
                  </span>
                </div>
                {linkedApp && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Admissions Ref:
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {linkedApp.referenceNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Application Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('apply')}
                className="bg-[#588B76] hover:bg-[#436e5d] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Track in Admissions Portal</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('portal')}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4" />
                <span>Student Portal Hub</span>
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Footer (Steps 1 to 8) */}
        {currentStep < 9 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>
              ) : onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Step {currentStep} of 8
              </span>

              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className={`bg-[#18392B] hover:bg-[#588B76] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Recording to Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>Submit Official Application</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
