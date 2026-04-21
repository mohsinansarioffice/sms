const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      maxStudents: 50,
      maxTeachers: 3
    },
    features: {
      attendance: true,
      studentManagement: true,
      teacherManagement: true,
      academicSettings: true,
      csvImport: false,
      reportsExport: false,
      fees: false,
      exams: false,
      communication: false,
      timetable: false,
      events: false,
      leaves: true,
      payroll: false,
      diary: false
    }
  },
  basic: {
    name: 'Basic',
    price: 9,
    limits: {
      maxStudents: 200,
      maxTeachers: 15
    },
    features: {
      attendance: true,
      studentManagement: true,
      teacherManagement: true,
      academicSettings: true,
      csvImport: false,
      reportsExport: false,
      fees: true,
      exams: true,
      communication: false,
      timetable: false,
      events: false,
      leaves: true,
      payroll: false,
      diary: false
    }
  },
  premium: {
    name: 'Premium',
    price: 29,
    limits: {
      maxStudents: 999999,
      maxTeachers: 999999
    },
    features: {
      attendance: true,
      studentManagement: true,
      teacherManagement: true,
      academicSettings: true,
      csvImport: true,
      reportsExport: true,
      fees: true,
      exams: true,
      communication: true,
      timetable: true,
      events: true,
      leaves: true,
      payroll: true,
      diary: true
    }
  }
};

module.exports = PLANS;
