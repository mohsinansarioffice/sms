import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeatureLock = ({ feature, requiredPlan = 'premium', children, showUpgrade = true }) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Blurred/disabled content */}
      <div className="opacity-50 pointer-events-none blur-sm select-none">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5 backdrop-blur-sm rounded-lg">
        <div className="text-center bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 border border-gray-100">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
            <Lock className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {requiredPlan === 'basic' ? 'Basic' : 'Premium'} Feature
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Upgrade to{' '}
            <span className="font-medium text-gray-700 capitalize">{requiredPlan}</span>{' '}
            plan to unlock <span className="font-medium text-gray-700">{feature}</span>
          </p>
          {showUpgrade && (
            <button
              onClick={() => navigate('/settings/plans')}
              className="btn-primary px-6"
            >
              View Plans
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureLock;
