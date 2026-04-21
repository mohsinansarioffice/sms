import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Calendar, BookOpen, Users,
  GraduationCap, ArrowLeft, Loader2, X, FileText
} from 'lucide-react';
import useAcademicStore from '../../store/academicStore';
import useTeacherStore from '../../store/teacherStore';
import useExamStore from '../../store/examStore';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DataTable from '../../components/common/DataTable';
import { createColumnHelper } from '@tanstack/react-table';

const TABS = [
  { id: 'years',    label: 'Academic Years', icon: Calendar },
  { id: 'classes',  label: 'Classes',        icon: BookOpen },
  { id: 'sections', label: 'Sections',       icon: Users },
  { id: 'subjects', label: 'Subjects',       icon: GraduationCap },
  { id: 'examTypes', label: 'Exam Types',      icon: FileText },
];

const AcademicSettings = () => {
  const [activeTab, setActiveTab] = useState('years');
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const {
    academicYears, classes, sections, subjects,
    fetchAcademicYears, fetchClasses, fetchSections, fetchSubjects,
    createAcademicYear, updateAcademicYear, deleteAcademicYear,
    createClass, updateClass, deleteClass,
    createSection, updateSection, deleteSection,
    createSubject, updateSubject, deleteSubject,
    isLoading, isFetching
  } = useAcademicStore();

  const { teachers, fetchTeachers } = useTeacherStore();
  const { examTypes, fetchExamTypes, createExamType, updateExamType, deleteExamType } = useExamStore();
  const { user } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  const columnHelper = createColumnHelper();

  const yearColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('startDate', {
      header: 'Start Date',
      cell: info => <span className="text-gray-500">{format(new Date(info.getValue()), 'MMM dd, yyyy')}</span>,
    }),
    columnHelper.accessor('endDate', {
      header: 'End Date',
      cell: info => <span className="text-gray-500">{format(new Date(info.getValue()), 'MMM dd, yyyy')}</span>,
    }),
    columnHelper.accessor('isCurrent', {
      header: 'Status',
      cell: info => info.getValue() ? (
        <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Current</span>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right w-full">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openForm(props.row.original)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(props.row.original._id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    })
  ], []);

  const classColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Class Name',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('displayOrder', {
      header: 'Order',
      cell: info => <span className="text-gray-500">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right w-full">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openForm(props.row.original)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(props.row.original._id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    })
  ], []);

  const sectionColumns = useMemo(() => [
    columnHelper.accessor(row => row.classId?.name, {
      id: 'class',
      header: 'Class',
      cell: info => <span className="text-gray-900">{info.getValue() || 'N/A'}</span>,
    }),
    columnHelper.accessor('name', {
      header: 'Section',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor(row => row.classTeacher, {
      id: 'classTeacher',
      header: 'Class Teacher',
      cell: info => {
        const teacher = info.getValue();
        return (
          <span className="text-gray-500">
            {teacher
              ? `${teacher.personalInfo?.firstName || ''} ${teacher.personalInfo?.lastName || ''}`.trim()
              : <span className="text-gray-300">Not assigned</span>}
          </span>
        );
      },
    }),
    columnHelper.accessor('capacity', {
      header: 'Capacity',
      cell: info => <span className="text-gray-500">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right w-full">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openForm(props.row.original)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(props.row.original._id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    })
  ], []);

  const subjectColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Subject',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('code', {
      header: 'Code',
      cell: info => <span className="text-gray-500">{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor('classes', {
      header: 'Classes',
      cell: info => {
        const classes = info.getValue();
        return (
          <span className="text-gray-500">
            {classes?.length > 0
              ? <div className="flex flex-wrap gap-1">{classes.map(c => (
                  <span key={c._id} className="px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded-full">{c.name}</span>
                ))}</div>
              : <span className="text-gray-300">None</span>}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right w-full">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openForm(props.row.original)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(props.row.original._id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    })
  ], []);

  const examTypeColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Exam Type',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => <span className="text-gray-500">{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor('weightage', {
      header: 'Weightage (%)',
      cell: info => <span className="text-gray-500">{info.getValue()}%</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right w-full">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openForm(props.row.original)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(props.row.original._id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    })
  ], []);

  const getColumns = () => {
    switch (activeTab) {
      case 'years': return yearColumns;
      case 'classes': return classColumns;
      case 'sections': return sectionColumns;
      case 'subjects': return subjectColumns;
      case 'examTypes': return examTypeColumns;
      default: return classColumns;
    }
  };

  useEffect(() => {
    fetchAcademicYears();
    fetchClasses();
    fetchSections();
    fetchSubjects();
    fetchTeachers(1);
    fetchExamTypes();
  }, []);

  const openForm = (item = null) => {
    setEditingItem(item);
    setShowForm(true);

    if (!item) {
      reset({});
      return;
    }

    // Populate form based on tab
    if (activeTab === 'years') {
      reset({
        name: item.name,
        startDate: format(new Date(item.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(item.endDate), 'yyyy-MM-dd'),
        isCurrent: item.isCurrent
      });
    } else if (activeTab === 'classes') {
      reset({ name: item.name, displayOrder: item.displayOrder });
    } else if (activeTab === 'sections') {
      reset({
        classId: item.classId?._id || item.classId,
        name: item.name,
        classTeacher: item.classTeacher?._id || '',
        capacity: item.capacity
      });
    } else if (activeTab === 'subjects') {
      reset({
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        classes: item.classes?.map(c => c._id) || []
      });
    } else if (activeTab === 'examTypes') {
      reset({
        name: item.name,
        description: item.description || '',
        weightage: item.weightage || 0
      });
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    reset({});
  };

  const onSubmit = async (data) => {
    let result;

    switch (activeTab) {
      case 'years':
        result = editingItem
          ? await updateAcademicYear(editingItem._id, data)
          : await createAcademicYear(data);
        break;
      case 'classes':
        result = editingItem
          ? await updateClass(editingItem._id, data)
          : await createClass(data);
        break;
      case 'sections':
        // Clean empty classTeacher
        if (!data.classTeacher) delete data.classTeacher;
        result = editingItem
          ? await updateSection(editingItem._id, data)
          : await createSection(data);
        break;
      case 'subjects':
        // Ensure classes is an array
        if (!data.classes) data.classes = [];
        if (typeof data.classes === 'string') data.classes = [data.classes];
        result = editingItem
          ? await updateSubject(editingItem._id, data)
          : await createSubject(data);
        break;
      case 'examTypes':
        result = editingItem
          ? await updateExamType(editingItem._id, data)
          : await createExamType(data);
        break;
    }

    if (result?.success) {
      toast.success(editingItem ? 'Updated successfully!' : 'Created successfully!');
      closeForm();
    } else {
      toast.error(result?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    let result;
    switch (activeTab) {
      case 'years':    result = await deleteAcademicYear(id); break;
      case 'classes':  result = await deleteClass(id); break;
      case 'sections': result = await deleteSection(id); break;
      case 'subjects': result = await deleteSubject(id); break;
      case 'examTypes': result = await deleteExamType(id); break;
    }
    if (result?.success) toast.success('Deleted successfully!');
    else toast.error(result?.error || 'Delete failed');
  };

  const tabLabel = TABS.find(t => t.id === activeTab)?.label || '';
  const singularLabel = tabLabel.endsWith('es')
    ? tabLabel.slice(0, -2)
    : tabLabel.endsWith('s')
      ? tabLabel.slice(0, -1)
      : tabLabel;

  // ── Data for current tab
  const getData = () => {
    switch (activeTab) {
      case 'years':    return academicYears;
      case 'classes':  return classes;
      case 'sections': return sections;
      case 'subjects': return subjects;
      case 'examTypes': return examTypes;
      default:         return [];
    }
  };

  const data = getData();

  // ── Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
            <p className="text-xs text-gray-500">Academic Settings</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Academic Settings</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage classes, sections, subjects, and academic years</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); closeForm(); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Add Button & background fetching indicator */}
        <div className="flex items-center justify-between mb-6">
          {!showForm && (
            <button
              onClick={() => openForm()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add {singularLabel}
            </button>
          )}
          {isFetching && (
            <div className="flex items-center gap-2 text-primary-600 text-sm font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </div>
          )}
        </div>

        {/* ── FORM ── */}
        {showForm && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? `Edit ${singularLabel}` : `Add ${singularLabel}`}
              </h3>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Academic Year form */}
              {activeTab === 'years' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                    <input
                      type="text"
                      className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="e.g., 2024-2025"
                      {...register('name', { required: 'Name is required' })}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      className={`input-field ${errors.startDate ? 'border-red-500' : ''}`}
                      {...register('startDate', { required: 'Start date is required' })}
                    />
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
                    <input
                      type="date"
                      className={`input-field ${errors.endDate ? 'border-red-500' : ''}`}
                      {...register('endDate', { required: 'End date is required' })}
                    />
                    {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="isCurrent" {...register('isCurrent')} />
                    <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">
                      Set as Current Academic Year
                    </label>
                  </div>
                </div>
              )}

              {/* Class form */}
              {activeTab === 'classes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Name *</label>
                    <input
                      type="text"
                      className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="e.g., Grade 1, Pre-K"
                      {...register('name', { required: 'Class name is required' })}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                    <input type="number" className="input-field" placeholder="0" {...register('displayOrder')} />
                  </div>
                </div>
              )}

              {/* Section form */}
              {activeTab === 'sections' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                    <select
                      className={`input-field ${errors.classId ? 'border-red-500' : ''}`}
                      {...register('classId', { required: 'Class is required' })}
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>{cls.name}</option>
                      ))}
                    </select>
                    {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Name *</label>
                    <input
                      type="text"
                      className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="e.g., A, B, C"
                      {...register('name', { required: 'Section name is required' })}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Teacher</label>
                    <select className="input-field" {...register('classTeacher')}>
                      <option value="">Select Teacher (optional)</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.personalInfo?.firstName} {t.personalInfo?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity</label>
                    <input type="number" className="input-field" placeholder="40" {...register('capacity')} />
                  </div>
                </div>
              )}

              {/* Subject form */}
              {activeTab === 'subjects' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Name *</label>
                      <input
                        type="text"
                        className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="e.g., Mathematics"
                        {...register('name', { required: 'Subject name is required' })}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Code</label>
                      <input type="text" className="input-field" placeholder="e.g., MATH-101" {...register('code')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea className="input-field resize-none" rows="2" placeholder="Subject description..." {...register('description')} />
                  </div>
                  {classes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taught in Classes</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {classes.map(cls => (
                          <label key={cls._id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" value={cls._id} {...register('classes')} />
                            <span className="text-sm">{cls.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Exam Types form */}
              {activeTab === 'examTypes' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Type Name *</label>
                      <input
                        type="text"
                        className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="e.g., Midterm, Final"
                        {...register('name', { required: 'Name is required' })}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Weightage (%)</label>
                      <input type="number" className="input-field" min="0" max="100" placeholder="e.g., 20" {...register('weightage', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea className="input-field resize-none" rows="2" placeholder="Description..." {...register('description')} />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingItem ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── TABLE ── */}
        {!showForm && (
          <>
            {data.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-gray-400 mb-4">No {tabLabel.toLowerCase()} found</p>
                <button onClick={() => openForm()} className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add {singularLabel}
                </button>
              </div>
            ) : (
              <div className="card p-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
                <DataTable columns={getColumns()} data={data} searchable={true} placeholder={`Search ${tabLabel.toLowerCase()}...`} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AcademicSettings;
