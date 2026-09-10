import { type FormEvent, useMemo, useState } from 'react';
import './index.css';

type Role = 'manager' | 'employee';
type EmploymentStatus =
  | 'Active'
  | 'Inactive'
  | 'On Leave'
  | 'Terminated';

type CertificateApproval =
  | 'Pending'
  | 'Approved'
  | 'Rejected';

type TrainingStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Submitted'
  | 'Completed';

type Company = {
  id: string;
  name: string;
  managementId: string;
};

type Location = {
  id: string;
  companyId: string;
  name: string;
  address: string;
  managerName: string;
  phone: string;
  status: 'Active' | 'Inactive';
};

type User = {
  id: string;
  companyId: string;
  role: Role;
  name: string;
  username: string;
  password: string;

  phone?: string;
  email?: string;
  address?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;

  jobTitle?: string;
  hireDate?: string;

  locationId?: string;

  employmentStatus?: EmploymentStatus;

  supervisor?: string;

  notes?: string;
};

type Requirement = {
  id: string;
  companyId: string;
  name: string;
  category: string;
};

type CertificateSubmission = {
  id: string;

  companyId: string;
  employeeId: string;

  requirementId: string;

  certificateName: string;
  category: string;

  issueDate: string;
  expirationDate: string;

  fileKey: string;
  fileName: string;

  status: CertificateApproval;

  rejectionReason?: string;

  submittedAt: string;
};

type CertificateHistory = {
  id: string;

  companyId: string;
  certificateId: string;
  employeeId: string;

  action:
    | 'Submitted'
    | 'Approved'
    | 'Rejected'
    | 'Resubmitted'
    | 'Renewed';

  note?: string;

  at: string;
};

type TrainingAssignment = {
  id: string;

  companyId: string;
  employeeId: string;

  name: string;
  description: string;

  dueDate: string;

  status: TrainingStatus;

  assignedAt: string;
};

type OnboardingItem = {
  id: string;
  companyId: string;
  title: string;
};

type OnboardingProgress = {
  id: string;

  companyId: string;
  employeeId: string;

  itemId: string;

  completed: boolean;
};

type ManagerPage =
  | 'dashboard'
  | 'employees'
  | 'certificates'
  | 'reviews'
  | 'requirements'
  | 'training'
  | 'onboarding'
  | 'locations'
  | 'reports';

type EmployeePage =
  | 'dashboard'
  | 'submit'
  | 'training'
  | 'profile';

type RequirementState =
  | 'Approved'
  | 'Pending'
  | 'Missing'
  | 'Expiring Soon'
  | 'Expired'
  | 'Rejected';

type NotificationItem = {
  id: string;

  text: string;

  tone:
    | 'info'
    | 'warning'
    | 'danger'
    | 'success';
};

/* =========================================================
   DEMO COMPANY
========================================================= */

const demoCompany: Company = {
  id: 'CC-DEMO1',

  name:
    'Everwell Living LLC',

  managementId:
    'MGT-DEMO1',
};

const demoManager: User = {
  id: 'demo-manager',

  companyId:
    'CC-DEMO1',

  role:
    'manager',

  name:
    'Demo Manager',

  username:
    'manager',

  password:
    'Manager123!',

  employmentStatus:
    'Active',
};

/* =========================================================
   STARTER CERTIFICATE REQUIREMENTS
========================================================= */

const starterRequirements:
  Requirement[] = [
  {
    id: 'req-cpr',

    companyId:
      'CC-DEMO1',

    name:
      'CPR / AED',

    category:
      'Safety & Emergency',
  },

  {
    id:
      'req-first-aid',

    companyId:
      'CC-DEMO1',

    name:
      'First Aid',

    category:
      'Safety & Emergency',
  },

  {
    id:
      'req-article9',

    companyId:
      'CC-DEMO1',

    name:
      'Article 9',

    category:
      'DDD & Behavioral',
  },

  {
    id:
      'req-prevention',

    companyId:
      'CC-DEMO1',

    name:
      'Prevention & Support',

    category:
      'DDD & Behavioral',
  },

  {
    id:
      'req-fingerprint',

    companyId:
      'CC-DEMO1',

    name:
      'Fingerprint Clearance Card',

    category:
      'Background & Compliance',
  },

  {
    id:
      'req-medication',

    companyId:
      'CC-DEMO1',

    name:
      'Medication Administration',

    category:
      'Medical',
  },

  {
    id:
      'req-hipaa',

    companyId:
      'CC-DEMO1',

    name:
      'HIPAA Training',

    category:
      'Compliance',
  },

  {
    id:
      'req-direct-care',

    companyId:
      'CC-DEMO1',

    name:
      'Direct Care Worker Training',

    category:
      'Staff Training',
  },
];

/* =========================================================
   STARTER ONBOARDING TASKS
========================================================= */

const starterOnboarding:
  OnboardingItem[] = [
  {
    id:
      'on-name',

    companyId:
      'CC-DEMO1',

    title:
      'Personal information completed',
  },

  {
    id:
      'on-emergency',

    companyId:
      'CC-DEMO1',

    title:
      'Emergency contact completed',
  },

  {
    id:
      'on-handbook',

    companyId:
      'CC-DEMO1',

    title:
      'Employee handbook acknowledged',
  },

  {
    id:
      'on-orientation',

    companyId:
      'CC-DEMO1',

    title:
      'Orientation completed',
  },
];

/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadData<T>(
  key: string,
  fallback: T
): T {
  const saved =
    localStorage.getItem(
      key
    );

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(
      saved
    ) as T;
  } catch {
    return fallback;
  }
}

function saveData(
  key: string,
  value: unknown
) {
  localStorage.setItem(
    key,
    JSON.stringify(
      value
    )
  );
}

/* =========================================================
   LARGE FILE STORAGE
========================================================= */

const DATABASE_NAME =
  'CertCueFileDatabase';

const FILE_STORE =
  'certificateFiles';

function openFileDatabase():
  Promise<IDBDatabase> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const request =
        indexedDB.open(
          DATABASE_NAME,
          1
        );

      request.onupgradeneeded =
        () => {
          const db =
            request.result;

          if (
            !db.objectStoreNames.contains(
              FILE_STORE
            )
          ) {
            db.createObjectStore(
              FILE_STORE
            );
          }
        };

      request.onsuccess =
        () =>
          resolve(
            request.result
          );

      request.onerror =
        () =>
          reject(
            request.error
          );
    }
  );
}

async function saveCertificateFile(
  key: string,
  file: File
) {
  const db =
    await openFileDatabase();

  return new Promise<void>(
    (
      resolve,
      reject
    ) => {
      const transaction =
        db.transaction(
          FILE_STORE,
          'readwrite'
        );

      transaction
        .objectStore(
          FILE_STORE
        )
        .put(
          file,
          key
        );

      transaction.oncomplete =
        () => resolve();

      transaction.onerror =
        () =>
          reject(
            transaction.error
          );
    }
  );
}

async function getCertificateFile(
  key: string
): Promise<Blob | null> {
  const db =
    await openFileDatabase();

  return new Promise(
    (
      resolve,
      reject
    ) => {
      const transaction =
        db.transaction(
          FILE_STORE,
          'readonly'
        );

      const request =
        transaction
          .objectStore(
            FILE_STORE
          )
          .get(key);

      request.onsuccess =
        () =>
          resolve(
            request.result ||
              null
          );

      request.onerror =
        () =>
          reject(
            request.error
          );
    }
  );
}

/* =========================================================
   HELPERS
========================================================= */

function makeCode(
  prefix: string
) {
  return `${prefix}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
}

function daysRemaining(
  expirationDate: string
) {
  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const expiration =
    new Date(
      `${expirationDate}T00:00:00`
    );

  return Math.ceil(
    (
      expiration.getTime() -
      today.getTime()
    ) /
      86400000
  );
}

function expirationStatus(
  expirationDate: string
) {
  const days =
    daysRemaining(
      expirationDate
    );

  if (days < 0) {
    return {
      label:
        'Expired',

      className:
        'expiry expired',
    };
  }

  if (days <= 7) {
    return {
      label:
        `${days} days - URGENT`,

      className:
        'expiry urgent',
    };
  }

  if (days <= 30) {
    return {
      label:
        `${days} days`,

      className:
        'expiry warning',
    };
  }

  if (days <= 60) {
    return {
      label:
        `${days} days`,

      className:
        'expiry upcoming',
    };
  }

  return {
    label:
      `${days} days`,

    className:
      'expiry current',
  };
}

function latestCertificateFor(
  employeeId: string,
  requirementId: string,
  certificates:
    CertificateSubmission[]
) {
  return [
    ...certificates,
  ]
    .filter(
      (certificate) =>
        certificate.employeeId ===
          employeeId &&
        certificate.requirementId ===
          requirementId
    )
    .sort(
      (a, b) =>
        b.submittedAt.localeCompare(
          a.submittedAt
        )
    )[0];
}

function requirementState(
  employeeId: string,
  requirementId: string,
  certificates:
    CertificateSubmission[]
): RequirementState {
  const certificate =
    latestCertificateFor(
      employeeId,
      requirementId,
      certificates
    );

  if (!certificate) {
    return 'Missing';
  }

  if (
    certificate.status ===
    'Pending'
  ) {
    return 'Pending';
  }

  if (
    certificate.status ===
    'Rejected'
  ) {
    return 'Rejected';
  }

  const days =
    daysRemaining(
      certificate.expirationDate
    );

  if (days < 0) {
    return 'Expired';
  }

  if (days <= 60) {
    return 'Expiring Soon';
  }

  return 'Approved';
}

function complianceForEmployee(
  employeeId: string,
  requirements:
    Requirement[],
  certificates:
    CertificateSubmission[]
) {
  if (
    requirements.length ===
    0
  ) {
    return 100;
  }

  const current =
    requirements.filter(
      (requirement) => {
        const certificate =
          latestCertificateFor(
            employeeId,
            requirement.id,
            certificates
          );

        return (
          certificate?.status ===
            'Approved' &&
          daysRemaining(
            certificate.expirationDate
          ) >= 0
        );
      }
    ).length;

  return Math.round(
    (
      current /
      requirements.length
    ) *
      100
  );
}

function displayTrainingStatus(
  training:
    TrainingAssignment
) {
  if (
    training.status !==
      'Completed' &&
    daysRemaining(
      training.dueDate
    ) < 0
  ) {
    return 'Overdue';
  }

  return training.status;
}

function notificationBucket(
  days: number
) {
  if (days < 0) {
    return 'expired';
  }

  if (days <= 1) {
    return '1 day';
  }

  if (days <= 7) {
    return '7 days';
  }

  if (days <= 14) {
    return '14 days';
  }

  if (days <= 30) {
    return '30 days';
  }

  if (days <= 60) {
    return '60 days';
  }

  return null;
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [
    companies,
    setCompanies,
  ] =
    useState<
      Company[]
    >(() =>
      loadData(
        'certcue-companies-v10',
        [demoCompany]
      )
    );

  const [
    users,
    setUsers,
  ] =
    useState<
      User[]
    >(() =>
      loadData(
        'certcue-users-v10',
        [demoManager]
      )
    );

  const [
    requirements,
    setRequirements,
  ] =
    useState<
      Requirement[]
    >(() =>
      loadData(
        'certcue-requirements-v10',
        starterRequirements
      )
    );

  const [
    certificates,
    setCertificates,
  ] =
    useState<
      CertificateSubmission[]
    >(() =>
      loadData(
        'certcue-certificates-v10',
        []
      )
    );

  const [
    locations,
    setLocations,
  ] =
    useState<
      Location[]
    >(() =>
      loadData(
        'certcue-locations-v11',
        []
      )
    );

  const [
    history,
    setHistory,
  ] =
    useState<
      CertificateHistory[]
    >(() =>
      loadData(
        'certcue-history-v11',
        []
      )
    );

  const [
    trainings,
    setTrainings,
  ] =
    useState<
      TrainingAssignment[]
    >(() =>
      loadData(
        'certcue-training-v11',
        []
      )
    );

  const [
    onboardingItems,
    setOnboardingItems,
  ] =
    useState<
      OnboardingItem[]
    >(() =>
      loadData(
        'certcue-onboarding-items-v11',
        starterOnboarding
      )
    );

  const [
    onboardingProgress,
    setOnboardingProgress,
  ] =
    useState<
      OnboardingProgress[]
    >(() =>
      loadData(
        'certcue-onboarding-progress-v11',
        []
      )
    );

  const [
    sessionId,
    setSessionId,
  ] =
    useState<
      string | null
    >(() =>
      localStorage.getItem(
        'certcue-session-v10'
      )
    );

  const [
    authPage,
    setAuthPage,
  ] = useState<
    | 'login'
    | 'employee-register'
    | 'manager-register'
  >('login');

  const currentUser =
    users.find(
      (user) =>
        user.id ===
        sessionId
    ) || null;

  function updateCompanies(
    next: Company[]
  ) {
    setCompanies(next);

    saveData(
      'certcue-companies-v10',
      next
    );
  }

  function updateUsers(
    next: User[]
  ) {
    setUsers(next);

    saveData(
      'certcue-users-v10',
      next
    );
  }

  function updateRequirements(
    next:
      Requirement[]
  ) {
    setRequirements(next);

    saveData(
      'certcue-requirements-v10',
      next
    );
  }

  function updateCertificates(
    next:
      CertificateSubmission[]
  ) {
    setCertificates(next);

    saveData(
      'certcue-certificates-v10',
      next
    );
  }

  function updateLocations(
    next: Location[]
  ) {
    setLocations(next);

    saveData(
      'certcue-locations-v11',
      next
    );
  }

  function updateHistory(
    next:
      CertificateHistory[]
  ) {
    setHistory(next);

    saveData(
      'certcue-history-v11',
      next
    );
  }

  function updateTrainings(
    next:
      TrainingAssignment[]
  ) {
    setTrainings(next);

    saveData(
      'certcue-training-v11',
      next
    );
  }

  function updateOnboardingItems(
    next:
      OnboardingItem[]
  ) {
    setOnboardingItems(
      next
    );

    saveData(
      'certcue-onboarding-items-v11',
      next
    );
  }

  function updateOnboardingProgress(
    next:
      OnboardingProgress[]
  ) {
    setOnboardingProgress(
      next
    );

    saveData(
      'certcue-onboarding-progress-v11',
      next
    );
  }

  function login(
    userId: string
  ) {
    setSessionId(
      userId
    );

    localStorage.setItem(
      'certcue-session-v10',
      userId
    );
  }

  function logout() {
    setSessionId(
      null
    );

    localStorage.removeItem(
      'certcue-session-v10'
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        page={
          authPage
        }
        setPage={
          setAuthPage
        }
        companies={
          companies
        }
        users={
          users
        }
        requirements={
          requirements
        }
        updateCompanies={
          updateCompanies
        }
        updateUsers={
          updateUsers
        }
        updateRequirements={
          updateRequirements
        }
        login={
          login
        }
      />
    );
  }

  if (
    currentUser.role ===
    'manager'
  ) {
    return (
      <ManagerApp
        manager={
          currentUser
        }
        companies={
          companies
        }
        users={
          users
        }
        requirements={
          requirements
        }
        certificates={
          certificates
        }
        locations={
          locations
        }
        history={
          history
        }
        trainings={
          trainings
        }
        onboardingItems={
          onboardingItems
        }
        onboardingProgress={
          onboardingProgress
        }
        updateUsers={
          updateUsers
        }
        updateRequirements={
          updateRequirements
        }
        updateCertificates={
          updateCertificates
        }
        updateLocations={
          updateLocations
        }
        updateHistory={
          updateHistory
        }
        updateTrainings={
          updateTrainings
        }
        updateOnboardingItems={
          updateOnboardingItems
        }
        logout={
          logout
        }
      />
    );
  }

  return (
    <EmployeeApp
      employee={
        currentUser
      }
      companies={
        companies
      }
      users={
        users
      }
      requirements={
        requirements
      }
      certificates={
        certificates
      }
      locations={
        locations
      }
      history={
        history
      }
      trainings={
        trainings
      }
      onboardingItems={
        onboardingItems
      }
      onboardingProgress={
        onboardingProgress
      }
      updateUsers={
        updateUsers
      }
      updateCertificates={
        updateCertificates
      }
      updateHistory={
        updateHistory
      }
      updateTrainings={
        updateTrainings
      }
      updateOnboardingProgress={
        updateOnboardingProgress
      }
      logout={
        logout
      }
    />
  );
}

/* =========================================================
   AUTH
========================================================= */

function AuthScreen({
  page,
  setPage,
  companies,
  users,
  requirements,
  updateCompanies,
  updateUsers,
  updateRequirements,
  login,
}: {
  page:
    | 'login'
    | 'employee-register'
    | 'manager-register';

  setPage: (
    page:
      | 'login'
      | 'employee-register'
      | 'manager-register'
  ) => void;

  companies:
    Company[];

  users:
    User[];

  requirements:
    Requirement[];

  updateCompanies: (
    next: Company[]
  ) => void;

  updateUsers: (
    next: User[]
  ) => void;

  updateRequirements: (
    next:
      Requirement[]
  ) => void;

  login: (
    userId: string
  ) => void;
}) {
  const [
    loginRole,
    setLoginRole,
  ] =
    useState<Role>(
      'employee'
    );

  const [
    companySearch,
    setCompanySearch,
  ] =
    useState('');

  const foundCompany =
    companies.find(
      (company) =>
        company.id.toUpperCase() ===
        companySearch
          .trim()
          .toUpperCase()
    );

  function handleLogin(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const companyId =
      String(
        form.get(
          'companyId'
        ) || ''
      )
        .trim()
        .toUpperCase();

    const username =
      String(
        form.get(
          'username'
        ) || ''
      ).trim();

    const password =
      String(
        form.get(
          'password'
        ) || ''
      );

    const managementId =
      String(
        form.get(
          'managementId'
        ) || ''
      )
        .trim()
        .toUpperCase();

    const company =
      companies.find(
        (item) =>
          item.id ===
          companyId
      );

    if (!company) {
      alert(
        'Company ID not found.'
      );

      return;
    }

    if (
      loginRole ===
        'manager' &&
      company.managementId !==
        managementId
    ) {
      alert(
        'Management ID is incorrect.'
      );

      return;
    }

    const account =
      users.find(
        (user) =>
          user.companyId ===
            companyId &&
          user.role ===
            loginRole &&
          user.username
            .toLowerCase() ===
            username.toLowerCase() &&
          user.password ===
            password
      );

    if (!account) {
      alert(
        'Username or password is incorrect.'
      );

      return;
    }

    login(
      account.id
    );
  }

  function registerEmployee(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!foundCompany) {
      alert(
        'Enter a valid Company ID.'
      );

      return;
    }

    const form =
      new FormData(
        event.currentTarget
      );

    const username =
      String(
        form.get(
          'username'
        ) || ''
      ).trim();

    const exists =
      users.some(
        (user) =>
          user.companyId ===
            foundCompany.id &&
          user.username
            .toLowerCase() ===
            username.toLowerCase()
      );

    if (exists) {
      alert(
        'That username already exists.'
      );

      return;
    }

    const employee:
      User = {
      id:
        crypto.randomUUID(),

      companyId:
        foundCompany.id,

      role:
        'employee',

      name:
        String(
          form.get(
            'name'
          ) || ''
        ),

      jobTitle:
        String(
          form.get(
            'jobTitle'
          ) || ''
        ),

      email:
        String(
          form.get(
            'email'
          ) || ''
        ),

      phone:
        String(
          form.get(
            'phone'
          ) || ''
        ),

      username,

      password:
        String(
          form.get(
            'password'
          ) || ''
        ),

      employmentStatus:
        'Active',
    };

    updateUsers([
      ...users,
      employee,
    ]);

    login(
      employee.id
    );
  }

  function registerManager(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const companyId =
      makeCode(
        'CC'
      );

    const managementId =
      makeCode(
        'MGT'
      );

    const company:
      Company = {
      id:
        companyId,

      managementId,

      name:
        String(
          form.get(
            'companyName'
          ) || ''
        ),
    };

    const manager:
      User = {
      id:
        crypto.randomUUID(),

      companyId,

      role:
        'manager',

      name:
        String(
          form.get(
            'name'
          ) || ''
        ),

      username:
        String(
          form.get(
            'username'
          ) || ''
        ),

      password:
        String(
          form.get(
            'password'
          ) || ''
        ),

      employmentStatus:
        'Active',
    };

    const newRequirements =
      starterRequirements.map(
        (
          requirement
        ) => ({
          ...requirement,

          id:
            crypto.randomUUID(),

          companyId,
        })
      );

    updateCompanies([
      ...companies,
      company,
    ]);

    updateUsers([
      ...users,
      manager,
    ]);

    updateRequirements([
      ...requirements,
      ...newRequirements,
    ]);

    alert(
      `Company created!

Company ID:
${companyId}

Management ID:
${managementId}

Save both IDs.`
    );

    login(
      manager.id
    );
  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        <Brand />

        {page ===
          'login' && (
          <>

            <div className="auth-heading">

              <h1>
                Welcome to CertCue
              </h1>

              <p>
                Sign into your account.
              </p>

            </div>

            <div className="role-selector">

              <button
                type="button"
                className={
                  loginRole ===
                  'employee'
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  setLoginRole(
                    'employee'
                  )
                }
              >
                Employee
              </button>

              <button
                type="button"
                className={
                  loginRole ===
                  'manager'
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  setLoginRole(
                    'manager'
                  )
                }
              >
                Management
              </button>

            </div>

            <form
              className="auth-form"
              onSubmit={
                handleLogin
              }
            >

              <label>
                Company ID

                <input
                  name="companyId"
                  placeholder="CC-XXXXXX"
                  required
                />
              </label>

              {loginRole ===
                'manager' && (
                <label>
                  Management ID

                  <input
                    name="managementId"
                    placeholder="MGT-XXXXXX"
                    required
                  />
                </label>
              )}

              <label>
                Username

                <input
                  name="username"
                  required
                />
              </label>

              <label>
                Password

                <input
                  type="password"
                  name="password"
                  required
                />
              </label>

              <button
                className="main-button"
                type="submit"
              >
                Sign In
              </button>

            </form>

            <div className="auth-links">

              <button
                onClick={() =>
                  setPage(
                    'employee-register'
                  )
                }
              >
                Employee Registration
              </button>

              <button
                onClick={() =>
                  setPage(
                    'manager-register'
                  )
                }
              >
                Create Company
              </button>

            </div>

          </>
        )}

        {page ===
          'employee-register' && (
          <>

            <div className="auth-heading">

              <h1>
                Employee Registration
              </h1>

              <p>
                Enter the Company ID provided by your employer.
              </p>

            </div>

            <form
              className="auth-form"
              onSubmit={
                registerEmployee
              }
            >

              <label>
                Company ID

                <input
                  value={
                    companySearch
                  }
                  onChange={(
                    event
                  ) =>
                    setCompanySearch(
                      event.target.value
                    )
                  }
                  placeholder="CC-XXXXXX"
                  required
                />
              </label>

              {companySearch && (
                <div
                  className={
                    foundCompany
                      ? 'company-found'
                      : 'company-not-found'
                  }
                >
                  {foundCompany
                    ? `✓ ${foundCompany.name}`
                    : 'Company not found'}
                </div>
              )}

              <label>
                Full Name

                <input
                  name="name"
                  required
                />
              </label>

              <label>
                Job Title

                <input
                  name="jobTitle"
                  required
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  name="email"
                />
              </label>

              <label>
                Phone

                <input
                  name="phone"
                />
              </label>

              <label>
                Username

                <input
                  name="username"
                  required
                />
              </label>

              <label>
                Password

                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required
                />
              </label>

              <button
                className="main-button"
              >
                Create Account
              </button>

            </form>

            <button
              className="back-button"
              onClick={() =>
                setPage(
                  'login'
                )
              }
            >
              ← Back to Login
            </button>

          </>
        )}

        {page ===
          'manager-register' && (
          <>

            <div className="auth-heading">

              <h1>
                Create Company
              </h1>

              <p>
                Create a management account for your company.
              </p>

            </div>

            <form
              className="auth-form"
              onSubmit={
                registerManager
              }
            >

              <label>
                Company Name

                <input
                  name="companyName"
                  required
                />
              </label>

              <label>
                Manager Name

                <input
                  name="name"
                  required
                />
              </label>

              <label>
                Username

                <input
                  name="username"
                  required
                />
              </label>

              <label>
                Password

                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required
                />
              </label>

              <button
                className="main-button"
              >
                Create Company
              </button>

            </form>

            <button
              className="back-button"
              onClick={() =>
                setPage(
                  'login'
                )
              }
            >
              ← Back to Login
            </button>

          </>
        )}

      </div>

    </div>
  );
}
/* =========================================================
   MANAGEMENT APP
========================================================= */

function ManagerApp({
  manager,
  companies,
  users,
  requirements,
  certificates,
  locations,
  history,
  trainings,
  onboardingItems,
  onboardingProgress,
  updateUsers,
  updateRequirements,
  updateCertificates,
  updateLocations,
  updateHistory,
  updateTrainings,
  updateOnboardingItems,
  logout,
}: {
  manager: User;

  companies:
    Company[];

  users:
    User[];

  requirements:
    Requirement[];

  certificates:
    CertificateSubmission[];

  locations:
    Location[];

  history:
    CertificateHistory[];

  trainings:
    TrainingAssignment[];

  onboardingItems:
    OnboardingItem[];

  onboardingProgress:
    OnboardingProgress[];

  updateUsers: (
    next: User[]
  ) => void;

  updateRequirements: (
    next:
      Requirement[]
  ) => void;

  updateCertificates: (
    next:
      CertificateSubmission[]
  ) => void;

  updateLocations: (
    next:
      Location[]
  ) => void;

  updateHistory: (
    next:
      CertificateHistory[]
  ) => void;

  updateTrainings: (
    next:
      TrainingAssignment[]
  ) => void;

  updateOnboardingItems: (
    next:
      OnboardingItem[]
  ) => void;

  logout:
    () => void;
}) {
  const [
    page,
    setPage,
  ] =
    useState<ManagerPage>(
      'dashboard'
    );

  const [
    certificateSearch,
    setCertificateSearch,
  ] =
    useState('');

  const [
    employeeSearch,
    setEmployeeSearch,
  ] =
    useState('');

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] =
    useState<
      string | null
    >(null);

  const [
    locationFilter,
    setLocationFilter,
  ] =
    useState('All');

  const [
    reportSearch,
    setReportSearch,
  ] =
    useState('');

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(false);

  const company =
    companies.find(
      (company) =>
        company.id ===
        manager.companyId
    )!;

  const employees =
    users.filter(
      (user) =>
        user.companyId ===
          company.id &&
        user.role ===
          'employee'
    );

  const companyRequirements =
    requirements.filter(
      (requirement) =>
        requirement.companyId ===
        company.id
    );

  const companyCertificates =
    certificates.filter(
      (certificate) =>
        certificate.companyId ===
        company.id
    );

  const companyLocations =
    locations.filter(
      (location) =>
        location.companyId ===
        company.id
    );

  const companyTrainings =
    trainings.filter(
      (training) =>
        training.companyId ===
        company.id
    );

  const companyOnboardingItems =
    onboardingItems.filter(
      (item) =>
        item.companyId ===
        company.id
    );

  const pending =
    companyCertificates.filter(
      (certificate) =>
        certificate.status ===
        'Pending'
    );

  function employeeName(
    employeeId: string
  ) {
    return (
      users.find(
        (user) =>
          user.id ===
          employeeId
      )?.name ||
      'Unknown Employee'
    );
  }

  function locationName(
    locationId?: string
  ) {
    if (!locationId) {
      return 'Unassigned';
    }

    return (
      companyLocations.find(
        (location) =>
          location.id ===
          locationId
      )?.name ||
      'Unassigned'
    );
  }

  const missingCount =
    employees.reduce(
      (
        total,
        employee
      ) => {
        return (
          total +
          companyRequirements.filter(
            (
              requirement
            ) =>
              requirementState(
                employee.id,
                requirement.id,
                companyCertificates
              ) ===
              'Missing'
          ).length
        );
      },
      0
    );

  const expiringCount =
    employees.reduce(
      (
        total,
        employee
      ) => {
        return (
          total +
          companyRequirements.filter(
            (
              requirement
            ) =>
              requirementState(
                employee.id,
                requirement.id,
                companyCertificates
              ) ===
              'Expiring Soon'
          ).length
        );
      },
      0
    );

  const expiredCount =
    employees.reduce(
      (
        total,
        employee
      ) => {
        return (
          total +
          companyRequirements.filter(
            (
              requirement
            ) =>
              requirementState(
                employee.id,
                requirement.id,
                companyCertificates
              ) ===
              'Expired'
          ).length
        );
      },
      0
    );

  const overdueTrainingCount =
    companyTrainings.filter(
      (training) =>
        displayTrainingStatus(
          training
        ) ===
        'Overdue'
    ).length;

  const companyCompliance =
    employees.length ===
    0
      ? 100
      : Math.round(
          employees.reduce(
            (
              total,
              employee
            ) =>
              total +
              complianceForEmployee(
                employee.id,
                companyRequirements,
                companyCertificates
              ),
            0
          ) /
            employees.length
        );

  const managerNotifications:
    NotificationItem[] =
    useMemo(() => {
      const items:
        NotificationItem[] =
        [];

      companyCertificates
        .filter(
          (certificate) =>
            certificate.status ===
            'Approved'
        )
        .forEach(
          (certificate) => {
            const days =
              daysRemaining(
                certificate.expirationDate
              );

            const bucket =
              notificationBucket(
                days
              );

            if (bucket) {
              items.push({
                id:
                  `cert-${certificate.id}-${bucket}`,

                text:
                  `${employeeName(
                    certificate.employeeId
                  )} — ${certificate.certificateName} ${
                    days < 0
                      ? 'is expired'
                      : `expires within ${bucket}`
                  }`,

                tone:
                  days < 0 ||
                  days <= 7
                    ? 'danger'
                    : 'warning',
              });
            }
          }
        );

      pending.forEach(
        (certificate) => {
          items.push({
            id:
              `pending-${certificate.id}`,

            text:
              `${employeeName(
                certificate.employeeId
              )} submitted ${certificate.certificateName} for review`,

            tone:
              'info',
          });
        }
      );

      companyTrainings
        .filter(
          (training) =>
            displayTrainingStatus(
              training
            ) ===
            'Overdue'
        )
        .forEach(
          (training) => {
            items.push({
              id:
                `training-${training.id}`,

              text:
                `${employeeName(
                  training.employeeId
                )} has overdue training: ${training.name}`,

              tone:
                'danger',
            });
          }
        );

      return items;
    }, [
      companyCertificates,
      companyTrainings,
      pending,
      users,
    ]);

  const searchedEmployees =
    employees.filter(
      (employee) => {
        const query =
          employeeSearch.toLowerCase();

        const matchesSearch =
          `${employee.name} ${employee.jobTitle || ''} ${employee.email || ''}`
            .toLowerCase()
            .includes(
              query
            );

        const matchesLocation =
          locationFilter ===
            'All' ||
          employee.locationId ===
            locationFilter;

        return (
          matchesSearch &&
          matchesLocation
        );
      }
    );

  const searchedRequirements =
    companyRequirements.filter(
      (requirement) =>
        requirement.name
          .toLowerCase()
          .includes(
            certificateSearch
              .trim()
              .toLowerCase()
          )
    );

  const renewalWarnings =
    [
      ...companyCertificates,
    ]
      .filter(
        (certificate) =>
          certificate.status ===
            'Approved' &&
          daysRemaining(
            certificate.expirationDate
          ) <= 60
      )
      .sort(
        (a, b) =>
          daysRemaining(
            a.expirationDate
          ) -
          daysRemaining(
            b.expirationDate
          )
      );

  function addHistory(
    certificate:
      CertificateSubmission,

    action:
      CertificateHistory['action'],

    note?: string
  ) {
    updateHistory([
      ...history,

      {
        id:
          crypto.randomUUID(),

        companyId:
          company.id,

        certificateId:
          certificate.id,

        employeeId:
          certificate.employeeId,

        action,

        note,

        at:
          new Date().toISOString(),
      },
    ]);
  }

  function changeStatus(
    certificateId: string,

    status:
      | 'Approved'
      | 'Rejected'
  ) {
    const certificate =
      certificates.find(
        (item) =>
          item.id ===
          certificateId
      );

    if (!certificate) {
      return;
    }

    let rejectionReason =
      certificate.rejectionReason;

    if (
      status ===
      'Rejected'
    ) {
      const reason =
        window.prompt(
          'Why are you rejecting this certificate?'
        );

      if (
        !reason?.trim()
      ) {
        return;
      }

      rejectionReason =
        reason.trim();
    } else {
      rejectionReason =
        undefined;
    }

    const updated = {
      ...certificate,
      status,
      rejectionReason,
    };

    updateCertificates(
      certificates.map(
        (item) =>
          item.id ===
          certificateId
            ? updated
            : item
      )
    );

    addHistory(
      updated,
      status ===
        'Approved'
        ? 'Approved'
        : 'Rejected',
      rejectionReason
    );
  }

  function addRequirement(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const name =
      String(
        form.get(
          'name'
        ) || ''
      ).trim();

    const category =
      String(
        form.get(
          'category'
        ) || ''
      ).trim();

    if (
      !name ||
      !category
    ) {
      return;
    }

    if (
      companyRequirements.some(
        (requirement) =>
          requirement.name
            .toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      alert(
        'That certificate is already on the list.'
      );

      return;
    }

    updateRequirements([
      ...requirements,

      {
        id:
          crypto.randomUUID(),

        companyId:
          company.id,

        name,

        category,
      },
    ]);

    event.currentTarget.reset();
  }

  function removeRequirement(
    id: string
  ) {
    if (
      !window.confirm(
        'Remove this required certificate?'
      )
    ) {
      return;
    }

    updateRequirements(
      requirements.filter(
        (requirement) =>
          requirement.id !==
          id
      )
    );
  }

  function saveEmployeeProfile(
    event:
      FormEvent<HTMLFormElement>,

    employee: User
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const updated:
      User = {
      ...employee,

      name:
        String(
          form.get(
            'name'
          ) || ''
        ),

      phone:
        String(
          form.get(
            'phone'
          ) || ''
        ),

      email:
        String(
          form.get(
            'email'
          ) || ''
        ),

      address:
        String(
          form.get(
            'address'
          ) || ''
        ),

      emergencyContactName:
        String(
          form.get(
            'emergencyContactName'
          ) || ''
        ),

      emergencyContactPhone:
        String(
          form.get(
            'emergencyContactPhone'
          ) || ''
        ),

      jobTitle:
        String(
          form.get(
            'jobTitle'
          ) || ''
        ),

      hireDate:
        String(
          form.get(
            'hireDate'
          ) || ''
        ),

      locationId:
        String(
          form.get(
            'locationId'
          ) || ''
        ),

      employmentStatus:
        String(
          form.get(
            'employmentStatus'
          ) ||
            'Active'
        ) as EmploymentStatus,

      supervisor:
        String(
          form.get(
            'supervisor'
          ) || ''
        ),

      notes:
        String(
          form.get(
            'notes'
          ) || ''
        ),
    };

    updateUsers(
      users.map(
        (user) =>
          user.id ===
          employee.id
            ? updated
            : user
      )
    );

    alert(
      'Employee profile saved.'
    );
  }

  function addLocation(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    updateLocations([
      ...locations,

      {
        id:
          crypto.randomUUID(),

        companyId:
          company.id,

        name:
          String(
            form.get(
              'name'
            ) || ''
          ),

        address:
          String(
            form.get(
              'address'
            ) || ''
          ),

        managerName:
          String(
            form.get(
              'managerName'
            ) || ''
          ),

        phone:
          String(
            form.get(
              'phone'
            ) || ''
          ),

        status:
          'Active',
      },
    ]);

    event.currentTarget.reset();
  }

  function assignTraining(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const employeeId =
      String(
        form.get(
          'employeeId'
        ) || ''
      );

    if (!employeeId) {
      return;
    }

    updateTrainings([
      ...trainings,

      {
        id:
          crypto.randomUUID(),

        companyId:
          company.id,

        employeeId,

        name:
          String(
            form.get(
              'name'
            ) || ''
          ),

        description:
          String(
            form.get(
              'description'
            ) || ''
          ),

        dueDate:
          String(
            form.get(
              'dueDate'
            ) || ''
          ),

        status:
          'Not Started',

        assignedAt:
          new Date().toISOString(),
      },
    ]);

    event.currentTarget.reset();
  }

  function markTrainingComplete(
    id: string
  ) {
    updateTrainings(
      trainings.map(
        (training) =>
          training.id ===
          id
            ? {
                ...training,
                status:
                  'Completed',
              }
            : training
      )
    );
  }

  function addOnboardingItem(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const title =
      String(
        form.get(
          'title'
        ) || ''
      ).trim();

    if (!title) {
      return;
    }

    updateOnboardingItems([
      ...onboardingItems,

      {
        id:
          crypto.randomUUID(),

        companyId:
          company.id,

        title,
      },
    ]);

    event.currentTarget.reset();
  }

  const locationCompliance =
    companyLocations.map(
      (location) => {
        const locationEmployees =
          employees.filter(
            (employee) =>
              employee.locationId ===
              location.id
          );

        const score =
          locationEmployees.length ===
          0
            ? 100
            : Math.round(
                locationEmployees.reduce(
                  (
                    total,
                    employee
                  ) =>
                    total +
                    complianceForEmployee(
                      employee.id,
                      companyRequirements,
                      companyCertificates
                    ),
                  0
                ) /
                  locationEmployees.length
              );

        return {
          ...location,

          employeeCount:
            locationEmployees.length,

          compliance:
            score,
        };
      }
    );

  const reportRows =
    employees
      .flatMap(
        (employee) =>
          companyRequirements.map(
            (
              requirement
            ) => ({
              employee,

              requirement,

              state:
                requirementState(
                  employee.id,
                  requirement.id,
                  companyCertificates
                ),
            })
          )
      )
      .filter(
        (row) => {
          const query =
            reportSearch.toLowerCase();

          const matchesSearch =
            `${row.employee.name} ${row.requirement.name} ${row.state}`
              .toLowerCase()
              .includes(
                query
              );

          const matchesLocation =
            locationFilter ===
              'All' ||
            row.employee.locationId ===
              locationFilter;

          return (
            matchesSearch &&
            matchesLocation
          );
        }
      );

  const selectedEmployee =
    employees.find(
      (employee) =>
        employee.id ===
        selectedEmployeeId
    ) || null;

  return (
    <div className="app">

      <aside className="sidebar">

        <Brand />

        <p className="sidebar-subtitle">
          Management Portal
        </p>

        <nav className="nav">

          {([
            [
              'dashboard',
              'Dashboard',
            ],

            [
              'employees',
              'Employees',
            ],

            [
              'certificates',
              'Certificate Lookup',
            ],

            [
              'reviews',

              `Certificate Reviews${
                pending.length
                  ? ` (${pending.length})`
                  : ''
              }`,
            ],

            [
              'requirements',
              'Required Certificates',
            ],

            [
              'training',
              'Training',
            ],

            [
              'onboarding',
              'Onboarding',
            ],

            [
              'locations',
              'Locations',
            ],

            [
              'reports',
              'Reports',
            ],
          ] as [
            ManagerPage,
            string
          ][]).map(
            ([
              value,
              label,
            ]) => (
              <button
                key={
                  value
                }
                className={
                  page ===
                  value
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPage(
                    value
                  )
                }
              >
                {label}
              </button>
            )
          )}

        </nav>

        <button
          className="logout-button"
          onClick={
            logout
          }
        >
          Sign Out
        </button>

      </aside>

      <main className="content">

        <header className="header">

          <div>

            <p className="eyebrow">
              CERTCUE MANAGEMENT
            </p>

            <h1>
              {
                pageTitle(
                  page
                )
              }
            </h1>

          </div>

          <NotificationBell
            notifications={
              managerNotifications
            }
            open={
              notificationsOpen
            }
            setOpen={
              setNotificationsOpen
            }
          />

        </header>

        {page ===
          'dashboard' && (
          <>

            <div className="company-id-card">

              <div>

                <span>
                  Company
                </span>

                <strong>
                  {
                    company.name
                  }
                </strong>

              </div>

              <div>

                <span>
                  Company ID
                </span>

                <strong>
                  {
                    company.id
                  }
                </strong>

              </div>

              <div>

                <span>
                  Management ID
                </span>

                <strong>
                  {
                    company.managementId
                  }
                </strong>

              </div>

            </div>

            <div className="stats stats-wide">

              <StatCard
                title="Total Employees"
                number={
                  employees.length
                }
                subtitle="Registered staff"
              />

              <StatCard
                title="Company Compliance"
                number={
                  `${companyCompliance}%`
                }
                subtitle="Current requirements"
              />

              <StatCard
                title="Pending Reviews"
                number={
                  pending.length
                }
                subtitle="Needs approval"
              />

              <StatCard
                title="Missing Certificates"
                number={
                  missingCount
                }
                subtitle="Not submitted"
              />

              <StatCard
                title="Expiring Soon"
                number={
                  expiringCount
                }
                subtitle="Within 60 days"
              />

              <StatCard
                title="Expired"
                number={
                  expiredCount
                }
                subtitle="Immediate action"
              />

              <StatCard
                title="Overdue Training"
                number={
                  overdueTrainingCount
                }
                subtitle="Past due"
              />

            </div>

            <section className="panel">

              <div className="panel-heading">

                <div>

                  <h2>
                    Renewal Warnings
                  </h2>

                  <p>
                    Certificates expiring within 60 days or already expired.
                  </p>

                </div>

              </div>

              <ManagerCertificateTable
                certificates={
                  renewalWarnings
                }
                employeeName={
                  employeeName
                }
                changeStatus={
                  changeStatus
                }
              />

            </section>

          </>
        )}

        {page ===
          'employees' && (
          <section className="panel">

            <div className="panel-heading employee-tools">

              <div>

                <h2>
                  Employee Profiles
                </h2>

                <p>
                  Open an employee to view compliance and edit their full profile.
                </p>

              </div>

              <div className="toolbar-row">

                <input
                  className="category-filter"
                  placeholder="Search employees..."
                  value={
                    employeeSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setEmployeeSearch(
                      event.target.value
                    )
                  }
                />

                <select
                  className="category-filter"
                  value={
                    locationFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setLocationFilter(
                      event.target.value
                    )
                  }
                >

                  <option value="All">
                    All locations
                  </option>

                  {companyLocations.map(
                    (
                      location
                    ) => (
                      <option
                        key={
                          location.id
                        }
                        value={
                          location.id
                        }
                      >
                        {
                          location.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            <div className="employee-grid">

              {searchedEmployees.map(
                (
                  employee
                ) => (
                  <button
                    className="employee-card employee-card-button"
                    key={
                      employee.id
                    }
                    onClick={() =>
                      setSelectedEmployeeId(
                        employee.id
                      )
                    }
                  >

                    <div className="avatar">
                      {employee.name
                        .substring(
                          0,
                          2
                        )
                        .toUpperCase()}
                    </div>

                    <div className="employee-card-copy">

                      <h3>
                        {
                          employee.name
                        }
                      </h3>

                      <p>
                        {employee.jobTitle ||
                          'No job title'}
                        {' • '}
                        {
                          locationName(
                            employee.locationId
                          )
                        }
                      </p>

                      <small>
                        {complianceForEmployee(
                          employee.id,
                          companyRequirements,
                          companyCertificates
                        )}
                        % compliant
                      </small>

                    </div>

                  </button>
                )
              )}

            </div>

            {selectedEmployee && (
              <EmployeeProfilePanel
                employee={
                  selectedEmployee
                }
                requirements={
                  companyRequirements
                }
                certificates={
                  companyCertificates
                }
                locations={
                  companyLocations
                }
                trainings={
                  companyTrainings.filter(
                    (
                      training
                    ) =>
                      training.employeeId ===
                      selectedEmployee.id
                  )
                }
                history={
                  history.filter(
                    (
                      item
                    ) =>
                      item.employeeId ===
                      selectedEmployee.id
                  )
                }
                onClose={() =>
                  setSelectedEmployeeId(
                    null
                  )
                }
                onSave={(
                  event
                ) =>
                  saveEmployeeProfile(
                    event,
                    selectedEmployee
                  )
                }
              />
            )}

          </section>
        )}

        {page ===
          'certificates' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Certificate Requirement View
                </h2>

                <p>
                  Search a specific certificate and see every employee, including missing records.
                </p>

              </div>

              <input
                className="category-filter"
                type="search"
                placeholder="Search CPR, Article 9..."
                value={
                  certificateSearch
                }
                onChange={(
                  event
                ) =>
                  setCertificateSearch(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="lookup-stack">

              {(certificateSearch
                ? searchedRequirements
                : companyRequirements.slice(
                    0,
                    6
                  )
              ).map(
                (
                  requirement
                ) => (
                  <div
                    className="lookup-block"
                    key={
                      requirement.id
                    }
                  >

                    <h3>
                      {
                        requirement.name
                      }
                    </h3>

                    <RequirementLookupTable
                      requirement={
                        requirement
                      }
                      employees={
                        employees
                      }
                      certificates={
                        companyCertificates
                      }
                    />

                  </div>
                )
              )}

              {certificateSearch &&
                searchedRequirements.length ===
                  0 && (
                  <div className="empty-cell">
                    No matching certificate requirement found.
                  </div>
                )}

            </div>

          </section>
        )}

        {page ===
          'reviews' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Certificate Review Inbox
                </h2>

                <p>
                  Approve or reject pending employee submissions.
                </p>

              </div>

              <span className="review-count">
                {
                  pending.length
                }{' '}
                pending
              </span>

            </div>

            <ManagerCertificateTable
              certificates={
                pending
              }
              employeeName={
                employeeName
              }
              changeStatus={
                changeStatus
              }
            />

          </section>
        )}

        {page ===
          'requirements' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Required Certificates
                </h2>

                <p>
                  Control the certificates employees are expected to keep current.
                </p>

              </div>

            </div>

            <div className="requirement-manager">

              <form
                className="requirement-form"
                onSubmit={
                  addRequirement
                }
              >

                <input
                  name="name"
                  placeholder="Certificate name"
                  required
                />

                <input
                  name="category"
                  placeholder="Category"
                  required
                />

                <button
                  className="main-button"
                >
                  + Add
                </button>

              </form>

              {companyRequirements.map(
                (
                  requirement
                ) => (
                  <div
                    className="requirement-row"
                    key={
                      requirement.id
                    }
                  >

                    <span>

                      <strong>
                        {
                          requirement.name
                        }
                      </strong>

                      {' '}

                      <small>
                        {
                          requirement.category
                        }
                      </small>

                    </span>

                    <button
                      onClick={() =>
                        removeRequirement(
                          requirement.id
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {page ===
          'training' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Training Assignments
                </h2>

                <p>
                  Assign training with due dates and track completion.
                </p>

              </div>

            </div>

            <div className="section-pad">

              <form
                className="requirement-form training-form"
                onSubmit={
                  assignTraining
                }
              >

                <select
                  name="employeeId"
                  required
                  defaultValue=""
                >

                  <option
                    value=""
                    disabled
                  >
                    Employee
                  </option>

                  {employees.map(
                    (
                      employee
                    ) => (
                      <option
                        key={
                          employee.id
                        }
                        value={
                          employee.id
                        }
                      >
                        {
                          employee.name
                        }
                      </option>
                    )
                  )}

                </select>

                <input
                  name="name"
                  placeholder="Training name"
                  required
                />

                <input
                  name="dueDate"
                  type="date"
                  required
                />

                <input
                  className="span-two"
                  name="description"
                  placeholder="Description"
                />

                <button
                  className="main-button"
                >
                  Assign
                </button>

              </form>

              <div className="simple-list">

                {companyTrainings.map(
                  (
                    training
                  ) => (
                    <div
                      className="simple-row"
                      key={
                        training.id
                      }
                    >

                      <div>

                        <strong>
                          {
                            training.name
                          }
                        </strong>

                        <small>
                          {employeeName(
                            training.employeeId
                          )}
                          {' • '}
                          Due{' '}
                          {
                            training.dueDate
                          }
                        </small>

                      </div>

                      <span
                        className={`training-status ${displayTrainingStatus(
                          training
                        )
                          .toLowerCase()
                          .replace(
                            ' ',
                            '-'
                          )}`}
                      >
                        {
                          displayTrainingStatus(
                            training
                          )
                        }
                      </span>

                      {training.status !==
                        'Completed' && (
                        <button
                          className="approve-button"
                          onClick={() =>
                            markTrainingComplete(
                              training.id
                            )
                          }
                        >
                          Complete
                        </button>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>

          </section>
        )}

        {page ===
          'onboarding' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Onboarding Checklist
                </h2>

                <p>
                  Customize the checklist new employees see.
                </p>

              </div>

            </div>

            <div className="requirement-manager">

              <form
                className="requirement-form onboarding-form"
                onSubmit={
                  addOnboardingItem
                }
              >

                <input
                  name="title"
                  placeholder="New onboarding task"
                  required
                />

                <button
                  className="main-button"
                >
                  + Add Task
                </button>

              </form>

              {companyOnboardingItems.map(
                (
                  item
                ) => (
                  <div
                    className="requirement-row"
                    key={
                      item.id
                    }
                  >

                    <span>
                      {
                        item.title
                      }
                    </span>

                    <button
                      onClick={() =>
                        updateOnboardingItems(
                          onboardingItems.filter(
                            (
                              onboardingItem
                            ) =>
                              onboardingItem.id !==
                              item.id
                          )
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>
                )
              )}

              <h3 className="section-title">
                Employee Progress
              </h3>

              {employees.map(
                (
                  employee
                ) => {
                  const completed =
                    companyOnboardingItems.filter(
                      (
                        item
                      ) =>
                        onboardingProgress.some(
                          (
                            progress
                          ) =>
                            progress.employeeId ===
                              employee.id &&
                            progress.itemId ===
                              item.id &&
                            progress.completed
                        )
                    ).length;

                  const percent =
                    companyOnboardingItems.length
                      ? Math.round(
                          (
                            completed /
                            companyOnboardingItems.length
                          ) *
                            100
                        )
                      : 100;

                  return (
                    <div
                      className="progress-row"
                      key={
                        employee.id
                      }
                    >

                      <span>
                        {
                          employee.name
                        }
                      </span>

                      <ProgressBar
                        percent={
                          percent
                        }
                      />

                      <strong>
                        {
                          percent
                        }
                        %
                      </strong>

                    </div>
                  );
                }
              )}

            </div>

          </section>
        )}

        {page ===
          'locations' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Locations / Group Homes
                </h2>

                <p>
                  Create locations and compare compliance by house.
                </p>

              </div>

            </div>

            <div className="section-pad">

              <form
                className="requirement-form location-form"
                onSubmit={
                  addLocation
                }
              >

                <input
                  name="name"
                  placeholder="Location name"
                  required
                />

                <input
                  name="address"
                  placeholder="Address"
                />

                <input
                  name="managerName"
                  placeholder="Manager"
                />

                <input
                  name="phone"
                  placeholder="Phone"
                />

                <button
                  className="main-button"
                >
                  + Add Location
                </button>

              </form>

              <div className="location-grid">

                {locationCompliance.map(
                  (
                    location
                  ) => (
                    <div
                      className="location-card"
                      key={
                        location.id
                      }
                    >

                      <h3>
                        {
                          location.name
                        }
                      </h3>

                      <p>
                        {location.address ||
                          'No address'}
                      </p>

                      <strong>
                        {
                          location.compliance
                        }
                        % compliant
                      </strong>

                      <small>
                        {
                          location.employeeCount
                        }{' '}
                        employees
                      </small>

                    </div>
                  )
                )}

              </div>

            </div>

          </section>
        )}

        {page ===
          'reports' && (
          <section className="panel">

            <div className="panel-heading employee-tools">

              <div>

                <h2>
                  Reports
                </h2>

                <p>
                  Search missing, expired, pending, compliance, location, and training information.
                </p>

              </div>

              <div className="toolbar-row">

                <input
                  className="category-filter"
                  placeholder="Search reports..."
                  value={
                    reportSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setReportSearch(
                      event.target.value
                    )
                  }
                />

                <select
                  className="category-filter"
                  value={
                    locationFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setLocationFilter(
                      event.target.value
                    )
                  }
                >

                  <option value="All">
                    All locations
                  </option>

                  {companyLocations.map(
                    (
                      location
                    ) => (
                      <option
                        key={
                          location.id
                        }
                        value={
                          location.id
                        }
                      >
                        {
                          location.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            <div className="report-summary">

              <StatCard
                title="Expired"
                number={
                  reportRows.filter(
                    (
                      row
                    ) =>
                      row.state ===
                      'Expired'
                  ).length
                }
                subtitle="Certificate requirements"
              />

              <StatCard
                title="Expiring"
                number={
                  reportRows.filter(
                    (
                      row
                    ) =>
                      row.state ===
                      'Expiring Soon'
                  ).length
                }
                subtitle="Within 60 days"
              />

              <StatCard
                title="Missing"
                number={
                  reportRows.filter(
                    (
                      row
                    ) =>
                      row.state ===
                      'Missing'
                  ).length
                }
                subtitle="Required records"
              />

              <StatCard
                title="Pending"
                number={
                  reportRows.filter(
                    (
                      row
                    ) =>
                      row.state ===
                      'Pending'
                  ).length
                }
                subtitle="Awaiting review"
              />

            </div>

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Employee
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Certificate
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Compliance
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {reportRows.map(
                    (
                      row
                    ) => (
                      <tr
                        key={`${row.employee.id}-${row.requirement.id}`}
                      >

                        <td>
                          {
                            row.employee.name
                          }
                        </td>

                        <td>
                          {locationName(
                            row.employee.locationId
                          )}
                        </td>

                        <td>
                          {
                            row.requirement.name
                          }
                        </td>

                        <td>
                          <RequirementBadge
                            state={
                              row.state
                            }
                          />
                        </td>

                        <td>
                          {complianceForEmployee(
                            row.employee.id,
                            companyRequirements,
                            companyCertificates
                          )}
                          %
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="section-pad">

              <h3>
                Location Compliance
              </h3>

              {locationCompliance.map(
                (
                  location
                ) => (
                  <div
                    className="progress-row"
                    key={
                      location.id
                    }
                  >

                    <span>
                      {
                        location.name
                      }
                    </span>

                    <ProgressBar
                      percent={
                        location.compliance
                      }
                    />

                    <strong>
                      {
                        location.compliance
                      }
                      %
                    </strong>

                  </div>
                )
              )}

            </div>

            <div className="section-pad report-training">

              <h3>
                Training Completion
              </h3>

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      <th>
                        Employee
                      </th>

                      <th>
                        Training
                      </th>

                      <th>
                        Due Date
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {companyTrainings
                      .filter(
                        (
                          training
                        ) => {
                          const query =
                            reportSearch.toLowerCase();

                          const matchesSearch =
                            `${employeeName(
                              training.employeeId
                            )} ${training.name} ${displayTrainingStatus(
                              training
                            )}`
                              .toLowerCase()
                              .includes(
                                query
                              );

                          const trainee =
                            employees.find(
                              (
                                employee
                              ) =>
                                employee.id ===
                                training.employeeId
                            );

                          const matchesLocation =
                            locationFilter ===
                              'All' ||
                            trainee?.locationId ===
                              locationFilter;

                          return (
                            matchesSearch &&
                            matchesLocation
                          );
                        }
                      )
                      .map(
                        (
                          training
                        ) => (
                          <tr
                            key={
                              training.id
                            }
                          >

                            <td>
                              {employeeName(
                                training.employeeId
                              )}
                            </td>

                            <td>
                              {
                                training.name
                              }
                            </td>

                            <td>
                              {
                                training.dueDate
                              }
                            </td>

                            <td>
                              {displayTrainingStatus(
                                training
                              )}
                            </td>

                          </tr>
                        )
                      )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}
/* =========================================================
   EMPLOYEE APP
========================================================= */

function EmployeeApp({
  employee,
  companies,
  users,
  requirements,
  certificates,
  locations,
  history,
  trainings,
  onboardingItems,
  onboardingProgress,
  updateUsers,
  updateCertificates,
  updateHistory,
  updateTrainings,
  updateOnboardingProgress,
  logout,
}: {
  employee: User;

  companies:
    Company[];

  users:
    User[];

  requirements:
    Requirement[];

  certificates:
    CertificateSubmission[];

  locations:
    Location[];

  history:
    CertificateHistory[];

  trainings:
    TrainingAssignment[];

  onboardingItems:
    OnboardingItem[];

  onboardingProgress:
    OnboardingProgress[];

  updateUsers: (
    next: User[]
  ) => void;

  updateCertificates: (
    next:
      CertificateSubmission[]
  ) => void;

  updateHistory: (
    next:
      CertificateHistory[]
  ) => void;

  updateTrainings: (
    next:
      TrainingAssignment[]
  ) => void;

  updateOnboardingProgress: (
    next:
      OnboardingProgress[]
  ) => void;

  logout:
    () => void;
}) {
  const [
    page,
    setPage,
  ] =
    useState<EmployeePage>(
      'dashboard'
    );

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(false);

  const company =
    companies.find(
      (company) =>
        company.id ===
        employee.companyId
    );

  const companyRequirements =
    requirements.filter(
      (requirement) =>
        requirement.companyId ===
        employee.companyId
    );

  const employeeCertificates =
    certificates.filter(
      (certificate) =>
        certificate.employeeId ===
        employee.id
    );

  const employeeTrainings =
    trainings.filter(
      (training) =>
        training.employeeId ===
        employee.id
    );

  const employeeOnboarding =
    onboardingItems.filter(
      (item) =>
        item.companyId ===
        employee.companyId
    );

  const location =
    locations.find(
      (location) =>
        location.id ===
        employee.locationId
    );

  const compliance =
    complianceForEmployee(
      employee.id,
      companyRequirements,
      employeeCertificates
    );

  const employeeNotifications:
    NotificationItem[] =
    useMemo(() => {
      const items:
        NotificationItem[] =
        [];

      employeeCertificates.forEach(
        (certificate) => {
          if (
            certificate.status ===
            'Rejected'
          ) {
            items.push({
              id:
                `rejected-${certificate.id}`,

              text:
                `${certificate.certificateName} was rejected${
                  certificate.rejectionReason
                    ? `: ${certificate.rejectionReason}`
                    : ''
                }`,

              tone:
                'danger',
            });
          }

          if (
            certificate.status ===
            'Pending'
          ) {
            items.push({
              id:
                `pending-${certificate.id}`,

              text:
                `${certificate.certificateName} is waiting for management review`,

              tone:
                'info',
            });
          }

          if (
            certificate.status ===
            'Approved'
          ) {
            const days =
              daysRemaining(
                certificate.expirationDate
              );

            const bucket =
              notificationBucket(
                days
              );

            if (bucket) {
              items.push({
                id:
                  `expire-${certificate.id}-${bucket}`,

                text:
                  `${certificate.certificateName} ${
                    days < 0
                      ? 'is expired'
                      : `expires within ${bucket}`
                  }`,

                tone:
                  days < 0 ||
                  days <= 7
                    ? 'danger'
                    : 'warning',
              });
            }
          }
        }
      );

      employeeTrainings.forEach(
        (training) => {
          const status =
            displayTrainingStatus(
              training
            );

          if (
            status ===
            'Overdue'
          ) {
            items.push({
              id:
                `training-${training.id}`,

              text:
                `${training.name} is overdue`,

              tone:
                'danger',
            });
          } else if (
            training.status ===
            'Not Started'
          ) {
            items.push({
              id:
                `training-${training.id}`,

              text:
                `Training assigned: ${training.name} due ${training.dueDate}`,

              tone:
                'info',
            });
          }
        }
      );

      return items;
    }, [
      employeeCertificates,
      employeeTrainings,
    ]);

  const missing =
    companyRequirements.filter(
      (requirement) =>
        requirementState(
          employee.id,
          requirement.id,
          employeeCertificates
        ) ===
        'Missing'
    );

  const expiring =
    companyRequirements.filter(
      (requirement) =>
        requirementState(
          employee.id,
          requirement.id,
          employeeCertificates
        ) ===
        'Expiring Soon'
    );

  const pending =
    companyRequirements.filter(
      (requirement) =>
        requirementState(
          employee.id,
          requirement.id,
          employeeCertificates
        ) ===
        'Pending'
    );

  const incompleteTraining =
    employeeTrainings.filter(
      (training) =>
        displayTrainingStatus(
          training
        ) !==
        'Completed'
    );

  const onboardingComplete =
    employeeOnboarding.filter(
      (item) =>
        onboardingProgress.some(
          (progress) =>
            progress.employeeId ===
              employee.id &&
            progress.itemId ===
              item.id &&
            progress.completed
        )
    ).length;

  const onboardingPercent =
    employeeOnboarding.length
      ? Math.round(
          (
            onboardingComplete /
            employeeOnboarding.length
          ) *
            100
        )
      : 100;

  async function submitCertificate(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const requirementId =
      String(
        form.get(
          'requirementId'
        ) || ''
      );

    const requirement =
      companyRequirements.find(
        (item) =>
          item.id ===
          requirementId
      );

    if (!requirement) {
      alert(
        'Select a certificate.'
      );

      return;
    }

    const uploadedFile =
      form.get(
        'certificateFile'
      );

    if (
      !(
        uploadedFile instanceof
        File
      ) ||
      uploadedFile.size ===
        0
    ) {
      alert(
        'Select a file to upload.'
      );

      return;
    }

    const maxSize =
      20 *
      1024 *
      1024;

    if (
      uploadedFile.size >
      maxSize
    ) {
      alert(
        'Maximum file size is 20 MB.'
      );

      return;
    }

    const fileKey =
      crypto.randomUUID();

    try {
      await saveCertificateFile(
        fileKey,
        uploadedFile
      );
    } catch {
      alert(
        'The file could not be saved.'
      );

      return;
    }

    const previous =
      latestCertificateFor(
        employee.id,
        requirement.id,
        employeeCertificates
      );

    const submission:
      CertificateSubmission =
      {
        id:
          crypto.randomUUID(),

        companyId:
          employee.companyId,

        employeeId:
          employee.id,

        requirementId:
          requirement.id,

        certificateName:
          requirement.name,

        category:
          requirement.category,

        issueDate:
          String(
            form.get(
              'issueDate'
            ) || ''
          ),

        expirationDate:
          String(
            form.get(
              'expirationDate'
            ) || ''
          ),

        fileKey,

        fileName:
          uploadedFile.name,

        status:
          'Pending',

        submittedAt:
          new Date().toISOString(),
      };

    updateCertificates([
      ...certificates,
      submission,
    ]);

    updateHistory([
      ...history,

      {
        id:
          crypto.randomUUID(),

        companyId:
          employee.companyId,

        certificateId:
          submission.id,

        employeeId:
          employee.id,

        action:
          previous
            ? previous.status ===
              'Rejected'
              ? 'Resubmitted'
              : 'Renewed'
            : 'Submitted',

        at:
          new Date().toISOString(),
      },
    ]);

    alert(
      'Certificate submitted for management approval.'
    );

    event.currentTarget.reset();

    setPage(
      'dashboard'
    );
  }

  function changeTrainingStatus(
    id: string,
    status:
      TrainingStatus
  ) {
    updateTrainings(
      trainings.map(
        (training) =>
          training.id ===
          id
            ? {
                ...training,
                status,
              }
            : training
      )
    );
  }

  function toggleOnboarding(
    itemId: string
  ) {
    const existing =
      onboardingProgress.find(
        (progress) =>
          progress.employeeId ===
            employee.id &&
          progress.itemId ===
            itemId
      );

    if (existing) {
      updateOnboardingProgress(
        onboardingProgress.map(
          (progress) =>
            progress.id ===
            existing.id
              ? {
                  ...progress,

                  completed:
                    !progress.completed,
                }
              : progress
        )
      );
    } else {
      updateOnboardingProgress([
        ...onboardingProgress,

        {
          id:
            crypto.randomUUID(),

          companyId:
            employee.companyId,

          employeeId:
            employee.id,

          itemId,

          completed:
            true,
        },
      ]);
    }
  }

  function saveOwnProfile(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const updated = {
      ...employee,

      phone:
        String(
          form.get(
            'phone'
          ) || ''
        ),

      email:
        String(
          form.get(
            'email'
          ) || ''
        ),

      address:
        String(
          form.get(
            'address'
          ) || ''
        ),

      emergencyContactName:
        String(
          form.get(
            'emergencyContactName'
          ) || ''
        ),

      emergencyContactPhone:
        String(
          form.get(
            'emergencyContactPhone'
          ) || ''
        ),

      notes:
        String(
          form.get(
            'notes'
          ) || ''
        ),
    };

    updateUsers(
      users.map(
        (user) =>
          user.id ===
          employee.id
            ? updated
            : user
      )
    );

    alert(
      'Profile saved.'
    );
  }

  return (
    <div className="app">

      <aside className="sidebar">

        <Brand />

        <p className="sidebar-subtitle">
          Employee Portal
        </p>

        <nav className="nav">

          <button
            className={
              page ===
              'dashboard'
                ? 'active'
                : ''
            }
            onClick={() =>
              setPage(
                'dashboard'
              )
            }
          >
            My Dashboard
          </button>

          <button
            className={
              page ===
              'submit'
                ? 'active'
                : ''
            }
            onClick={() =>
              setPage(
                'submit'
              )
            }
          >
            Submit Certificate
          </button>

          <button
            className={
              page ===
              'training'
                ? 'active'
                : ''
            }
            onClick={() =>
              setPage(
                'training'
              )
            }
          >
            My Training
          </button>

          <button
            className={
              page ===
              'profile'
                ? 'active'
                : ''
            }
            onClick={() =>
              setPage(
                'profile'
              )
            }
          >
            My Profile
          </button>

        </nav>

        <button
          className="logout-button"
          onClick={
            logout
          }
        >
          Sign Out
        </button>

      </aside>

      <main className="content">

        <header className="header">

          <div>

            <p className="eyebrow">
              EMPLOYEE PORTAL
            </p>

            <h1>

              {page ===
                'dashboard'
                ? 'My Dashboard'
                : page ===
                  'submit'
                ? 'Submit Certificate'
                : page ===
                  'training'
                ? 'My Training'
                : 'My Profile'}

            </h1>

          </div>

          <NotificationBell
            notifications={
              employeeNotifications
            }
            open={
              notificationsOpen
            }
            setOpen={
              setNotificationsOpen
            }
          />

        </header>

        {page ===
          'dashboard' && (
          <>

            <div className="employee-welcome-card">

              <div>

                <h2>
                  Welcome,{' '}
                  {
                    employee.name
                  }
                </h2>

                <p>
                  {employee.jobTitle ||
                    'Employee'}
                  {' • '}
                  {location?.name ||
                    'No location assigned'}
                  {' • '}
                  {company?.name}
                </p>

              </div>

              <div className="score-circle">
                {
                  compliance
                }
                %
              </div>

            </div>

            <div className="stats">

              <StatCard
                title="Missing"
                number={
                  missing.length
                }
                subtitle="Required certificates"
              />

              <StatCard
                title="Expiring Soon"
                number={
                  expiring.length
                }
                subtitle="Within 60 days"
              />

              <StatCard
                title="Pending Review"
                number={
                  pending.length
                }
                subtitle="Waiting on management"
              />

              <StatCard
                title="Training Due"
                number={
                  incompleteTraining.length
                }
                subtitle="Incomplete assignments"
              />

            </div>

            <section className="panel">

              <div className="panel-heading">

                <div>

                  <h2>
                    Required Certificates
                  </h2>

                  <p>
                    See exactly what is approved, missing, pending, expiring, expired, or rejected.
                  </p>

                </div>

              </div>

              <RequirementLookupTable
                requirement={
                  undefined
                }
                employees={[
                  employee,
                ]}
                certificates={
                  employeeCertificates
                }
                requirements={
                  companyRequirements
                }
              />

            </section>

            <section className="panel panel-gap">

              <div className="panel-heading">

                <div>

                  <h2>
                    Onboarding Progress
                  </h2>

                  <p>
                    {
                      onboardingComplete
                    }{' '}
                    of{' '}
                    {
                      employeeOnboarding.length
                    }{' '}
                    tasks complete
                  </p>

                </div>

                <strong>
                  {
                    onboardingPercent
                  }
                  %
                </strong>

              </div>

              <div className="section-pad">

                <ProgressBar
                  percent={
                    onboardingPercent
                  }
                />

                <div className="checklist">

                  {employeeOnboarding.map(
                    (
                      item
                    ) => {
                      const done =
                        onboardingProgress.some(
                          (
                            progress
                          ) =>
                            progress.employeeId ===
                              employee.id &&
                            progress.itemId ===
                              item.id &&
                            progress.completed
                        );

                      return (
                        <label
                          key={
                            item.id
                          }
                        >

                          <input
                            type="checkbox"
                            checked={
                              done
                            }
                            onChange={() =>
                              toggleOnboarding(
                                item.id
                              )
                            }
                          />

                          {
                            item.title
                          }

                        </label>
                      );
                    }
                  )}

                </div>

              </div>

            </section>

          </>
        )}

        {page ===
          'submit' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  Submit Certificate
                </h2>

                <p>
                  Select a required certificate and send it to management for approval.
                </p>

              </div>

            </div>

            <div className="submit-area">

              <form
                className="form"
                onSubmit={
                  submitCertificate
                }
              >

                <label className="full-row">

                  Certificate / Training

                  <select
                    name="requirementId"
                    defaultValue=""
                    required
                  >

                    <option
                      value=""
                      disabled
                    >
                      Select certificate
                    </option>

                    {companyRequirements.map(
                      (
                        requirement
                      ) => (
                        <option
                          key={
                            requirement.id
                          }
                          value={
                            requirement.id
                          }
                        >
                          {
                            requirement.name
                          }
                        </option>
                      )
                    )}

                  </select>

                </label>

                <label>

                  Issue Date

                  <input
                    type="date"
                    name="issueDate"
                    required
                  />

                </label>

                <label>

                  Expiration Date

                  <input
                    type="date"
                    name="expirationDate"
                    required
                  />

                </label>

                <label className="full-row">

                  Upload Certificate

                  <input
                    type="file"
                    name="certificateFile"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    required
                  />

                  <small>
                    PDF, PNG, JPG or WEBP. Maximum file size: 20 MB.
                  </small>

                </label>

                <div className="form-buttons">

                  <button
                    className="main-button"
                    type="submit"
                  >
                    Submit for Review
                  </button>

                </div>

              </form>

            </div>

          </section>
        )}

        {page ===
          'training' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  My Training
                </h2>

                <p>
                  Track assigned training and due dates.
                </p>

              </div>

            </div>

            <div className="simple-list section-pad">

              {employeeTrainings.map(
                (
                  training
                ) => (
                  <div
                    className="simple-row"
                    key={
                      training.id
                    }
                  >

                    <div>

                      <strong>
                        {
                          training.name
                        }
                      </strong>

                      <small>
                        Due{' '}
                        {
                          training.dueDate
                        }
                        {' • '}
                        {
                          training.description
                        }
                      </small>

                    </div>

                    <span
                      className={`training-status ${displayTrainingStatus(
                        training
                      )
                        .toLowerCase()
                        .replace(
                          ' ',
                          '-'
                        )}`}
                    >
                      {
                        displayTrainingStatus(
                          training
                        )
                      }
                    </span>

                    {training.status ===
                      'Not Started' && (
                      <button
                        className="main-button"
                        onClick={() =>
                          changeTrainingStatus(
                            training.id,
                            'In Progress'
                          )
                        }
                      >
                        Start
                      </button>
                    )}

                    {training.status ===
                      'In Progress' && (
                      <button
                        className="main-button"
                        onClick={() =>
                          changeTrainingStatus(
                            training.id,
                            'Submitted'
                          )
                        }
                      >
                        Submit
                      </button>
                    )}

                  </div>
                )
              )}

              {employeeTrainings.length ===
                0 && (
                <div className="empty-cell">
                  No training assignments yet.
                </div>
              )}

            </div>

          </section>
        )}

        {page ===
          'profile' && (
          <section className="panel">

            <div className="panel-heading">

              <div>

                <h2>
                  My Profile
                </h2>

                <p>
                  Keep your contact and emergency information current.
                </p>

              </div>

            </div>

            <form
              className="form profile-form section-pad"
              onSubmit={
                saveOwnProfile
              }
            >

              <label>
                Full Name

                <input
                  value={
                    employee.name
                  }
                  disabled
                />
              </label>

              <label>
                Job Title

                <input
                  value={
                    employee.jobTitle ||
                    ''
                  }
                  disabled
                />
              </label>

              <label>
                Phone

                <input
                  name="phone"
                  defaultValue={
                    employee.phone ||
                    ''
                  }
                />
              </label>

              <label>
                Email

                <input
                  name="email"
                  type="email"
                  defaultValue={
                    employee.email ||
                    ''
                  }
                />
              </label>

              <label className="full-row">

                Address

                <input
                  name="address"
                  defaultValue={
                    employee.address ||
                    ''
                  }
                />
              </label>

              <label>

                Emergency Contact

                <input
                  name="emergencyContactName"
                  defaultValue={
                    employee.emergencyContactName ||
                    ''
                  }
                />

              </label>

              <label>

                Emergency Phone

                <input
                  name="emergencyContactPhone"
                  defaultValue={
                    employee.emergencyContactPhone ||
                    ''
                  }
                />

              </label>

              <label className="full-row">

                Notes

                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={
                    employee.notes ||
                    ''
                  }
                />

              </label>

              <div className="form-buttons">

                <button className="main-button">
                  Save Profile
                </button>

              </div>

            </form>

          </section>
        )}

      </main>

    </div>
  );
}

/* =========================================================
   REQUIREMENT LOOKUP
========================================================= */

function RequirementLookupTable({
  requirement,
  employees,
  certificates,
  requirements,
}: {
  requirement?:
    Requirement;

  employees:
    User[];

  certificates:
    CertificateSubmission[];

  requirements?:
    Requirement[];
}) {
  const rows =
    requirement
      ? employees.map(
          (employee) => ({
            employee,
            requirement,
          })
        )
      : employees.flatMap(
          (employee) =>
            (
              requirements ||
              []
            ).map(
              (
                item
              ) => ({
                employee,

                requirement:
                  item,
              })
            )
        );

  return (
    <div className="table-container">

      <table>

        <thead>

          <tr>

            <th>
              Employee
            </th>

            {!requirement && (
              <th>
                Certificate
              </th>
            )}

            <th>
              Status
            </th>

            <th>
              Expiration
            </th>

            <th>
              Rejection Reason
            </th>

          </tr>

        </thead>

        <tbody>

          {rows.map(
            ({
              employee,
              requirement:
                rowRequirement,
            }) => {
              const certificate =
                latestCertificateFor(
                  employee.id,
                  rowRequirement.id,
                  certificates
                );

              const state =
                requirementState(
                  employee.id,
                  rowRequirement.id,
                  certificates
                );

              return (
                <tr
                  key={`${employee.id}-${rowRequirement.id}`}
                >

                  <td>

                    <strong>
                      {
                        employee.name
                      }
                    </strong>

                  </td>

                  {!requirement && (
                    <td>
                      {
                        rowRequirement.name
                      }
                    </td>
                  )}

                  <td>

                    <RequirementBadge
                      state={
                        state
                      }
                    />

                  </td>

                  <td>

                    {certificate?.expirationDate
                      ? new Date(
                          `${certificate.expirationDate}T00:00:00`
                        ).toLocaleDateString()
                      : '—'}

                  </td>

                  <td>

                    {certificate?.status ===
                    'Rejected'
                      ? certificate.rejectionReason ||
                        'Rejected'
                      : '—'}

                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}

function RequirementBadge({
  state,
}: {
  state:
    RequirementState;
}) {
  return (
    <span
      className={`requirement-badge ${state
        .toLowerCase()
        .replace(
          ' ',
          '-'
        )}`}
    >
      {state}
    </span>
  );
}

/* =========================================================
   MANAGEMENT CERTIFICATE TABLE
========================================================= */

function ManagerCertificateTable({
  certificates,
  employeeName,
  changeStatus,
}: {
  certificates:
    CertificateSubmission[];

  employeeName: (
    employeeId: string
  ) => string;

  changeStatus: (
    certificateId: string,

    status:
      | 'Approved'
      | 'Rejected'
  ) => void;
}) {
  async function openFile(
    fileKey: string
  ) {
    const file =
      await getCertificateFile(
        fileKey
      );

    if (!file) {
      alert(
        'The certificate file could not be found.'
      );

      return;
    }

    const url =
      URL.createObjectURL(
        file
      );

    window.open(
      url,
      '_blank'
    );

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      60000
    );
  }

  if (
    certificates.length ===
    0
  ) {
    return (
      <div className="empty-cell">
        No certificates found.
      </div>
    );
  }

  return (
    <div className="table-container">

      <table>

        <thead>

          <tr>

            <th>
              Employee
            </th>

            <th>
              Certificate
            </th>

            <th>
              Expiration
            </th>

            <th>
              Warning
            </th>

            <th>
              Approval
            </th>

            <th>
              File
            </th>

          </tr>

        </thead>

        <tbody>

          {certificates.map(
            (
              certificate
            ) => {
              const expiration =
                expirationStatus(
                  certificate.expirationDate
                );

              return (
                <tr
                  key={
                    certificate.id
                  }
                >

                  <td>

                    <strong>
                      {employeeName(
                        certificate.employeeId
                      )}
                    </strong>

                  </td>

                  <td>

                    <strong>
                      {
                        certificate.certificateName
                      }
                    </strong>

                  </td>

                  <td>
                    {new Date(
                      `${certificate.expirationDate}T00:00:00`
                    ).toLocaleDateString()}
                  </td>

                  <td>

                    <span
                      className={
                        expiration.className
                      }
                    >
                      {
                        expiration.label
                      }
                    </span>

                  </td>

                  <td>

                    {certificate.status ===
                    'Pending' ? (
                      <div className="review-buttons">

                        <button
                          className="approve-button"
                          onClick={() =>
                            changeStatus(
                              certificate.id,
                              'Approved'
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="reject-button"
                          onClick={() =>
                            changeStatus(
                              certificate.id,
                              'Rejected'
                            )
                          }
                        >
                          Reject
                        </button>

                      </div>
                    ) : (
                      <SubmissionStatus
                        status={
                          certificate.status
                        }
                      />
                    )}

                  </td>

                  <td>

                    <button
                      className="view-file-button"
                      onClick={() =>
                        openFile(
                          certificate.fileKey
                        )
                      }
                    >
                      View
                    </button>

                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}

/* =========================================================
   EMPLOYEE PROFILE DRAWER
========================================================= */

function EmployeeProfilePanel({
  employee,
  requirements,
  certificates,
  locations,
  trainings,
  history,
  onClose,
  onSave,
}: {
  employee:
    User;

  requirements:
    Requirement[];

  certificates:
    CertificateSubmission[];

  locations:
    Location[];

  trainings:
    TrainingAssignment[];

  history:
    CertificateHistory[];

  onClose:
    () => void;

  onSave: (
    event:
      FormEvent<HTMLFormElement>
  ) => void;
}) {
  const compliance =
    complianceForEmployee(
      employee.id,
      requirements,
      certificates
    );

  return (
    <div
      className="profile-overlay"
      onMouseDown={
        onClose
      }
    >

      <div
        className="profile-drawer"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <div className="profile-drawer-header">

          <div>

            <p className="eyebrow">
              EMPLOYEE PROFILE
            </p>

            <h2>
              {
                employee.name
              }
            </h2>

            <span>
              {
                compliance
              }
              % compliant
            </span>

          </div>

          <button
            className="drawer-close"
            onClick={
              onClose
            }
          >
            ×
          </button>

        </div>

        <form
          className="form profile-form"
          onSubmit={
            onSave
          }
        >

          <label>
            Full Name

            <input
              name="name"
              defaultValue={
                employee.name
              }
              required
            />
          </label>

          <label>
            Job Title

            <input
              name="jobTitle"
              defaultValue={
                employee.jobTitle ||
                ''
              }
            />
          </label>

          <label>
            Phone

            <input
              name="phone"
              defaultValue={
                employee.phone ||
                ''
              }
            />
          </label>

          <label>
            Email

            <input
              type="email"
              name="email"
              defaultValue={
                employee.email ||
                ''
              }
            />
          </label>

          <label className="full-row">
            Address

            <input
              name="address"
              defaultValue={
                employee.address ||
                ''
              }
            />
          </label>

          <label>
            Emergency Contact

            <input
              name="emergencyContactName"
              defaultValue={
                employee.emergencyContactName ||
                ''
              }
            />
          </label>

          <label>
            Emergency Phone

            <input
              name="emergencyContactPhone"
              defaultValue={
                employee.emergencyContactPhone ||
                ''
              }
            />
          </label>

          <label>
            Hire Date

            <input
              type="date"
              name="hireDate"
              defaultValue={
                employee.hireDate ||
                ''
              }
            />
          </label>

          <label>
            Location

            <select
              name="locationId"
              defaultValue={
                employee.locationId ||
                ''
              }
            >

              <option value="">
                Unassigned
              </option>

              {locations.map(
                (
                  location
                ) => (
                  <option
                    key={
                      location.id
                    }
                    value={
                      location.id
                    }
                  >
                    {
                      location.name
                    }
                  </option>
                )
              )}

            </select>

          </label>

          <label>
            Employment Status

            <select
              name="employmentStatus"
              defaultValue={
                employee.employmentStatus ||
                'Active'
              }
            >

              {([
                'Active',
                'Inactive',
                'On Leave',
                'Terminated',
              ] as EmploymentStatus[]).map(
                (
                  status
                ) => (
                  <option
                    key={
                      status
                    }
                  >
                    {
                      status
                    }
                  </option>
                )
              )}

            </select>

          </label>

          <label>
            Supervisor

            <input
              name="supervisor"
              defaultValue={
                employee.supervisor ||
                ''
              }
            />
          </label>

          <label className="full-row">
            Notes

            <textarea
              name="notes"
              rows={4}
              defaultValue={
                employee.notes ||
                ''
              }
            />
          </label>

          <div className="form-buttons">

            <button className="main-button">
              Save Profile
            </button>

          </div>

        </form>

        <div className="drawer-section">

          <h3>
            Certificate Compliance
          </h3>

          <RequirementLookupTable
            employees={[
              employee,
            ]}
            certificates={
              certificates
            }
            requirements={
              requirements
            }
          />

        </div>

        <div className="drawer-section">

          <h3>
            Training
          </h3>

          {trainings.map(
            (
              training
            ) => (
              <div
                className="simple-row"
                key={
                  training.id
                }
              >

                <div>

                  <strong>
                    {
                      training.name
                    }
                  </strong>

                  <small>
                    Due{' '}
                    {
                      training.dueDate
                    }
                  </small>

                </div>

                <span>
                  {displayTrainingStatus(
                    training
                  )}
                </span>

              </div>
            )
          )}

        </div>

        <div className="drawer-section">

          <h3>
            Certificate History
          </h3>

          {history.length ? (
            [...history]
              .sort(
                (
                  a,
                  b
                ) =>
                  b.at.localeCompare(
                    a.at
                  )
              )
              .map(
                (
                  item
                ) => (
                  <div
                    className="history-row"
                    key={
                      item.id
                    }
                  >

                    <strong>
                      {
                        item.action
                      }
                    </strong>

                    <span>
                      {new Date(
                        item.at
                      ).toLocaleString()}
                    </span>

                    {item.note && (
                      <small>
                        {
                          item.note
                        }
                      </small>
                    )}

                  </div>
                )
              )
          ) : (
            <p className="muted">
              No history yet.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function NotificationBell({
  notifications,
  open,
  setOpen,
}: {
  notifications:
    NotificationItem[];

  open:
    boolean;

  setOpen: (
    open: boolean
  ) => void;
}) {
  return (
    <div className="notification-wrap">

      <button
        className="notification-bell"
        onClick={() =>
          setOpen(
            !open
          )
        }
        aria-label="Notifications"
      >
        🔔

        {notifications.length >
          0 && (
          <span>
            {
              notifications.length
            }
          </span>
        )}

      </button>

      {open && (
        <div className="notification-popover">

          <div className="notification-title">

            <strong>
              Notifications
            </strong>

            <small>
              {
                notifications.length
              }
            </small>

          </div>

          {notifications.length ===
          0 ? (
            <p className="muted">
              You're all caught up.
            </p>
          ) : (
            notifications
              .slice(
                0,
                20
              )
              .map(
                (
                  notification
                ) => (
                  <div
                    className={`notification-item ${notification.tone}`}
                    key={
                      notification.id
                    }
                  >
                    {
                      notification.text
                    }
                  </div>
                )
              )
          )}

        </div>
      )}

    </div>
  );
}

function SubmissionStatus({
  status,
}: {
  status:
    CertificateApproval;
}) {
  return (
    <span
      className={`submission-status ${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  title,
  number,
  subtitle,
}: {
  title:
    string;

  number:
    number | string;

  subtitle:
    string;
}) {
  return (
    <div className="stat-card">

      <p>
        {title}
      </p>

      <strong>
        {number}
      </strong>

      <span>
        {subtitle}
      </span>

    </div>
  );
}

function ProgressBar({
  percent,
}: {
  percent:
    number;
}) {
  return (
    <div className="progress-track">

      <div
        className="progress-fill"
        style={{
          width:
            `${Math.max(
              0,
              Math.min(
                100,
                percent
              )
            )}%`,
        }}
      />

    </div>
  );
}

function pageTitle(
  page:
    ManagerPage
) {
  const titles:
    Record<
      ManagerPage,
      string
    > = {
    dashboard:
      'Dashboard',

    employees:
      'Employees',

    certificates:
      'Certificate Lookup',

    reviews:
      'Certificate Reviews',

    requirements:
      'Required Certificates',

    training:
      'Training',

    onboarding:
      'Onboarding',

    locations:
      'Locations',

    reports:
      'Reports',
  };

  return titles[
    page
  ];
}

function Brand() {
  return (
    <div className="brand-inline">

      <div className="brand-icon">
        C
      </div>

      <div>

        <div className="brand-word">

          <span>
            Cert
          </span>

          <b>
            Cue
          </b>

        </div>

        <small>
          Compliance Manager
        </small>

      </div>

    </div>
  );
}