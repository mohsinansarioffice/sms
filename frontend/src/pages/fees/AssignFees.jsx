import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useFeeStore from '../../store/feeStore';
import useAcademicStore from '../../store/academicStore';
import useAuthStore from '../../store/authStore';
import BrandLogo from '../../components/common/BrandLogo';
import axios from '../../lib/axios';

const AssignFees = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assignFees, isLoading } = useFeeStore();
  const { classes, sections, academicYears, fetchClasses, fetchSections, fetchAcademicYears } = useAcademicStore();

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchSections();
    fetchAcademicYears();
  }, [fetchClasses, fetchSections, fetchAcademicYears]);

  const filteredSections = sections.filter(s => (s.classId?._id || s.classId) === selectedClass);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    const load = async () => {
      setIsStudentsLoading(true);
      try {
        const selectedClassObj = classes.find(c => c._id === selectedClass);
        const params = new URLSearchParams({ limit: 100, status: 'active' });
        if (selectedClassObj) params.append('class', selectedClassObj.name);
        if (selectedSection) {
          const sec = sections.find(s => s._id === selectedSection);
          if (sec) params.append('section', sec.name);
        }
        const res = await axios.get(`/students?${params.toString()}`);
        setStudents(res.data?.students || []);
        setSelectedStudents([]);
      } catch {
        toast.error('Failed to load students');
      } finally {
        setIsStudentsLoading(false);
      }
    };
    load();
  }, [selectedClass, selectedSection]);

  const toggleStudent = (id) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedStudents(prev => prev.length === students.length ? [] : students.map(s => s._id));
  };

  const handleAssign = async () => {
    if (!selectedClass || !selectedYear) return toast.error('Please select class and academic year');
    if (selectedStudents.length === 0) return toast.error('Please select at least one student');

    const res = await assignFees({ classId: selectedClass, academicYearId: selectedYear, studentIds: selectedStudents });
    if (res.success) {
      toast.success('Fees assigned successfully');
      navigate('/fees/students');
    } else {
      toast.error(res.error || 'Failed to assign fees');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 sm:gap-4 min-w-0">
          <BrandLogo linkTo="/dashboard" />
          <Link to="/fees/students" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
            <p className="text-xs text-gray-500">Assign Fees to Students</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Assign Fees</h2>

        {/* Filters */}
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
            <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              <option value="">Select Year</option>
              {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select className="input-field" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
            <select className="input-field" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              <option value="">All Sections</option>
              {filteredSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Students List */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4" /> Students
              {students.length > 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{students.length} found</span>}
            </h3>
            {students.length > 0 && (
              <button onClick={toggleAll} className="text-sm text-primary-600 font-medium hover:underline">
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {isStudentsLoading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto" /></div>
          ) : !selectedClass ? (
            <div className="p-12 text-center text-gray-400">Select a class to see students</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No active students found in this class</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {students.map(student => (
                <label key={student._id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedStudents.includes(student._id)} onChange={() => toggleStudent(student._id)}
                    className="w-4 h-4 text-primary-600 rounded" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.personalInfo?.firstName} {student.personalInfo?.lastName}</p>
                    <p className="text-xs text-gray-500">Adm: {student.admissionNumber}</p>
                  </div>
                  {selectedStudents.includes(student._id) && <CheckCircle className="w-4 h-4 text-green-500" />}
                </label>
              ))}
            </div>
          )}

          {selectedStudents.length > 0 && (
            <div className="px-6 py-4 bg-primary-50 border-t flex items-center justify-between">
              <p className="text-sm font-medium text-primary-700">{selectedStudents.length} student(s) selected</p>
              <button onClick={handleAssign} disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Assign Fees
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignFees;
