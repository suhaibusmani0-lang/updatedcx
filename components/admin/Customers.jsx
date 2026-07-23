"use client";

import React, { useEffect, useState } from 'react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch');
      setCustomers(data.data || []);
    } catch (err) {
      console.error(err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      const res = await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Delete failed');
      fetchCustomers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    const form = e.currentTarget;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const password = form.password.value;
    if (!name || !email) return setFormError('Name and email required');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Create failed');
      form.reset();
      fetchCustomers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleEdit = (customer) => {
    setEditing(customer);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    const form = e.currentTarget;
    const id = editing._id;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const password = form.password.value;
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Update failed');
      setEditing(null);
      fetchCustomers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Customers</h2>

      <div className="mb-6">
        <form onSubmit={handleCreate} className="flex gap-2 items-center">
          <input name="name" placeholder="Name" className="border p-2 rounded" />
          <input name="email" placeholder="Email" className="border p-2 rounded" />
          <input name="phone" placeholder="Phone" className="border p-2 rounded" />
          <input name="password" placeholder="Password" className="border p-2 rounded" />
          <button className="bg-blue-600 text-white px-3 py-2 rounded">Add</button>
        </form>
        {formError && <div className="text-red-600 mt-2">{formError}</div>}
      </div>

      {loading ? <div>Loading...</div> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.email}</td>
                <td className="p-2">{c.phone || '-'}</td>
                <td className="p-2">
                  <button onClick={() => handleEdit(c)} className="mr-2 text-blue-600">Edit</button>
                  <button onClick={() => handleDelete(c._id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="font-semibold mb-3">Edit Customer</h3>
            <form onSubmit={handleUpdate} className="flex flex-col gap-2">
              <input name="name" defaultValue={editing.name} className="border p-2 rounded" />
              <input name="email" defaultValue={editing.email} className="border p-2 rounded" />
              <input name="phone" defaultValue={editing.phone} className="border p-2 rounded" />
              <input name="password" placeholder="New password (optional)" className="border p-2 rounded" />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-3 py-2">Cancel</button>
                <button className="bg-blue-600 text-white px-3 py-2 rounded">Save</button>
              </div>
            </form>
            {formError && <div className="text-red-600 mt-2">{formError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
