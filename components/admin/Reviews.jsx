"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/showToast';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (res.ok) setReviews(data.data.reviews || []);
      else showToast(data.message || 'Failed to load');
    } catch (e) {
      showToast(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const toggleApprove = async (id, current) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: !current }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Updated');
        fetchReviews();
      } else showToast(data.message || 'Update failed');
    } catch (e) {
      showToast(e.message || String(e));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Deleted');
        fetchReviews();
      } else showToast(data.message || 'Delete failed');
    } catch (e) {
      showToast(e.message || String(e));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Product</th>
              <th className="p-3">User</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Comment</th>
              <th className="p-3">Approved</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4">Loading...</td></tr>
            ) : reviews.length ? (
              reviews.map((r) => (
                <tr key={r._id} className="border-b">
                  <td className="p-3">{r.product?.name || '—'}</td>
                  <td className="p-3">{r.user?.name || r.user?.email || '—'}</td>
                  <td className="p-3">{r.rating}</td>
                  <td className="p-3">{r.comment || '—'}</td>
                  <td className="p-3">{r.isApproved ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <Button onClick={() => toggleApprove(r._id, r.isApproved)} size="sm">{r.isApproved ? 'Unapprove' : 'Approve'}</Button>
                    <Button variant="destructive" onClick={() => handleDelete(r._id)} size="sm" className="ml-2">Delete</Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="p-4">No reviews found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
