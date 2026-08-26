"use client";

import { app } from "../lib/firebase";

export default function FirebaseTest() {
  console.log("Firebase Connected:", app.name);
  return null;
}