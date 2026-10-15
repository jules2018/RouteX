require("dotenv").config();

const pool = require("./db");

// =====================================================
// ROUTEX UPINGTON STREET IMPORTER
// =====================================================
//
// Purpose:
// - Add known Upington streets to RouteX
// - Never delete existing addresses
// - Never overwrite learned addresses
// - Remove duplicate street segments
// - Store representative street coordinates
//
// =====================================================

const fs = require("fs");
const path = require("path");

const streetsFile = path.join(__dirname, "data", "upington-streets.json");

const streets = JSON.parse(fs.readFileSync(streetsFile, "utf8"));

function normalizeStreetName(name) {
  return (
    String(name || "")
      // Remove road-width information:
      // "Beryl Street 13.00M" -> "Beryl Street"
      // "Kameeldoring Avenue 16,00M" -> "Kameeldoring Avenue"
      .replace(/\s+\d+[.,]\d+\s*M?\s*$/i, "")

      // Clean repeated spaces
      .replace(/\s+/g, " ")

      .trim()
  );
}

const STREET_NAME_FIXES = {
  "bass0n street": "Basson Street",
  "rossouw avenye": "Rossouw Avenue",
  "seinheuwel satreet": "Seinheuwel Street",
  "honeysuckel str": "Honeysuckle Street",
  honeysuckelstraat: "Honeysuckle Street",
};

function cleanStreetName(name) {
  const normalized = normalizeStreetName(name);

  return STREET_NAME_FIXES[normalized.toLowerCase()] || normalized;
}

function isUsableStreet(name) {
  const value = normalizeStreetName(name);

  if (!value) return false;

  // Reject unnamed/broken map records.
  if (/^street$/i.test(value)) return false;
  if (/^road$/i.test(value)) return false;

  // Reject numeric map artefacts.
  if (/^\d+$/.test(value)) return false;

  return value.length >= 3;
}

const DRY_RUN = process.argv.includes("--dry-run");
async function importStreets() {
  console.log("");
  console.log("========================================");
  console.log("RouteX Upington Street Import");
  console.log(
    DRY_RUN
      ? "MODE: DRY RUN - database will NOT be changed"
      : "MODE: LIVE IMPORT",
  );
  console.log("========================================");
  console.log("");

  let added = 0;
  let existing = 0;
  let skipped = 0;

  // ---------------------------------------------------
  // CLEAN + GROUP DUPLICATE STREET SEGMENTS
  // ---------------------------------------------------

  const grouped = new Map();

  for (const item of streets) {
    const address = cleanStreetName(item.address);

    if (!isUsableStreet(address)) {
      skipped++;
      continue;
    }

    const areaName = String(item.area_name || "Upington").trim();

    const key = `${areaName.toLowerCase()}::${address.toLowerCase()}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        address,
        area_name: areaName,
        coordinates: [],
      });
    }
    if (
      Number.isFinite(Number(item.lat)) &&
      Number.isFinite(Number(item.lng))
    ) {
      grouped.get(key).coordinates.push({
        lat: Number(item.lat),
        lng: Number(item.lng),
      });
    }
  }

  console.log(`Raw street records: ${streets.length}`);
  console.log(`Unique usable streets: ${grouped.size}`);
  console.log("");

  // ---------------------------------------------------
  // IMPORT
  // ---------------------------------------------------

  for (const [, street] of grouped) {
    if (street.coordinates.length === 0) {
      skipped++;
      continue;
    }

    // Use the average of all mapped segments as the
    // representative point for street-level searching.
    const lat =
      street.coordinates.reduce((sum, point) => sum + point.lat, 0) /
      street.coordinates.length;

    const lng =
      street.coordinates.reduce((sum, point) => sum + point.lng, 0) /
      street.coordinates.length;

    try {
      const found = await pool.query(
        `
  SELECT
    id,
    address,
    area_name,
    latitude,
    longitude
  FROM public.addresses
  WHERE LOWER(TRIM(address)) = LOWER(TRIM($1))
    AND (
      LOWER(TRIM(COALESCE(area_name, ''))) = LOWER(TRIM($2))

      -- Legacy RouteX records may not have an area saved.
      OR TRIM(COALESCE(area_name, '')) = ''

      -- Older records may simply use Upington as the general area.
      OR (
        LOWER(TRIM($2)) = 'upington'
        AND LOWER(TRIM(COALESCE(area_name, ''))) IN (
          'upington',
          'upington central'
        )
      )
    )
  LIMIT 1
  `,
        [street.address, street.area_name],
      );

      if (found.rows.length > 0) {
        existing++;
        console.log(`EXISTS: ${street.address}`);
        continue;
      }
      if (DRY_RUN) {
        added++;

        console.log(
          `WOULD ADD: ${street.address} | ${street.area_name} | ${lat.toFixed(
            6,
          )}, ${lng.toFixed(6)}`,
        );

        continue;
      }
      await pool.query(
        `
        INSERT INTO public.addresses (
          address,
          full_address,
          area_name,
          latitude,
          longitude,
          place_type
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          street.address,
          `${street.address}, ${street.area_name}, Northern Cape, South Africa`,
          street.area_name,
          lat,
          lng,
          "street",
        ],
      );

      added++;

      console.log(
        `ADDED: ${street.address} (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      );
    } catch (error) {
      skipped++;

      console.error(`FAILED: ${street.address}`, error.message);
    }
  }

  console.log("");
  console.log("========================================");
  console.log("IMPORT COMPLETE");
  console.log("========================================");
  console.log(`Added:          ${added}`);
  console.log(`Already exists: ${existing}`);
  console.log(`Skipped:        ${skipped}`);
  console.log("========================================");

  await pool.end();
}

importStreets().catch(async (error) => {
  console.error("IMPORT FAILED:", error);

  try {
    await pool.end();
  } catch {}

  process.exit(1);
});
