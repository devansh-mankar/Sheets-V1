import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utilsToast.js";
import { API_BASE_URL } from "../config.js";

export default function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo({ ...loginInfo, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;

    if (!email || !password) {
      return handleError("Email and password are required");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginInfo),
        credentials: "include", // Important for cookies
      });

      const result = await response.json();
      console.log("Login response:", result);

      if (result.success) {
        handleSuccess(result.message || "Login successful! Redirecting...");
        setTimeout(() => navigate("/home"), 1000);
      } else {
        handleError(result.error?.details?.[0]?.message || result.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      handleError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Welcome Back!
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {["email", "password"].map((field, index) => (
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
                value={loginInfo[field]}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Signup
          </Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
}
