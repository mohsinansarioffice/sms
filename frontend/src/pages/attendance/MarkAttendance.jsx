import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { format, isFuture, parseISO } from 'date-fns';
import { 
  Calendar, CheckCircle, XCircle, Clock, AlertCircle, 
  Save, Loader2, Users, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAttendanceStore from '../../store/attendanceStore';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';
import axios from '../../lib/axios';
import DataTable from '../../components/common/DataTable';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';
import { createColumnHelper } from '@tanstack/react-table';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    attendanceRecords,
    isLoading: isSubmitting,
    fetchAttendance,
    markAttendance,
    updateAttendance
  } = useAttendanceStore();

  const {
    classes: academicClasses,
    sections: academicSections,
    fetchClasses,
    fetchSections
  } = useAcademicStore();
  
  const [students, setStudents] = useState([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [existingRecord, setExistingRecord] = useState(null);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});

  // const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  // const sections = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, []);

  // Check for existing attendance when date/class/section changes
  useEffect(() => {
    const checkExisting = async () => {
      if (!selectedDate || !selectedClass) return;
      
      await fetchAttendance({ 
        date: selectedDate, 
        classId: selectedClass,
        sectionId: selectedSection || ''
      });
    };
    checkExisting();
  }, [selectedDate, selectedClass, selectedSection, fetchAttendance]);

  // Update existing record state
  useEffect(() => {
    if (attendanceRecords && attendanceRecords.length > 0) {
      setExistingRecord(attendanceRecords[0]);
    } else {
      setExistingRecord(null);
    }
  }, [attendanceRecords]);

  // Handle loading students
  const loadStudents = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    
    // Check if future date
    if (isFuture(parseISO(selectedDate))) {
      toast.error('Cannot mark attendance for future dates');
      return;
    }

    setIsStudentsLoading(true);
    setStudentsLoaded(false);

    try {
      const classObj = academicClasses.find((c) => c._id === selectedClass);
      const sectionObj = academicSections.find((s) => s._id === selectedSection);

      const params = new URLSearchParams({ 
        limit: 100, 
        status: 'active', 
      });

      // Students API filters by academicInfo.class/section (strings), not IDs
      if (classObj?.name) params.append('class', classObj.name);
      if (sectionObj?.name) params.append('section', sectionObj.name);

      const response = await axios.get(`/students?${params}`);
      const fetchedStudents = response?.data?.students || [];
      
      setStudents(Array.isArray(fetchedStudents) ? fetchedStudents : fetchedStudents.students || []);
      setStudentsLoaded(true);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setIsStudentsLoading(false);
    }
  };

  // Initialize attendance data when students are loaded or existing record found
  useEffect(() => {
    if (studentsLoaded && students.length > 0) {
      const initialData = {};
      
      students.forEach(student => {
        // If editing existing record, find their status
        if (existingRecord) {
          const record = existingRecord.records.find(r => 
            (r.studentId._id || r.studentId) === student._id
          );
          initialData[student._id] = {
            status: record ? record.status : 'present',
            remarks: record ? record.remarks || '' : ''
          };
        } else {
          // Default to present for new records
          initialData[student._id] = {
            status: 'present',
            remarks: ''
          };
        }
      });
      
      setAttendanceData(initialData);
    }
  }, [studentsLoaded, students, existingRecord]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const markAll = (status) => {
    const newData = {};
    Object.keys(attendanceData).forEach(id => {
      newData[id] = { ...attendanceData[id], status };
    });
    setAttendanceData(newData);
  };

  const onSubmit = async () => {
    if (Object.keys(attendanceData).length === 0) {
      toast.error('No students to mark');
      return;
    }

    const payload = {
      date: selectedDate,
      classId: selectedClass,
      sectionId: selectedSection,
      records: Object.entries(attendanceData).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks
      }))
    };

    let result;
    if (existingRecord) {
      result = await updateAttendance(existingRecord._id, payload);
    } else {
      result = await markAttendance(payload);
    }

    if (result && result.success) {
      toast.success(`Attendance ${existingRecord ? 'updated' : 'marked'} successfully`);
      navigate('/attendance/list');
    } else {
      toast.error(result?.error || 'Failed to save attendance');
    }
  };

  const enrichedStudents = useMemo(() => {
    return students.map(student => ({
      ...student,
      attendanceData: attendanceData[student._id] || { status: 'present', remarks: '' }
    }));
  }, [students, attendanceData]);

  const columnHelper = createColumnHelper();

  const markColumns = useMemo(() => [
    columnHelper.accessor(row => row.academicInfo?.rollNumber || row.admissionNumber, {
      id: 'rollNo',
      header: 'Roll/Adm No',
      cell: info => <span className="text-sm text-gray-500 font-mono">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row, {
      id: 'studentInfo',
      header: 'Student',
      cell: info => {
        const student = info.getValue();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-medium text-xs">
                {student.personalInfo?.firstName?.[0] || ''}{student.personalInfo?.lastName?.[0] || ''}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {student.personalInfo?.firstName} {student.personalInfo?.lastName}
            </span>
          </div>
        )
      }
    }),
    columnHelper.accessor('attendanceData.status', {
      header: () => <div className="min-w-[300px]">Status</div>,
      cell: info => {
        const status = info.getValue();
        const studentId = info.row.original._id;
        return (
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <label className={`cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${status === 'present' ? 'bg-white shadow-sm text-green-700' : 'text-gray-600 hover:bg-gray-200'}`}>
              <input type="radio" className="hidden" name={`status-${studentId}`} checked={status === 'present'} onChange={() => handleStatusChange(studentId, 'present')} />
              <CheckCircle className={`w-4 h-4 ${status === 'present' ? 'text-green-600' : 'text-gray-400'}`} /> Present
            </label>
            <label className={`cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${status === 'absent' ? 'bg-white shadow-sm text-red-700' : 'text-gray-600 hover:bg-gray-200'}`}>
              <input type="radio" className="hidden" name={`status-${studentId}`} checked={status === 'absent'} onChange={() => handleStatusChange(studentId, 'absent')} />
              <XCircle className={`w-4 h-4 ${status === 'absent' ? 'text-red-500' : 'text-gray-400'}`} /> Absent
            </label>
            <label className={`cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${status === 'late' ? 'bg-white shadow-sm text-yellow-700' : 'text-gray-600 hover:bg-gray-200'}`}>
              <input type="radio" className="hidden" name={`status-${studentId}`} checked={status === 'late'} onChange={() => handleStatusChange(studentId, 'late')} />
              <Clock className={`w-4 h-4 ${status === 'late' ? 'text-yellow-600' : 'text-gray-400'}`} /> Late
            </label>
            <label className={`cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${status === 'excused' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}>
              <input type="radio" className="hidden" name={`status-${studentId}`} checked={status === 'excused'} onChange={() => handleStatusChange(studentId, 'excused')} />
              <Info className={`w-4 h-4 ${status === 'excused' ? 'text-blue-500' : 'text-gray-400'}`} /> Excused
            </label>
          </div>
        )
      }
    }),
    columnHelper.accessor('attendanceData.remarks', {
      header: () => <div className="w-1/4">Remarks (Optional)</div>,
      cell: info => {
        const remarks = info.getValue() || '';
        const studentId = info.row.original._id;
        return (
          <input
            type="text"
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 outline-none"
            placeholder="Reason (if any)"
            value={remarks}
            onChange={(e) => handleRemarksChange(studentId, e.target.value)}
          />
        )
      }
    })
  ], []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/dashboard"
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Mark attendance"
        />
      </AppHeader>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
          <p className="text-gray-500 text-sm mt-0.5">Record daily attendance for students</p>
        </div>

        {/* Filters Card */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  className="input-field pl-10"
                  value={selectedDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setStudentsLoaded(false);
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setStudentsLoaded(false);
                }}
              >
                <option value="">Select Class</option>
                {academicClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section (Optional)</label>
              <select
                className="input-field"
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setStudentsLoaded(false);
                }}
              >
                <option value="">All</option>
                {academicSections
                  .filter(s => (s.classId?._id || s.classId) === selectedClass)
                  .map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            
            <button 
              onClick={loadStudents}
              disabled={!selectedClass}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Load Students
            </button>
          </div>

          {existingRecord && !studentsLoaded && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Attendance already marked</p>
                <p className="text-sm">Attendance for this class on {format(parseISO(selectedDate), 'MMM d, yyyy')} was marked by {existingRecord.markedBy?.profile?.name || 'someone'}. Loading students will let you edit it.</p>
              </div>
            </div>
          )}
        </div>

        {/* Student List */}
        {studentsLoaded && (
          <div className="card p-0 overflow-hidden border-t-0 shadow-md">
            <div className="bg-gray-50 border-b px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Class {selectedClass}{selectedSection ? `-${selectedSection}` : ''} 
                  <span className="text-gray-500 font-normal ml-2">({students.length} students)</span>
                </h3>
                {existingRecord && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                    Editing existing record
                  </span>
                )}
              </div>
              
              {students.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => markAll('present')} className="text-sm btn-secondary bg-white border border-gray-200 py-1.5 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" /> All Present
                  </button>
                  <button onClick={() => markAll('absent')} className="text-sm btn-secondary bg-white border border-gray-200 py-1.5 flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-500" /> All Absent
                  </button>
                </div>
              )}
            </div>

            {isStudentsLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
                <p className="text-gray-500">Loading student roster...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No active students found in this class/section.</p>
              </div>
            ) : (
              <div>
                <DataTable
                  columns={markColumns}
                  data={enrichedStudents}
                  searchable={true}
                  placeholder="Search students..."
                  hidePagination={true}
                />
                
                <div className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Marking {Object.keys(attendanceData).length} students
                  </div>
                  <button 
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-5 h-5" /> Save Attendance</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
