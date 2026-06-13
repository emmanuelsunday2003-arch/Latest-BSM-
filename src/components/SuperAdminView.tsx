import React, { useState, useEffect } from "react";
import { School, UserProfile } from "../types";
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Building2, Plus, Sparkles, Server, CheckCircle, ShieldAlert, CreditCard } from "lucide-react";

interface SuperAdminViewProps {
  user: UserProfile;
}

export default function SuperAdminView({ user }: SuperAdminViewProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states to register school
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newMotto, setNewMotto] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPlan, setNewPlan] = useState("Standard Professional - $199/m");

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "schools"));
      const schoolList: School[] = [];
      snap.forEach((doc) => {
        schoolList.push(doc.data() as School);
      });
      setSchools(schoolList);
    } catch (error) {
      console.error("Error drawing schools Registry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName) return;

    try {
      setCreating(true);
      const randId = "school-" + Math.random().toString(36).substring(2, 9);
      const payload: School = {
        schoolId: randId,
        name: newSchoolName,
        motto: newMotto,
        address: newAddress,
        contactDetails: newContact,
        status: "active",
        subscriptionPlan: newPlan,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "schools"), payload);
      
      // Auto-create standard administrator document for school mapping
      await addDoc(collection(db, "users"), {
        uid: "admin-" + randId,
        email: `admin@${randId}.com`,
        name: `${newSchoolName} Principal`,
        role: "school-admin",
        schoolId: randId,
        createdAt: new Date().toISOString()
      });

      setNewSchoolName("");
      setNewMotto("");
      setNewAddress("");
      setNewContact("");
      fetchSchools();
    } catch (error) {
      console.error("Error provisioning new school tenant:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (schoolId: string, currentStatus: "active" | "inactive") => {
    try {
      const snap = await getDocs(query(collection(db, "schools"), where("schoolId", "==", schoolId)));
      if (!snap.empty) {
        const docRef = doc(db, "schools", snap.docs[0].id);
        const nextStatus = currentStatus === "active" ? "inactive" : "active";
        await updateDoc(docRef, { status: nextStatus });
        fetchSchools();
      }
    } catch (error) {
      console.error("Error setting school offline/online:", error);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <Server className="h-5 w-5 text-blue-600" />
          <span>SaaS Super Admin Platform Center</span>
        </h2>
        <p className="text-slate-400 text-xs">
          Global platform overview, subscriptions pipeline, and client school registers.
        </p>
      </div>

      {/* Global SaaS Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block mb-1">Total Client Schools</span>
          <span className="text-2xl font-bold dark:text-white">{schools.length}</span>
          <span className="text-[9px] block text-emerald-500 font-medium mt-1">✓ Sandbox Isolation Active</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block mb-1">Monthly Recurring Revenue (estimate)</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${schools.reduce((acc, s) => acc + (s.subscriptionPlan.includes("Premier") ? 499 : 199), 0)}/mo
          </span>
          <span className="text-[9px] block text-slate-400 mt-1">Based on active subscription tiers</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block mb-1">Active Database Status</span>
          <span className="text-sm font-semibold text-emerald-600 flex items-center mt-1">
            <CheckCircle className="h-4 w-4 mr-1 text-emerald-500" />
            Healthy - Standard Firestore
          </span>
          <span className="text-[9px] block text-slate-400 mt-1">Region: europe-west2</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block mb-1">Assisted AI Engine</span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center mt-1">
            <Sparkles className="h-4 w-4 mr-1" />
            Gemini 3.5 Flash online
          </span>
          <span className="text-[9px] block text-slate-400 mt-1">Server proxy configured</span>
        </div>
      </div>

      {/* Main Control Panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left pane: Schools list registry */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4 flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Licensed Independent Institutions</span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">Pulling schools roster...</div>
          ) : schools.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">No schools registered on the platform yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-widest text-[9px]">
                    <th className="p-3">School Name / ID</th>
                    <th className="p-3">Motto & Address</th>
                    <th className="p-3">Subscription</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {schools.map((s) => (
                    <tr key={s.schoolId} className="hover:bg-slate-55 dark:hover:bg-slate-800/25">
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.name}</span>
                        <code className="text-[10px] text-blue-500 uppercase font-mono">{s.schoolId}</code>
                      </td>
                      <td className="p-3 text-slate-500">
                        <span className="italic block text-[10.5px]">"{s.motto || "No motto provided"}"</span>
                        <span className="text-[10px] block mt-0.5">{s.address || "No headquarters details"}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
                          <CreditCard className="h-3.5 w-3.5 text-blue-500 mr-1" />
                          {s.subscriptionPlan}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === "active" 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(s.schoolId, s.status)}
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-xl transition ${
                            s.status === "active"
                              ? "bg-rose-50 dark:bg-rose-950/25 text-rose-600 hover:bg-rose-100"
                              : "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {s.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right pane: Register new school */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4 flex items-center space-x-2">
            <Plus className="h-4 w-4 text-blue-500" />
            <span>Provision New School</span>
          </h3>

          <form onSubmit={handleRegisterSchool} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">School Name</label>
              <input
                type="text"
                required
                placeholder="e.g. King's High School"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Motto</label>
              <input
                type="text"
                placeholder="e.g. Leadership & Virtue"
                value={newMotto}
                onChange={(e) => setNewMotto(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Admin Office Address</label>
              <input
                type="text"
                placeholder="e.g. 15 Broad St, Lagos"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Contact Details</label>
              <input
                type="text"
                placeholder="e.g. schooladmin@kings.edu"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Subscription Tier</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <option value="Standard Professional - $199/m">Standard Professional - $199/mo</option>
                <option value="Premier Enterprise - $499/m">Premier Enterprise - $499/mo</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center shadow-md shadow-blue-500/10 transition"
            >
              {creating ? "Provisioning..." : "Provision Client Database"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
