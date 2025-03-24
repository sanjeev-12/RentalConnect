// src/pages/OwnerDashboard.jsx
import TenantMessages from "../components/TenantMessages";
import OwnerReminders from "../components/OwnerReminders";
import { useState } from 'react';
import { FaEnvelope, FaBell } from 'react-icons/fa';

function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('reminders');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6"> Rent Reminder  </h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center px-4 py-2 mr-4 ${
            activeTab === 'reminders' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <FaBell className="mr-2" />
          Tenant Reminders
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center px-4 py-2 ${
            activeTab === 'messages' 
              ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <FaEnvelope className="mr-2" />
          Tenant Messages
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'reminders' && <OwnerReminders />}
        {activeTab === 'messages' && <TenantMessages />}
      </div>
    </div>
  );
}

export default OwnerDashboard;
