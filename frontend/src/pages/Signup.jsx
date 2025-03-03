import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utilsToast";
import API_BASE_URL from "../config.js";

function Signup() {
  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password } = signupInfo;

    if (!name || !email || !password) {
      return handleError("Name, email, and password are required");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupInfo),
      });

      const result = await response.json();
      const { success, message, error } = result;

      if (success) {
        handleSuccess(message);
        setTimeout(() => navigate("/login"), 1000);
      } else {
        handleError(error?.details?.[0]?.message || message);
      }
    } catch (err) {
      handleError("Something went wrong, please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Start Your Journey!
        </h1>
        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          {["name", "email", "password"].map((field, index) => (
            <div key={index}>
              <label
                htmlFor={field}
                className="block text-sm font-medium text-gray-900 capitalize"
              >
                {field}
              </label>
              <input
                onChange={handleChange}
                type={field === "password" ? "password" : "text"}
                name={field}
                id={field}
                placeholder={`Enter your ${field}...`}
                value={signupInfo[field]}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none"
          >
            Signup
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Login
          </Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Signup;
