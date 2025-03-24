// import React from 'react'
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth";


export default function SignUp() {
  const [formData, setFormData] = useState({ 
    role: "tenant"
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      
      // Validate required fields
      const requiredFields = ['username', 'email', 'password'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      setLoading(true);
      
      // Add default values for required fields
      const completeFormData = {
        ...formData,
        phone: "Please update",
        address: "Please update",
        city: "Please update",
        state: "Please update",
        country: "Please update",
        zipCode: "00000"
      };
      
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeFormData),
      });

      // Check if the response is valid JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error('Error parsing JSON:', err);
        throw new Error('Unexpected end of JSON input');
      }
      
      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      }
      setLoading(false);
      setError(null);
      if (formData.role === "owner") {
        navigate('/profile');
      } else {
        navigate('/profile2');
      }
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl text-center font-semibold my-7">Sign Up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          className="p-3 border rounded-lg"
          id="username"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="p-3 border rounded-lg"
          id="email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="p-3 border rounded-lg"
          id="password"
          onChange={handleChange}
          required
        />
        <select
          id="role"
          className="p-3 border rounded-lg"
          onChange={handleChange}
          value={formData.role}
        >
          <option value="tenant">Tenant</option>
          <option value="owner">Owner</option>
        </select>

        <button
          disabled={loading}
          className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Loading..." : "Sign Up"}
        </button>
          <OAuth />
      </form>

      <div className="flex gap-2 mt-5">
        <p>Have an account?</p>
        <Link to={"/sign-in"}>
          <span className="text-blue-700">Sign In</span>
        </Link>
      </div>
      {error && <p className="text-red-500 mt-5">{error}</p>}
    </div>
  );
}
