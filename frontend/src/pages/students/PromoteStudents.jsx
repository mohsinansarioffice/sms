import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAcademicStore from '../../store/academicStore';
import useStudentStore from '../../store/studentStore';
import BrandLogo from '../../components/common/BrandLogo';

const PromoteStudents = () => {
  const { classes, sections, academicYears, fetchClasses, fetchSections, fetchAcademicYears } = useAcademicStore();
  const { students, fetchStudents, promoteStudents, isLoading } = useStudentStore();

  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [keepSameSection, setKeepSameSection] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (fromClassId) {
      fetchSections(fromClassId);
      fetchStudents(1);
    }
  }, [fromClassId]);

  useEffect(() => {
    if (academicYears.length && !academicYearId) {
      const current = academicYears.find((item) => item.isCurrent);
      setAcademicYearId(current?._id || academicYears[0]?._id || '');
    }
  }, [academicYears, academicYearId]);

  const eligibleStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          String(student.academicInfo?.classId?._id || student.academicInfo?.classId) === String(fromClassId)
      ),
    [students, fromClassId]
  );

  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) => (prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]));
  };

  const handlePromote = async () => {
    const result = await promoteStudents({
      fromClassId,
      toClassId,
      toSectionId: toSectionId || undefined,
      studentIds: selectedStudentIds,
      academicYearId,
      keepSameSection,
    });
    if (result.success) {
      toast.success(result.data?.message || 'Students promoted successfully');
      setSelectedStudentIds([]);
      return;
    }
    toast.error(result.error || 'Failed to promote students');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
            <BrandLogo linkTo="/dashboard" />
            <Link to="/students" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2 text-sm sm:text-base min-w-0 max-w-full">
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span className="truncate">Back to Students</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Promote Students
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">From Class</label>
              <select className="input-field" value={fromClassId} onChange={(e) => setFromClassId(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">To Class</label>
              <select className="input-field" value={toClassId} onChange={(e) => setToClassId(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">To Section</label>
              <select className="input-field" value={toSectionId} onChange={(e) => setToSectionId(e.target.value)} disabled={keepSameSection}>
                <option value="">No Section</option>
                {sections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
              <select className="input-field" value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
                <option value="">Select Year</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 mt-4 text-sm text-gray-700">
            <input type="checkbox" checked={keepSameSection} onChange={(e) => setKeepSameSection(e.target.checked)} />
            Keep same section for promoted students
          </label>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Students ({selectedStudentIds.length})</h3>
            <button
              className="btn-primary inline-flex items-center gap-2"
              disabled={isLoading || !fromClassId || !toClassId || selectedStudentIds.length === 0}
              onClick={handlePromote}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Promote Selected
            </button>
          </div>

          {!eligibleStudents.length ? (
            <p className="text-gray-500 text-sm py-8 text-center">No students found for selected source class.</p>
          ) : (
            <div className="space-y-2">
              {eligibleStudents.map((student) => (
                <label key={student._id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <div className="inline-flex items-center gap-3">
                    <input type="checkbox" checked={selectedStudentIds.includes(student._id)} onChange={() => toggleStudent(student._id)} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {student.academicInfo?.classId?.name || student.academicInfo?.class} {student.academicInfo?.sectionId?.name || student.academicInfo?.section}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoteStudents;
