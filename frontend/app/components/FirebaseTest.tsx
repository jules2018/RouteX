"use client";

import { useEffect } from "react";
import { showNotification } from "../lib/notifications";

export default function FirebaseTest() {
  useEffect(() => {
    showNotification(
      "✅ Booking Confirmed",
      "Your RouteX trip has been booked successfully."
    );
  }, []);

  return null;
}