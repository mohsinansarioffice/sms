import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Users, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useExamStore from '../../store/examStore';
import axios from '../../lib/axios';

const ExamResults = () => {
  const { id } = useParams();
  const { fetchExamResults, enterMarks, currentExam, examResults, isLoading } = useExamStore();
  
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  useEffect(() => {
    fetchExamResults(id);
  }, [id, fetchExamResults]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!currentExam) return;
      setIsStudentsLoading(true);
      try {
        const params = new URLSearchParams({ limit: 100, status: 'active' });
        if (currentExam.classId?.name) params.append('class', currentExam.classId.name);
        if (currentExam.sectionId?.name) params.append('section', currentExam.sectionId.name);
        
        const response = await axios.get(`/students?${params}`);
        const fetchedStudents = response?.data?.students || [];
        setStudents(Array.isArray(fetchedStudents) ? fetchedStudents : fetchedStudents.students || []);
      } catch (error) {
        toast.error('Failed to load students');
      } finally {
        setIsStudentsLoading(false);
      }
    };
    if (currentExam) loadStudents();
  }, [currentExam]);

  useEffect(() => {
    if (students.length > 0 && currentExam) {
      const initialData = {};
      students.forEach(student => {
        const existingResult = examResults.find(r => (r.studentId?._id || r.studentId) === student._id);
        if (existingResult) {
          initialData[student._id] = {
            marksObtained: existingResult.marksObtained,
            isAbsent: existingResult.isAbsent,
            remarks: existingResult.remarks || ''
          };
        } else {
          initialData[student._id] = {
            marksObtained: '',
            isAbsent: false,
            remarks: ''
          };
        }
      });
      setMarksData(initialData);
    }
  }, [students, examResults, currentExam]);

  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const onSubmit = async () => {
    const resultsPayload = Object.entries(marksData).map(([studentId, data]) => {
      return {
        studentId,
        marksObtained: data.isAbsent ? 0 : Number(data.marksObtained),
        isAbsent: data.isAbsent,
        remarks: data.remarks
      };
    });

    const res = await enterMarks(id, resultsPayload);
    if (res.success) {
      toast.success('Marks saved successfully');
    } else {
      toast.error(res.error || 'Failed to save marks');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/exams" className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back to Exams
          </Link>
          <div className="text-right">
            <h1 className="text-lg font-bold text-gray-900">{currentExam?.name || 'Enter Marks'}</h1>
            {currentExam && (
              <p className="text-xs text-gray-500">
                {currentExam.classId?.name} {currentExam.sectionId ? `- ${currentExam.sectionId.name}` : ''} | {currentExam.subjectId?.name} | Max: {currentExam.totalMarks} | Pass: {currentExam.passingMarks}
              </p>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card p-0 overflow-hidden shadow-sm">
          {isStudentsLoading || isLoading ? (
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const data = marksData[student._id] || { marksObtained: '', isAbsent: false, remarks: '' };
                    return (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {student.academicInfo?.rollNumber || student.admissionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">
                              {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                              checked={data.isAbsent}
                              onChange={(e) => handleMarkChange(student._id, 'isAbsent', e.target.checked)}
                            />
                            <span className={`text-sm font-medium ${data.isAbsent ? 'text-red-600' : 'text-gray-500'}`}>Absent</span>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            min="0"
                            max={currentExam?.totalMarks}
                            disabled={data.isAbsent}
                            className={`w-24 px-3 py-1.5 border rounded text-sm text-center focus:ring-1 focus:ring-primary-500 outline-none ${data.isAbsent ? 'bg-gray-100 text-gray-400' : 'border-gray-300'}`}
                            placeholder="/"
                            value={data.marksObtained}
                            onChange={(e) => handleMarkChange(student._id, 'marksObtained', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                            placeholder="Optional"
                            value={data.remarks}
                            onChange={(e) => handleMarkChange(student._id, 'remarks', e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">Entering marks for {students.length} students</span>
                <button 
                  onClick={onSubmit}
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Marks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
