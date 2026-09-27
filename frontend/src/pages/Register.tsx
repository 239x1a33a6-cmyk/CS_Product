import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import { setAuth } from "../lib/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setAuth(data.data.token, data.data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg border p-8 space-y-5">
        <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(["name","email","password"] as const).map((f) => (
            <div key={f}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{f}</label>
              <input type={f === "password" ? "password" : f === "email" ? "email" : "text"} required
                value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          ))}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center">
          Have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
