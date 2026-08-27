"use client";

import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const passenger = JSON.parse(
      localStorage.getItem("passenger") || "{}"
    );

    if (!passenger?.id) return;

    fetch(
      `https://routex-smgu.onrender.com/notifications/${passenger.id}`
    )
      .then((res) => res.json())
      .then((data) => setNotifications(data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white border rounded-lg p-4 mb-3 shadow"
          >
            <h3 className="font-semibold">
              {notification.title}
            </h3>

            <p>{notification.message}</p>

            <p className="text-xs text-gray-500 mt-2">
              {new Date(
                notification.created_at
              ).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}