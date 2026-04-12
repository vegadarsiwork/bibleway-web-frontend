"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "../lib/api";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useTranslation } from "../lib/i18n";
import TermsBody from "../terms/TermsBody";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Lock body scroll + close on Escape while modal is open
  useEffect(() => {
    if (!showTerms) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTerms(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [showTerms]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    date_of_birth: "",
    gender: "",
    country: "",
    phone_number: "",
    preferred_language: "en",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    let mapped = "prefer_not_to_say";
    if (val === "Male") mapped = "male";
    if (val === "Female") mapped = "female";
    setFormData({ ...formData, gender: mapped });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, preferred_language: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("You must agree to the Terms and Conditions before continuing.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, string> = { ...formData };
      if (!payload.phone_number) delete payload.phone_number;

      await fetchAPI("/accounts/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // Redirect to OTP verification page
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <img src="/bibleway-logo.png" alt="Bibleway" className="h-12 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <h1 className="font-headline text-4xl text-on-surface text-center mb-2">
          Join Bibleway
        </h1>
        <p className="text-on-surface-variant text-center mb-10">
          Create your free account to start your journey.
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              Email (Primary — cannot be changed)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                minLength={8}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 pr-12 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              required
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              Gender
            </label>
            <select 
              required
              onChange={handleGenderChange}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all appearance-none cursor-pointer font-medium"
            >
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          {/* Country & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all appearance-none cursor-pointer font-medium"
              >
                <option value="">Select</option>
                <option>Afghanistan</option>
                <option>Albania</option>
                <option>Algeria</option>
                <option>Andorra</option>
                <option>Angola</option>
                <option>Antigua and Barbuda</option>
                <option>Argentina</option>
                <option>Armenia</option>
                <option>Australia</option>
                <option>Austria</option>
                <option>Azerbaijan</option>
                <option>Bahamas</option>
                <option>Bahrain</option>
                <option>Bangladesh</option>
                <option>Barbados</option>
                <option>Belarus</option>
                <option>Belgium</option>
                <option>Belize</option>
                <option>Benin</option>
                <option>Bhutan</option>
                <option>Bolivia</option>
                <option>Bosnia and Herzegovina</option>
                <option>Botswana</option>
                <option>Brazil</option>
                <option>Brunei</option>
                <option>Bulgaria</option>
                <option>Burkina Faso</option>
                <option>Burundi</option>
                <option>Cabo Verde</option>
                <option>Cambodia</option>
                <option>Cameroon</option>
                <option>Canada</option>
                <option>Central African Republic</option>
                <option>Chad</option>
                <option>Chile</option>
                <option>China</option>
                <option>Colombia</option>
                <option>Comoros</option>
                <option>Congo</option>
                <option>Costa Rica</option>
                <option>Croatia</option>
                <option>Cuba</option>
                <option>Cyprus</option>
                <option>Czech Republic</option>
                <option>Denmark</option>
                <option>Djibouti</option>
                <option>Dominica</option>
                <option>Dominican Republic</option>
                <option>DR Congo</option>
                <option>Ecuador</option>
                <option>Egypt</option>
                <option>El Salvador</option>
                <option>Equatorial Guinea</option>
                <option>Eritrea</option>
                <option>Estonia</option>
                <option>Eswatini</option>
                <option>Ethiopia</option>
                <option>Fiji</option>
                <option>Finland</option>
                <option>France</option>
                <option>Gabon</option>
                <option>Gambia</option>
                <option>Georgia</option>
                <option>Germany</option>
                <option>Ghana</option>
                <option>Greece</option>
                <option>Grenada</option>
                <option>Guatemala</option>
                <option>Guinea</option>
                <option>Guinea-Bissau</option>
                <option>Guyana</option>
                <option>Haiti</option>
                <option>Honduras</option>
                <option>Hungary</option>
                <option>Iceland</option>
                <option>India</option>
                <option>Indonesia</option>
                <option>Iran</option>
                <option>Iraq</option>
                <option>Ireland</option>
                <option>Israel</option>
                <option>Italy</option>
                <option>Ivory Coast</option>
                <option>Jamaica</option>
                <option>Japan</option>
                <option>Jordan</option>
                <option>Kazakhstan</option>
                <option>Kenya</option>
                <option>Kiribati</option>
                <option>Kuwait</option>
                <option>Kyrgyzstan</option>
                <option>Laos</option>
                <option>Latvia</option>
                <option>Lebanon</option>
                <option>Lesotho</option>
                <option>Liberia</option>
                <option>Libya</option>
                <option>Liechtenstein</option>
                <option>Lithuania</option>
                <option>Luxembourg</option>
                <option>Madagascar</option>
                <option>Malawi</option>
                <option>Malaysia</option>
                <option>Maldives</option>
                <option>Mali</option>
                <option>Malta</option>
                <option>Marshall Islands</option>
                <option>Mauritania</option>
                <option>Mauritius</option>
                <option>Mexico</option>
                <option>Micronesia</option>
                <option>Moldova</option>
                <option>Monaco</option>
                <option>Mongolia</option>
                <option>Montenegro</option>
                <option>Morocco</option>
                <option>Mozambique</option>
                <option>Myanmar</option>
                <option>Namibia</option>
                <option>Nauru</option>
                <option>Nepal</option>
                <option>Netherlands</option>
                <option>New Zealand</option>
                <option>Nicaragua</option>
                <option>Niger</option>
                <option>Nigeria</option>
                <option>North Korea</option>
                <option>North Macedonia</option>
                <option>Norway</option>
                <option>Oman</option>
                <option>Pakistan</option>
                <option>Palau</option>
                <option>Palestine</option>
                <option>Panama</option>
                <option>Papua New Guinea</option>
                <option>Paraguay</option>
                <option>Peru</option>
                <option>Philippines</option>
                <option>Poland</option>
                <option>Portugal</option>
                <option>Qatar</option>
                <option>Romania</option>
                <option>Russia</option>
                <option>Rwanda</option>
                <option>Saint Kitts and Nevis</option>
                <option>Saint Lucia</option>
                <option>Saint Vincent and the Grenadines</option>
                <option>Samoa</option>
                <option>San Marino</option>
                <option>Sao Tome and Principe</option>
                <option>Saudi Arabia</option>
                <option>Senegal</option>
                <option>Serbia</option>
                <option>Seychelles</option>
                <option>Sierra Leone</option>
                <option>Singapore</option>
                <option>Slovakia</option>
                <option>Slovenia</option>
                <option>Solomon Islands</option>
                <option>Somalia</option>
                <option>South Africa</option>
                <option>South Korea</option>
                <option>South Sudan</option>
                <option>Spain</option>
                <option>Sri Lanka</option>
                <option>Sudan</option>
                <option>Suriname</option>
                <option>Sweden</option>
                <option>Switzerland</option>
                <option>Syria</option>
                <option>Taiwan</option>
                <option>Tajikistan</option>
                <option>Tanzania</option>
                <option>Thailand</option>
                <option>Timor-Leste</option>
                <option>Togo</option>
                <option>Tonga</option>
                <option>Trinidad and Tobago</option>
                <option>Tunisia</option>
                <option>Turkey</option>
                <option>Turkmenistan</option>
                <option>Tuvalu</option>
                <option>Uganda</option>
                <option>Ukraine</option>
                <option>United Arab Emirates</option>
                <option>United Kingdom</option>
                <option>United States</option>
                <option>Uruguay</option>
                <option>Uzbekistan</option>
                <option>Vanuatu</option>
                <option>Vatican City</option>
                <option>Venezuela</option>
                <option>Vietnam</option>
                <option>Yemen</option>
                <option>Zambia</option>
                <option>Zimbabwe</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                Phone (Optional)
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+91 XXXXXXXXXX"
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
              />
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              Preferred App Language
            </label>
            <select
              value={formData.preferred_language}
              onChange={handleLanguageChange}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all appearance-none cursor-pointer font-medium"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="pt">Português</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>

          {/* Terms & Conditions checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none mt-2">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-outline-variant/40 text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer accent-primary shrink-0"
            />
            <span className="text-sm text-on-surface-variant leading-relaxed">
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowTerms(true);
                }}
                className="text-primary font-semibold hover:underline"
              >
                Terms and Conditions
              </button>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:opacity-90 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <GoogleSignInButton />

        <p className="mt-8 text-sm text-on-surface-variant text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowTerms(false)}
        >
          <div
            className="bg-surface w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/15"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-outline-variant/15 shrink-0">
              <h2
                id="terms-modal-title"
                className="font-headline text-lg sm:text-xl text-on-surface"
              >
                Terms &amp; Conditions
              </h2>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                aria-label="Close"
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 -mr-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-5 sm:px-8 py-6 flex-1">
              <TermsBody />
            </div>

            {/* Modal footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-outline-variant/15 flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant/20 font-semibold text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTerms(false);
                  setError("");
                }}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
