import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Loader2, X, Tag, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import useFeeStore from '../../store/feeStore';
import useAcademicStore from '../../store/academicStore';
import useAuthStore from '../../store/authStore';
import DataTable from '../../components/common/DataTable';
import BrandLogo from '../../components/common/BrandLogo';
import { createColumnHelper } from '@tanstack/react-table';

const TABS = [
  { id: 'categories', label: 'Fee Categories', icon: Tag },
  { id: 'structures', label: 'Fee Structures', icon: Layers },
];

const FeeSettings = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const {
    categories, structures,
    fetchCategories, createCategory, updateCategory, deleteCategory,
    fetchStructures, createStructure, updateStructure, deleteStructure,
    isLoading
  } = useFeeStore();

  const { classes, academicYears, subjects, fetchClasses, fetchAcademicYears } = useAcademicStore();
  const { user } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const columnHelper = createColumnHelper();

  useEffect(() => {
    fetchCategories();
    fetchStructures();
    fetchClasses();
    fetchAcademicYears();
  }, [fetchCategories, fetchStructures, fetchClasses, fetchAcademicYears]);

  const openForm = (item = null) => {
    setEditingItem(item);
    setShowForm(true);
    if (!item) { reset({}); return; }
    if (activeTab === 'categories') {
      reset({ name: item.name, description: item.description || '' });
    } else {
      reset({
        classId: item.classId?._id || item.classId,
        feeCategoryId: item.feeCategoryId?._id || item.feeCategoryId,
        academicYearId: item.academicYearId?._id || item.academicYearId,
        amount: item.amount,
        frequency: item.frequency,
        dueDate: item.dueDate ? format(new Date(item.dueDate), 'yyyy-MM-dd') : '',
        description: item.description || ''
      });
    }
  };

  const closeForm = () => { setShowForm(false); setEditingItem(null); reset({}); };

  const onSubmit = async (data) => {
    let result;
    if (activeTab === 'categories') {
      result = editingItem ? await updateCategory(editingItem._id, data) : await createCategory(data);
    } else {
      result = editingItem ? await updateStructure(editingItem._id, data) : await createStructure(data);
    }
    if (result?.success) {
      toast.success(editingItem ? 'Updated successfully!' : 'Created successfully!');
      closeForm();
    } else {
      toast.error(result?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    const result = activeTab === 'categories' ? await deleteCategory(id) : await deleteStructure(id);
    if (result?.success) toast.success('Deleted successfully!');
    else toast.error(result?.error || 'Delete failed');
  };

  const categoryColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Category Name',
      cell: info => <span className="font-semibold text-gray-900">{info.getValue()}</span>
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => <span className="text-gray-500">{info.getValue() || '—'}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openForm(props.row.original)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(props.row.original._id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    })
  ], []);

  const structureColumns = useMemo(() => [
    columnHelper.accessor(row => row.classId?.name || '—', {
      id: 'class', header: 'Class',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row.feeCategoryId?.name || '—', {
      id: 'category', header: 'Fee Category',
      cell: info => <span className="text-gray-600">{info.getValue()}</span>
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: info => <span className="font-semibold text-green-700">Rs. {info.getValue().toLocaleString()}</span>
    }),
    columnHelper.accessor('frequency', {
      header: 'Frequency',
      cell: info => <span className="capitalize text-gray-500">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row.academicYearId?.name || '—', {
      id: 'year', header: 'Academic Year',
      cell: info => <span className="text-gray-500">{info.getValue()}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openForm(props.row.original)} className="p-1.5 rounded text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(props.row.original._id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    })
  ], []);

  const data = activeTab === 'categories' ? categories : structures;
  const columns = activeTab === 'categories' ? categoryColumns : structureColumns;
  const label = activeTab === 'categories' ? 'Category' : 'Structure';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3 sm:gap-4 min-w-0">
          <BrandLogo linkTo="/dashboard" />
          <Link to="/dashboard" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
            <p className="text-xs text-gray-500">Fee Settings</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Fee Settings</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage fee categories and structures</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); closeForm(); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-6">
          {!showForm && (
            <button onClick={() => openForm()} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add {label}
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editingItem ? `Edit ${label}` : `Add ${label}`}</h3>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                    <input type="text" className={`input-field ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g., Tuition Fee"
                      {...register('name', { required: 'Name is required' })} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" className="input-field" placeholder="Optional description" {...register('description')} />
                  </div>
                </div>
              )}

              {activeTab === 'structures' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                    <select className={`input-field ${errors.academicYearId ? 'border-red-500' : ''}`} {...register('academicYearId', { required: 'Required' })}>
                      <option value="">Select Year</option>
                      {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                    </select>
                    {errors.academicYearId && <p className="text-red-500 text-xs mt-1">{errors.academicYearId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                    <select className={`input-field ${errors.classId ? 'border-red-500' : ''}`} {...register('classId', { required: 'Required' })}>
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Category *</label>
                    <select className={`input-field ${errors.feeCategoryId ? 'border-red-500' : ''}`} {...register('feeCategoryId', { required: 'Required' })}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    {errors.feeCategoryId && <p className="text-red-500 text-xs mt-1">{errors.feeCategoryId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.) *</label>
                    <input type="number" min="0" className={`input-field ${errors.amount ? 'border-red-500' : ''}`} placeholder="e.g., 5000"
                      {...register('amount', { required: 'Required', valueAsNumber: true })} />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select className="input-field" {...register('frequency')}>
                      <option value="yearly">Yearly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half-yearly">Half-Yearly</option>
                      <option value="one-time">One-Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="date" className="input-field" {...register('dueDate')} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" className="input-field" placeholder="Optional" {...register('description')} />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingItem ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        {!showForm && (
          data.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-gray-400 mb-4">No {label.toLowerCase()}s found</p>
              <button onClick={() => openForm()} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add {label}
              </button>
            </div>
          ) : (
            <div className="card p-0 border border-gray-200 overflow-hidden">
              <DataTable columns={columns} data={data} searchable={true} placeholder={`Search ${label.toLowerCase()}s...`} isLoading={isLoading} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FeeSettings;
