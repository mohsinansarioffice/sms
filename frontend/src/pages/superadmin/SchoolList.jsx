import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Search, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { createColumnHelper } from "@tanstack/react-table";
import useSuperAdminStore from "../../store/superAdminStore";
import ToggleSwitch from "../../components/superadmin/ToggleSwitch";
import LogoutButton from "../../components/common/LogoutButton";
import DataTable from "../../components/common/DataTable";

const planBadge = (plan) => {
  const colors = {
    free: "bg-gray-100 text-gray-800",
    basic: "bg-blue-100 text-blue-800",
    premium: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colors[plan] || "bg-gray-100"}`}
    >
      {plan}
    </span>
  );
};

const SchoolList = () => {
  const navigate = useNavigate();
  const {
    schools,
    total,
    isLoading,
    error,
    fetchSchools,
    updateSchoolActive,
    clearError,
  } = useSuperAdminStore();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [savingSchoolId, setSavingSchoolId] = useState(null);

  const columnHelper = createColumnHelper();

  const toggleActive = useCallback(
    async (school, next) => {
      setSavingSchoolId(school._id);
      try {
        const res = await updateSchoolActive(school._id, next);
        if (res.success)
          toast.success(next ? "School activated" : "School deactivated");
        else toast.error(res.error || "Failed");
      } finally {
        setSavingSchoolId(null);
      }
    },
    [updateSchoolActive],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "School",
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("subscriptionPlan", {
        header: "Plan",
        cell: (info) => planBadge(info.getValue()),
      }),
      columnHelper.accessor("studentCount", {
        header: "Students",
        cell: (info) => (
          <span className="text-gray-700 tabular-nums">
            {info.getValue() ?? 0}
          </span>
        ),
      }),
      columnHelper.accessor("teacherCount", {
        header: "Teachers",
        cell: (info) => (
          <span className="text-gray-700 tabular-nums">
            {info.getValue() ?? 0}
          </span>
        ),
      }),
      columnHelper.accessor("isActive", {
        header: "Active",
        cell: (info) => {
          const school = info.row.original;
          return (
            <div className="flex justify-center">
              <ToggleSwitch
                checked={!!school.isActive}
                onCheckedChange={(next) => toggleActive(school, next)}
                disabled={
                  savingSchoolId !== null && savingSchoolId !== school._id
                }
                loading={savingSchoolId === school._id}
                ariaLabel={`${school.name}: school active`}
                showStateLabel={false}
              />
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right w-full">Actions</div>,
        cell: (props) => (
          <div className="text-right">
            <Link
              to={`/superadmin/schools/${props.row.original._id}`}
              className="text-primary-600 text-sm font-medium hover:underline"
            >
              Manage
            </Link>
          </div>
        ),
      }),
    ],
    [savingSchoolId, toggleActive],
  );

  useEffect(() => {
    fetchSchools(q);
  }, [q, fetchSchools]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const submitSearch = (e) => {
    e.preventDefault();
    setQ(search.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/superadmin/dashboard")}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Overview
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" /> Schools
            </h1>
          </div>
          <LogoutButton className="btn-secondary inline-flex items-center gap-2" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Filter by school name (server)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Apply filter
          </button>
        </form>

        <div className="card p-0 overflow-hidden border border-gray-200 shadow-sm">
          <DataTable
            columns={columns}
            data={schools}
            searchable
            placeholder="Search in loaded schools…"
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-2">
                <Building2 className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500">No schools found.</p>
              </div>
            }
          />
        </div>

        {!isLoading && total > 0 && (
          <p className="text-sm text-gray-500">
            {total} school{total === 1 ? "" : "s"} total
            {q ? ` (name filter: “${q}”)` : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default SchoolList;
