"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "../lib/api";
import { signInWithGoogle } from "../lib/firebase";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon",
  "Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","East Timor","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Check if user already has a token (existing user case)
    const token = localStorage.getItem("access_token");
    if (token) {
      // Already authenticated — check if profile is complete
      fetchAPI("/accounts/profile/")
        .then((res) => {
          const d = res.data || res;
          if (d.full_name && d.date_of_birth && d.country) {
            router.replace("/");
            return;
          }
          if (d.full_name) setFullName(d.full_name);
          if (d.date_of_birth) setDateOfBirth(d.date_of_birth);
          if (d.country) setCountry(d.country);
          if (d.gender) setGender(d.gender);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // New Google user — get google_user data from sessionStorage
      const googleUser = sessionStorage.getItem("google_user");
      if (googleUser) {
        try {
          const data = JSON.parse(googleUser);
          if (data.full_name) setFullName(data.full_name);
          if (data.email) setGoogleEmail(data.email);
          if (data.profile_photo) setPhotoPreview(data.profile_photo);
        } catch {}
      }
      setLoading(false);
    }
  }, [router]);

  const checkUsername = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchAPI(`/accounts/users/search/?q=${encodeURIComponent(value)}`);
        const results = res?.data?.results ?? res?.results ?? [];
        const taken = results.some((u: { username?: string }) => u.username?.toLowerCase() === value.toLowerCase());
        setUsernameStatus(taken ? "taken" : "available");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  }, []);

  function handleUsernameChange(value: string) {
    setUsername(value);
    checkUsername(value);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!dateOfBirth) { setError("Date of birth is required."); return; }
    if (!gender) { setError("Please select your gender."); return; }
    if (!country) { setError("Please select your country."); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");

      if (token) {
        // Already authenticated — just PATCH the profile
        await fetchAPI("/accounts/profile/", {
          method: "PATCH",
          body: JSON.stringify({
            full_name: fullName.trim(),
            date_of_birth: dateOfBirth,
            gender,
            country,
          }),
        });
        // Upload profile photo if selected
        if (photo) {
          const formData = new FormData();
          formData.append("profile_photo", photo);
          await fetchAPI("/accounts/profile/", { method: "PATCH", body: formData }).catch(() => {});
        }
        router.replace("/");
      } else {
        // New Google user — re-authenticate with complete data
        // Get a fresh Firebase ID token
        const idToken = await signInWithGoogle();

        const response = await fetchAPI("/accounts/google-auth/", {
          method: "POST",
          body: JSON.stringify({
            id_token: idToken,
            full_name: fullName.trim(),
            date_of_birth: dateOfBirth,
            gender,
            country,
          }),
        });

        const data = response.data || response;
        const accessToken = data.access || data.access_token;
        const refreshToken = data.refresh || data.refresh_token;

        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
          if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
          if (data.user_id) localStorage.setItem("user_id", data.user_id);
          if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
          sessionStorage.removeItem("google_user");
          // Upload profile photo if selected
          if (photo) {
            const formData = new FormData();
            formData.append("profile_photo", photo);
            await fetchAPI("/accounts/profile/", { method: "PATCH", body: formData }).catch(() => {});
          }
          router.replace("/");
        } else {
          setError("Failed to create account. Please try again.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-start justify-center px-4 py-12">
      <div className="bg-surface-container-lowest rounded-2xl editorial-shadow p-8 max-w-lg w-full mt-4">
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl text-primary mb-2">Bibleway</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Almost there! Complete your profile to join the community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Photo */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden hover:border-primary transition-colors group"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-3xl">
                  add_a_photo
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm appearance-none"
            >
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm appearance-none"
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error-container/20 px-4 py-3 rounded-xl">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold text-sm disabled:opacity-50 press-effect transition-all hover:opacity-90"
          >
            {submitting ? "Saving..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
