import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useExamStore from '../../store/examStore';
import useAcademicStore from '../../store/academicStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const ExamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEditMode = !!id;

  const { createExam, updateExam, fetchExam, currentExam, examTypes, fetchExamTypes, isLoading } = useExamStore();
  const { classes, sections, subjects, academicYears, fetchClasses, fetchSections, fetchSubjects, fetchAcademicYears } = useAcademicStore();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      duration: 60,
      totalMarks: 100,
      passingMarks: 33,
      isPublished: false
    }
  });

  const selectedClass = watch('classId');

  useEffect(() => {
    fetchClasses();
    fetchSections();
    fetchSubjects();
    fetchAcademicYears();
    fetchExamTypes();
  }, [fetchClasses, fetchSections, fetchSubjects, fetchAcademicYears, fetchExamTypes]);

  useEffect(() => {
    if (isEditMode) {
      fetchExam(id);
    } else {
      useExamStore.getState().reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentExam) {
      reset({
        name: currentExam.name,
        academicYearId: currentExam.academicYearId?._id || currentExam.academicYearId,
        examTypeId: currentExam.examTypeId?._id || currentExam.examTypeId,
        classId: currentExam.classId?._id || currentExam.classId,
        sectionId: currentExam.sectionId?._id || currentExam.sectionId || '',
        subjectId: currentExam.subjectId?._id || currentExam.subjectId,
        totalMarks: currentExam.totalMarks,
        passingMarks: currentExam.passingMarks,
        examDate: currentExam.examDate ? new Date(currentExam.examDate).toISOString().split('T')[0] : '',
        duration: currentExam.duration,
        instructions: currentExam.instructions || '',
        isPublished: currentExam.isPublished || false,
      });
    }
  }, [isEditMode, currentExam, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        sectionId: data.sectionId || null // Section is optional
      };

      const res = isEditMode
        ? await updateExam(id, payload)
        : await createExam(payload);

      if (res.success) {
        toast.success(isEditMode ? 'Exam updated successfully' : 'Exam created successfully');
        navigate('/exams');
      } else {
        toast.error(res.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const filteredSections = sections.filter(s => (s.classId?._id || s.classId) === selectedClass);

  if (isEditMode && isLoading && !currentExam) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/exams"
          backLabel="Back to exams"
          title={user?.schoolName || 'School'}
          subtitle={isEditMode ? 'Edit exam' : 'Create new exam'}
        />
      </AppHeader>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-4">Exam Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                <input
                  type="text"
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. Midterm Physics"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
                <select className={`input-field ${errors.examTypeId ? 'border-red-500' : ''}`} {...register('examTypeId', { required: 'Type is required' })}>
                  <option value="">Select Type</option>
                  {examTypes.map(et => <option key={et._id} value={et._id}>{et.name}</option>)}
                </select>
                {errors.examTypeId && <p className="mt-1 text-sm text-red-500">{errors.examTypeId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <select className={`input-field ${errors.academicYearId ? 'border-red-500' : ''}`} {...register('academicYearId', { required: 'Year is required' })}>
                  <option value="">Select Year</option>
                  {academicYears.map(ay => <option key={ay._id} value={ay._id}>{ay.name}</option>)}
                </select>
                {errors.academicYearId && <p className="mt-1 text-sm text-red-500">{errors.academicYearId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select className={`input-field ${errors.classId ? 'border-red-500' : ''}`} {...register('classId', { required: 'Class is required' })}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {errors.classId && <p className="mt-1 text-sm text-red-500">{errors.classId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
                <select className={`input-field`} {...register('sectionId')}>
                  <option value="">All Sections</option>
                  {filteredSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select className={`input-field ${errors.subjectId ? 'border-red-500' : ''}`} {...register('subjectId', { required: 'Subject is required' })}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
                {errors.subjectId && <p className="mt-1 text-sm text-red-500">{errors.subjectId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
                <input
                  type="date"
                  className={`input-field ${errors.examDate ? 'border-red-500' : ''}`}
                  {...register('examDate', { required: 'Date is required' })}
                />
                {errors.examDate && <p className="mt-1 text-sm text-red-500">{errors.examDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  className="input-field"
                  min="0"
                  {...register('duration', { valueAsNumber: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                <input
                  type="number"
                  className={`input-field ${errors.totalMarks ? 'border-red-500' : ''}`}
                  min="1"
                  {...register('totalMarks', { required: 'Total required', valueAsNumber: true })}
                />
                {errors.totalMarks && <p className="mt-1 text-sm text-red-500">{errors.totalMarks.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks *</label>
                <input
                  type="number"
                  className={`input-field ${errors.passingMarks ? 'border-red-500' : ''}`}
                  min="0"
                  {...register('passingMarks', { required: 'Passing required', valueAsNumber: true })}
                />
                {errors.passingMarks && <p className="mt-1 text-sm text-red-500">{errors.passingMarks.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (Optional)</label>
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Specific instructions for students or invigilators..."
                {...register('instructions')}
              ></textarea>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                className="w-4 h-4 text-primary-600 rounded"
                {...register('isPublished')}
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">Publish results immediately upon saving marks</label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
             <Link to="/exams" className="btn-secondary">Cancel</Link>
             <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
               {isEditMode ? 'Update Exam' : 'Create Exam'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamForm;
