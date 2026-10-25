const express = require("express");
const cors = require("cors");
console.log("SERVER VERSION: DISCOUNT TEST");
const crypto = require("crypto");

const pool = require("./db");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function sendResetEmail(email, code) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "RouteX",
        email: "julietta.esterhuizen@outlook.com",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "Your RouteX password reset code",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px;">
          <h2>RouteX Password Reset</h2>
          <p>Your password reset code is:</p>
          <h1 style="letter-spacing: 6px;">${code}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not request a password reset, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo email failed: ${response.status} ${errorText}`);
  }
}

function hashResetCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

require("dotenv").config();

async function sendWhatsAppBookingAlert(phone, pickup, destination, fare) {
  try {
    let whatsappPhone = String(phone).replace(/\D/g, "");

    if (whatsappPhone.startsWith("0")) {
      whatsappPhone = "27" + whatsappPhone.substring(1);
    }
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: whatsappPhone,
          type: "template",

          template: {
            name: "routex_new_booking",

            language: {
              code: "en",
            },

            components: [
              {
                type: "body",

                parameters: [
                  {
                    type: "text",
                    text: String(pickup),
                  },
                  {
                    type: "text",
                    text: String(destination),
                  },
                  {
                    type: "text",
                    text: String(fare),
                  },
                ],
              },
            ],
          },
        }),
      },
    );

    const data = await response.json();

    console.log("WHATSAPP RESPONSE:", data);

    if (!response.ok) {
      console.error("WHATSAPP ERROR:", response.status, data);
    }

    return data;
  } catch (error) {
    console.error("WHATSAPP SEND ERROR:", error);
  }
}

async function sendWhatsAppDriverApproved(phone, driverName, setupLink) {
  try {
    let whatsappPhone = String(phone).replace(/\D/g, "");

    if (whatsappPhone.startsWith("0")) {
      whatsappPhone = "27" + whatsappPhone.substring(1);
    }

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: whatsappPhone,
          type: "template",

          template: {
            name: "routex_driver_approved",

            language: {
              code: "en",
            },

            components: [
              {
                type: "body",

                parameters: [
                  {
                    type: "text",
                    text: String(driverName),
                  },
                  {
                    type: "text",
                    text: String(setupLink),
                  },
                ],
              },
            ],
          },
        }),
      },
    );

    const data = await response.json();

    console.log("DRIVER APPROVAL WHATSAPP RESPONSE:", data);

    if (!response.ok) {
      console.error("DRIVER APPROVAL WHATSAPP ERROR:", response.status, data);
    }

    return data;
  } catch (error) {
    console.error("DRIVER APPROVAL WHATSAPP SEND ERROR:", error);
  }
}
const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

const allowedOrigins = [
  "https://routex-frontend.onrender.com",
];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3000");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
function authenticateDriver(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Driver authentication required. Please sign in again.",
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.DRIVER_JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (decoded.role !== "driver" || !decoded.driverId) {
      return res.status(403).json({
        error: "Invalid driver permissions.",
      });
    }

    req.authenticatedDriverId = String(decoded.driverId);
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Driver session expired or invalid. Please sign in again.",
    });
  }
}
app.use("/uploads", express.static("uploads"));

// =====================================
// WHATSAPP WEBHOOK VERIFICATION
// =====================================

app.get("/whatsapp-webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WHATSAPP WEBHOOK VERIFIED");

    return res.status(200).send(challenge);
  }

  console.log("WHATSAPP WEBHOOK VERIFICATION FAILED");

  return res.sendStatus(403);
});

// =====================================
// WHATSAPP WEBHOOK EVENTS
// =====================================

app.post("/whatsapp-webhook", (req, res) => {
  try {
    const entries = req.body?.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const statuses = change.value?.statuses || [];

        for (const status of statuses) {
          console.log("WHATSAPP DELIVERY STATUS:", {
            message_id: status.id,
            recipient_id: status.recipient_id,
            status: status.status,
            timestamp: status.timestamp,
            errors: status.errors || null,
          });
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("WHATSAPP WEBHOOK ERROR:", error);

    return res.sendStatus(200);
  }
});
app.get("/", (req, res) => {
  res.json({
    message: "ROUTEX BUILD 20260812",
  });
});

app.get("/areas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT area_name
      FROM areas
      ORDER BY area_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("AREAS ERROR:", error);

    res.status(500).json({
      error: "Failed to load areas",
    });
  }
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/passengers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM passengers ORDER BY id DESC",
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/passengers", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      pickup_town,
      pickup_address,
      dropoff_town,
      dropoff_address,
      travel_date,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO passengers
      (
        full_name,
        phone,
        pickup_town,
        pickup_address,
        dropoff_town,
        dropoff_address,
        fare,
        payment_status,
        travel_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,650,'Pending',$7)
      RETURNING *
      `,
      [
        full_name,
        phone,
        pickup_town,
        pickup_address,
        dropoff_town,
        dropoff_address,
        travel_date,
      ],
    );
    console.log(result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/vehicles", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vehicles ORDER BY id DESC");

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/vehicles", async (req, res) => {
  try {
    const { registration, capacity } = req.body;

    const result = await pool.query(
      `
      INSERT INTO vehicles
      (
        registration,
        capacity
      )
      VALUES ($1, $2)
      RETURNING *
      `,
      [registration, capacity],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/drivers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM drivers ORDER BY id DESC");

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Normalize South African mobile numbers
    const normalizedPhone = phone.replace(/\D/g, "");

    let phoneVariants = [normalizedPhone];

    if (normalizedPhone.startsWith("27")) {
      phoneVariants.push("0" + normalizedPhone.substring(2));
    }

    if (normalizedPhone.startsWith("0")) {
      phoneVariants.push("27" + normalizedPhone.substring(1));
    }

    const passengerResult = await pool.query(
      `SELECT u.id, u.email, u.role
       FROM public.users u
       JOIN public.passengers p ON p.email = u.email
       WHERE REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g') = ANY($1)
         AND u.role = 'passenger'
       LIMIT 1`,
      [phoneVariants],
    );

    if (passengerResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "If an account exists, a verification code has been sent.",
      });
    }

    const user = passengerResult.rows[0];

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashResetCode(code);

    await pool.query(
      `UPDATE password_reset_codes
       SET used = TRUE
       WHERE user_id = $1
         AND role = 'passenger'
         AND used = FALSE`,
      [user.id],
    );

    await pool.query(
      `INSERT INTO password_reset_codes
       (user_id, role, code_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [user.id, "passenger", codeHash],
    );

    await sendResetEmail(user.email, code);

    return res.json({
      success: true,
      message: "If an account exists, a verification code has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
});

app.post("/drivers", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      license_number,
      vehicle_type,
      vehicle_color,
      license_plate,
    } = req.body;

    const result = await pool.query(
      `
  INSERT INTO drivers
  (
    full_name,
    phone,
    license_number,
    vehicle_type,
    vehicle_color,
    license_plate,
    driver_terms_accepted_at,
    driver_terms_version,
    privacy_accepted_at,
    privacy_version
  )
  VALUES (
    $1,$2,$3,$4,$5,$6,
    NOW(),$7,
    NOW(),$8
  )
  RETURNING *
  `,
      [
        full_name,
        phone,
        license_number,
        vehicle_type,
        vehicle_color,
        license_plate,
        "2026-09-14",
        "2026-09-14",
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/trips", async (req, res) => {
  try {
    const { route_name, departure_date, vehicle_id, driver_id } = req.body;
    const vehicleCheck = await pool.query(
      `
  SELECT *
  FROM vehicles
  WHERE id = $1
  AND status = 'Available'
  `,
      [vehicle_id],
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(400).json({
        message: "Vehicle not available",
      });
    }

    const driverCheck = await pool.query(
      `
  SELECT *
  FROM drivers
  WHERE id = $1
  AND status = 'Available'
  `,
      [driver_id],
    );

    if (driverCheck.rows.length === 0) {
      return res.status(400).json({
        message: "Driver not available",
      });
    }
    const result = await pool.query(
      `
      INSERT INTO trips
      (
        route_name,
        departure_date,
        vehicle_id,
        driver_id
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [route_name, departure_date, vehicle_id, driver_id],
    );
    await pool.query(
      `
  UPDATE vehicles
  SET status = 'Assigned'
  WHERE id = $1
  `,
      [vehicle_id],
    );

    await pool.query(
      `
  UPDATE drivers
  SET status = 'Assigned'
  WHERE id = $1
  `,
      [driver_id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/trip-bookings", async (req, res) => {
  try {
    const { trip_id, passenger_id, promo_code } = req.body;

    const result = await pool.query(
      `
    INSERT INTO trip_bookings
(
  trip_id,
  passenger_id,
  promo_code
)
VALUES ($1,$2,$3)
      RETURNING *
      `,
      [trip_id, passenger_id, promo_code || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post(
  "/driver/upload-photo",
  authenticateDriver,
  upload.single("photo"),
  async (req, res) => {
  try {
    console.log("DRIVER UPLOAD ROUTE HIT");

    const { driverId } = req.body;
if (String(driverId) !== req.authenticatedDriverId) {
  return res.status(403).json({
    success: false,
    error: "You are not authorized to update another driver's photo.",
  });
}
    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: "Driver ID is missing",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file received",
      });
    }

    const fileExt = req.file.originalname.split(".").pop() || "jpg";

    const fileName = `drivers/${driverId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("SUPABASE UPLOAD ERROR:", uploadError);

      return res.status(500).json({
        success: false,
        error: "Failed to upload driver photo",
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    const result = await pool.query(
      `
        UPDATE drivers
        SET profile_image = $1
        WHERE id = $2
        RETURNING id, profile_image
        `,
      [imageUrl, driverId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Driver not found",
      });
    }

    res.json({
      success: true,
      image: imageUrl,
      driver: result.rows[0],
    });
  } catch (error) {
    console.error("DRIVER UPLOAD PHOTO ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
/* =========================================================
   PASSENGER PROFILE PHOTO
========================================================= */

app.post(
  "/passenger/upload-photo",
  upload.single("photo"),
  async (req, res) => {
    try {
      const { passengerId } = req.body;
      const file = req.file;

      console.log("PASSENGER PHOTO UPLOAD START");
      console.log("Passenger ID:", passengerId);

      // -----------------------------------------------------
      // VALIDATE PASSENGER
      // -----------------------------------------------------

      if (!passengerId) {
        return res.status(400).json({
          success: false,
          error: "Passenger ID is required.",
        });
      }

      // -----------------------------------------------------
      // VALIDATE FILE
      // -----------------------------------------------------

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No photo was uploaded.",
        });
      }

      console.log("File name:", file.originalname);
      console.log("File type:", file.mimetype);
      console.log("File size:", file.size);

      // -----------------------------------------------------
      // CHECK PASSENGER EXISTS
      // -----------------------------------------------------

      const passengerCheck = await pool.query(
        `
        SELECT id
        FROM passengers
        WHERE id = $1
        `,
        [passengerId],
      );

      if (passengerCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Passenger not found.",
        });
      }

      // -----------------------------------------------------
      // CREATE SAFE FILE NAME
      // -----------------------------------------------------

      const extension =
        file.originalname.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `passengers/${passengerId}-${Date.now()}.${extension}`;

      console.log("Uploading to Supabase:", fileName);

      // -----------------------------------------------------
      // UPLOAD TO SUPABASE STORAGE
      // -----------------------------------------------------

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("SUPABASE UPLOAD ERROR:", uploadError);

        return res.status(500).json({
          success: false,
          error: uploadError.message,
        });
      }

      // -----------------------------------------------------
      // GET PUBLIC PHOTO URL
      // -----------------------------------------------------

      const { data: publicUrlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData?.publicUrl;

      if (!imageUrl) {
        console.error("Could not create public image URL.");

        return res.status(500).json({
          success: false,
          error: "Could not create profile photo URL.",
        });
      }

      console.log("PROFILE IMAGE URL:", imageUrl);

      // -----------------------------------------------------
      // SAVE URL TO POSTGRESQL
      // -----------------------------------------------------

      const result = await pool.query(
        `
        UPDATE passengers
        SET profile_image = $1
        WHERE id = $2
        RETURNING *
        `,
        [imageUrl, passengerId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Passenger not found.",
        });
      }

      console.log("PASSENGER PHOTO SAVED");

      // -----------------------------------------------------
      // RETURN SAVED PASSENGER + IMAGE
      // -----------------------------------------------------

      return res.json({
        success: true,

        // Makes data.image available
        image: result.rows[0].profile_image,

        // Also returns updated passenger
        passenger: result.rows[0],
      });
    } catch (error) {
      console.error("PASSENGER PHOTO UPLOAD ERROR:", error);

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload profile photo.",
      });
    }
  },
);

// Signed, short-lived fare quotes ensure the passenger's displayed fare
// is the same fare verified when the booking is submitted.
const ROUTEX_FARE_QUOTE_TTL_MS = 10 * 60 * 1000;

function routeXFareQuoteSecret() {
  const secret =
    process.env.ROUTEX_FARE_QUOTE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("A stable ROUTEX_FARE_QUOTE_SECRET must be configured.");
  }
  return secret;
}

function signRouteXFareQuote(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", routeXFareQuoteSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifyRouteXFareQuote(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, suppliedSignature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", routeXFareQuoteSecret())
    .update(encodedPayload)
    .digest();

  let actualSignature;
  try {
    actualSignature = Buffer.from(suppliedSignature, "base64url");
  } catch {
    return null;
  }

  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (
      !Number.isFinite(payload.expires_at) ||
      payload.expires_at < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function routeXPickupSurcharge(distanceKm) {
  if (distanceKm <= 2) return 0;
  if (distanceKm <= 5) return 5;
  if (distanceKm <= 8) return 10;
  return 20;
}

async function calculateRouteXPickupDistance(pickupLat, pickupLng) {
  const candidatesResult = await pool.query(
    `
    SELECT
      id,
      current_lat,
      current_lng,
      (
        6371 * ACOS(
          LEAST(1, GREATEST(-1,
            COS(RADIANS($1)) * COS(RADIANS(current_lat)) *
            COS(RADIANS(current_lng) - RADIANS($2)) +
            SIN(RADIANS($1)) * SIN(RADIANS(current_lat))
          ))
        )
      ) AS straight_distance_km
    FROM drivers
    WHERE status = 'Available'
      AND is_online = true
      AND current_lat IS NOT NULL
      AND current_lng IS NOT NULL
      AND (
        6371 * ACOS(
          LEAST(1, GREATEST(-1,
            COS(RADIANS($1)) * COS(RADIANS(current_lat)) *
            COS(RADIANS(current_lng) - RADIANS($2)) +
            SIN(RADIANS($1)) * SIN(RADIANS(current_lat))
          ))
        )
      ) <= 30
    ORDER BY straight_distance_km ASC
    LIMIT 8
    `,
    [pickupLat, pickupLng],
  );

  const candidates = candidatesResult.rows;
  if (!candidates.length) {
    const error = new Error(
      "No available driver with a recent GPS location can be used to estimate this pickup fee. Please try again later.",
    );
    error.statusCode = 503;
    throw error;
  }

  // Ask OSRM for road distances from the eight closest GPS candidates to pickup.
  // This compares road distance rather than relying on straight-line distance.
  const coordinates = [
    ...candidates.map(
      (driver) => `${Number(driver.current_lng)},${Number(driver.current_lat)}`,
    ),
    `${pickupLng},${pickupLat}`,
  ].join(";");
  const destinationIndex = candidates.length;
  const sources = candidates.map((_, index) => index).join(";");
  const tableUrl =
    `https://router.project-osrm.org/table/v1/driving/${coordinates}` +
    `?sources=${sources}&destinations=${destinationIndex}&annotations=distance`;

  const response = await fetch(tableUrl);
  if (!response.ok) {
    const error = new Error(
      "Driver pickup distance could not be calculated. Please try again later.",
    );
    error.statusCode = 503;
    throw error;
  }

  const table = await response.json();
  const distances = Array.isArray(table.distances) ? table.distances : [];
  const ranked = candidates
    .map((driver, index) => ({
      driver_id: Number(driver.id),
      distance_km: Number(distances[index]?.[0]) / 1000,
    }))
    .filter(
      (entry) => Number.isFinite(entry.distance_km) && entry.distance_km >= 0,
    )
    .sort((a, b) => a.distance_km - b.distance_km);

  if (table.code !== "Ok" || !ranked.length) {
    const error = new Error(
      "Driver pickup distance could not be calculated. Please try again later.",
    );
    error.statusCode = 503;
    throw error;
  }

  return {
    driver_id: ranked[0].driver_id,
    distance_km: Number(ranked[0].distance_km.toFixed(2)),
    surcharge: routeXPickupSurcharge(ranked[0].distance_km),
  };
}

// ------------------------------------------------------------
// SHARED SERVER-SIDE ROUTEX FARE CALCULATION
// Keep this function as the single source of truth for both
// fare quotes and booking creation.
// ------------------------------------------------------------
const ROUTEX_UPINGTON_CENTRE_LAT = -28.4575;
const ROUTEX_UPINGTON_CENTRE_LNG = 21.2427;

function routeXDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routeXDistanceFare(distanceKm) {
  // Local road-distance base fares; pickup surcharge and out-of-town fee are separate.
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error("Invalid route distance for fare calculation.");
  }

  if (distanceKm <= 2) return 50;
  if (distanceKm <= 3) return 55;
  if (distanceKm <= 4) return 55;
  if (distanceKm <= 5) return 60;
  if (distanceKm <= 6) return 65;
  if (distanceKm <= 7) return 75;
  if (distanceKm <= 8) return 85;
  if (distanceKm <= 9) return 95;
  if (distanceKm <= 10) return 105;

  // Preserve the original fare formula for journeys over 10 km.
  const minimumFare = 50;
  const shortTripRate = 8;
  const longTripRate = 2;
  const shortRateDistance = Math.min(Math.max(distanceKm - 2, 0), 8);
  const longRateDistance = Math.max(distanceKm - 10, 0);
  const rawFare =
    minimumFare +
    shortRateDistance * shortTripRate +
    longRateDistance * longTripRate;
  return Math.ceil(rawFare / 5) * 5;
}
// RouteX night fare pricing (South African time)
function calculateRouteXNightFare(baseFare, pickupDate) {
  const date = new Date(pickupDate);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid pickup date for fare calculation.");
  }

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date)
  );

  let percentage = 0;
  let minimumSurcharge = 0;
  let minimumFare = 0;

  if (hour >= 22 || hour < 5) {
    percentage = 0.40;
    minimumFare = 100;
  } else if (hour >= 20 && hour < 22) {
    percentage = 0.25;
    minimumSurcharge = 15;
  }

  const surcharge =
    percentage === 0
      ? 0
      : Math.max(
          minimumSurcharge,
          Math.ceil((baseFare * percentage) / 5) * 5
        );

  const totalFare = Math.max(baseFare + surcharge, minimumFare);

  return {
    night_surcharge: totalFare - baseFare,
    night_percentage: percentage * 100,
    night_minimum_fare: minimumFare,
    journey_fare: totalFare,
  };
}
// Minimum journey fare for trips starting or ending in Louisvale.
// Applies to both Ride Now and scheduled bookings.
function applyLouisvaleMinimumFare(fare, pickupArea, dropoffArea) {
  const isLouisvale = (area) =>
   /^(louisvale|louisevale|lousivale)(\s+weg)?(\s*-\s*upington)?$/i.test(
      String(area || "").trim()
    );

  if (!isLouisvale(pickupArea) && !isLouisvale(dropoffArea)) {
    return fare;
  }

  return {
    ...fare,
    louisvale_minimum_applied: Number(fare.fare) < 100,
    fare: Math.max(Number(fare.fare), 100),
  };
}
async function calculateRouteXFare({
  pickup_area,
  dropoff_area,
  pickup_lat,
  pickup_lng,
  dropoff_lat,
  dropoff_lng,
}) {
  const pickupLat = Number(pickup_lat);
  const pickupLng = Number(pickup_lng);
  const dropoffLat = Number(dropoff_lat);
  const dropoffLng = Number(dropoff_lng);
  const hasCoordinates =
    pickup_lat != null &&
    pickup_lng != null &&
    dropoff_lat != null &&
    dropoff_lng != null &&
    Number.isFinite(pickupLat) &&
    Number.isFinite(pickupLng) &&
    Number.isFinite(dropoffLat) &&
    Number.isFinite(dropoffLng) &&
    pickupLat >= -90 &&
    pickupLat <= 90 &&
    dropoffLat >= -90 &&
    dropoffLat <= 90 &&
    pickupLng >= -180 &&
    pickupLng <= 180 &&
    dropoffLng >= -180 &&
    dropoffLng <= 180;

  if (hasCoordinates) {
    try {
      const routeUrl =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}?overview=false`;
      const routeResponse = await fetch(routeUrl);
      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        if (
          routeData.code === "Ok" &&
          Array.isArray(routeData.routes) &&
          routeData.routes.length > 0
        ) {
          const distanceKm = Number(routeData.routes[0].distance) / 1000;
          if (Number.isFinite(distanceKm) && distanceKm >= 0) {
            const standardBaseFare = routeXDistanceFare(distanceKm);
            const pickupDistanceFromUpington = routeXDistanceKm(
              pickupLat,
              pickupLng,
              ROUTEX_UPINGTON_CENTRE_LAT,
              ROUTEX_UPINGTON_CENTRE_LNG,
            );
            const dropoffDistanceFromUpington = routeXDistanceKm(
              dropoffLat,
              dropoffLng,
              ROUTEX_UPINGTON_CENTRE_LAT,
              ROUTEX_UPINGTON_CENTRE_LNG,
            );
            const outOfTownFee =
              pickupDistanceFromUpington > 20 ||
              dropoffDistanceFromUpington > 20
                ? 50
                : 0;
            // Only long out-of-town routes get an additional distance allowance.
            // All local Upington fares and shorter out-of-town fares remain unchanged.
            // At 26.3 km: standard R150 + R50 allowance = R200 trip fare.
            const longOutOfTownAllowance =
              outOfTownFee > 0 && distanceKm > 20
                ? Math.ceil((8 * (distanceKm - 20)) / 5) * 5
                : 0;
            const baseFare = standardBaseFare + longOutOfTownAllowance;
            return applyLouisvaleMinimumFare({
              pricing_method: "distance",
              distance_km: Number(distanceKm.toFixed(2)),
              base_fare: baseFare,
              out_of_town_fee: outOfTownFee,
              pickup_distance_from_upington: Number(
                pickupDistanceFromUpington.toFixed(2),
              ),
              discount: 0,
              fare: baseFare + outOfTownFee,
          }, pickup_area, dropoff_area);
          }
        }
      }

      console.warn("OSRM route unavailable for coordinate-based fare.");
    } catch (error) {
      console.error("OSRM fare calculation failed:", error.message);
    }

    const error = new Error(
      "Road distance could not be calculated. Please try again later.",
    );
    error.statusCode = 503;
    throw error;
  }

  const pickupResult = await pool.query(
    `SELECT category FROM public.areas WHERE area_name = $1`,
    [pickup_area],
  );
  const dropoffResult = await pool.query(
    `SELECT category FROM public.areas WHERE area_name = $1`,
    [dropoff_area],
  );

  if (pickupResult.rows.length === 0 || dropoffResult.rows.length === 0) {
    const error = new Error(
      "Pickup or drop-off area was not recognised. Please select an address from the search results.",
    );
    error.statusCode = 400;
    throw error;
  }

  const pickupCategory = pickupResult.rows[0].category;
  const dropoffCategory = dropoffResult.rows[0].category;
  let baseFare;

  if (pickup_area === dropoff_area) {
    baseFare = 40;
  } else {
    const fareResult = await pool.query(
      `SELECT fare FROM public.fare_matrix WHERE from_category = $1 AND to_category = $2`,
      [pickupCategory, dropoffCategory],
    );
    if (fareResult.rows.length === 0) {
      const error = new Error(
        "Fare is not configured for this route yet. Please try another address or contact RouteX.",
      );
      error.statusCode = 400;
      throw error;
    }
    baseFare = Number(fareResult.rows[0].fare);
    if (!Number.isFinite(baseFare) || baseFare <= 0) {
      throw new Error("The configured fare for this route is invalid.");
    }
  }

  // Keep the area-matrix fallback shape consistent with distance pricing.
return applyLouisvaleMinimumFare({
    pricing_method: "area",
    distance_km: null,
    pickup_category: pickupCategory,
    dropoff_category: dropoffCategory,
    base_fare: baseFare,
    out_of_town_fee: 0,
    pickup_distance_from_upington: null,
    discount: 0,
    fare: baseFare,
 }, pickup_area, dropoff_area);
}

app.post("/bookings", async (req, res) => {
  try {
    console.log("BOOKINGS ROUTE HIT");

    const {
      passenger_id,
      pickup_area,
      dropoff_area,
      pickup_address,
      dropoff_address,

      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,

      travel_date,
      pickup_time,
      ride_type = "now",
      fare_amount,
      fare_quote_token,
      promo_code,
    } = req.body;

    const isScheduledRide = ride_type === "scheduled";

    if (!passenger_id || !pickup_address || !dropoff_address) {
      return res.status(400).json({
        error:
          "Passenger, pickup address and destination address are required.",
      });
    }

    if (!Number.isFinite(Number(fare_amount)) || Number(fare_amount) <= 0) {
      return res.status(400).json({
        error:
          "A valid quoted fare is required. Please recalculate the fare and try again.",
      });
    }

    if (ride_type !== "now" && ride_type !== "scheduled") {
      return res.status(400).json({ error: "Invalid ride type." });
    }

    let scheduledPickupAt = null;
    let matchingOpensAt = null;

    if (isScheduledRide) {
      if (!travel_date || !pickup_time) {
        return res.status(400).json({
          error:
            "Travel date and pickup time are required for a scheduled ride.",
        });
      }

      // RouteX operates in South Africa (UTC+2).
      // Store the scheduled instant as timestamptz.
      scheduledPickupAt = new Date(`${travel_date}T${pickup_time}:00+02:00`);

      if (Number.isNaN(scheduledPickupAt.getTime())) {
        return res.status(400).json({
          error: "Invalid scheduled pickup date or time.",
        });
      }

      matchingOpensAt = new Date(scheduledPickupAt.getTime() - 30 * 60 * 1000);

      if (scheduledPickupAt <= new Date()) {
        return res.status(400).json({
          error: "Scheduled pickup time must be in the future.",
        });
      }
    }

    // Ride Now requires confirmed passenger GPS.
    // Scheduled rides use the selected pickup address coordinates instead.
    const pickupLatNumber = Number(pickup_lat);
    const pickupLngNumber = Number(pickup_lng);

    if (
      !isScheduledRide &&
      (pickup_lat == null ||
        pickup_lng == null ||
        !Number.isFinite(pickupLatNumber) ||
        !Number.isFinite(pickupLngNumber) ||
        pickupLatNumber < -90 ||
        pickupLatNumber > 90 ||
        pickupLngNumber < -180 ||
        pickupLngNumber > 180)
    ) {
      return res.status(400).json({
        error:
          "A valid passenger GPS pickup location is required to create a Ride Now booking.",
      });
    }

    console.log("Pickup Area:", pickup_area);
    console.log("Dropoff Area:", dropoff_area);

    const pickupAreaResult = await pool.query(
      `
  SELECT latitude, longitude
  FROM areas
  WHERE area_name = $1
  `,
      [pickup_area],
    );

    const dropoffAreaResult = await pool.query(
      `
  SELECT latitude, longitude
  FROM areas
  WHERE area_name = $1
  `,
      [dropoff_area],
    );
    console.log("Pickup Lookup:", pickupAreaResult.rows);

    console.log("Dropoff Lookup:", dropoffAreaResult.rows);
    // Ride Now uses confirmed passenger GPS.
    // Scheduled rides use the coordinates selected with the pickup address,
    // falling back to the pickup area's coordinates if necessary.
    const scheduledPickupLat =
      pickup_lat != null && Number.isFinite(Number(pickup_lat))
        ? Number(pickup_lat)
        : Number(pickupAreaResult.rows[0]?.latitude);

    const scheduledPickupLng =
      pickup_lng != null && Number.isFinite(Number(pickup_lng))
        ? Number(pickup_lng)
        : Number(pickupAreaResult.rows[0]?.longitude);

    const pickupLat = isScheduledRide ? scheduledPickupLat : pickupLatNumber;

    const pickupLng = isScheduledRide ? scheduledPickupLng : pickupLngNumber;

    if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng)) {
      return res.status(400).json({
        error: isScheduledRide
          ? "The selected scheduled pickup address does not have valid coordinates."
          : "A valid pickup location is required.",
      });
    }

    // Use the selected destination's coordinates when available.
    // Fall back to the area's coordinates if necessary.
    const destinationLat =
      dropoff_lat != null
        ? Number(dropoff_lat)
        : dropoffAreaResult.rows[0]?.latitude;

    const destinationLng =
      dropoff_lng != null
        ? Number(dropoff_lng)
        : dropoffAreaResult.rows[0]?.longitude;

    if (
      !Number.isFinite(Number(pickupLat)) ||
      Number(pickupLat) < -90 ||
      Number(pickupLat) > 90 ||
      !Number.isFinite(Number(pickupLng)) ||
      Number(pickupLng) < -180 ||
      Number(pickupLng) > 180 ||
      !Number.isFinite(Number(destinationLat)) ||
      Number(destinationLat) < -90 ||
      Number(destinationLat) > 90 ||
      !Number.isFinite(Number(destinationLng)) ||
      Number(destinationLng) < -180 ||
      Number(destinationLng) > 180
    ) {
      return res.status(400).json({
        error:
          "The pickup or destination address has invalid GPS coordinates. Please select the address again.",
      });
    }

    console.log("FINAL PICKUP GPS:", {
      lat: pickupLat,
      lng: pickupLng,
    });

    console.log("FINAL DESTINATION GPS:", {
      lat: destinationLat,
      lng: destinationLng,
    });

    // Verify the signed quote created by GET /calculate-fare. The token locks
    // the fare components and route for ten minutes, including the driver pickup estimate.
    let verifiedFare;
    let quotePayload;
    try {
      quotePayload = verifyRouteXFareQuote(fare_quote_token);
    } catch (quoteError) {
      console.error("FARE QUOTE VERIFICATION ERROR:", quoteError.message);
      quotePayload = null;
    }

    const sameCoordinate = (a, b) =>
      Number.isFinite(Number(a)) &&
      Number.isFinite(Number(b)) &&
      Math.abs(Number(a) - Number(b)) < 0.000001;

      // Verify that the pickup time matches the signed fare quote.
      const quoteMatchesPickupTime =
        isScheduledRide
    ? scheduledPickupAt instanceof Date &&
      !Number.isNaN(scheduledPickupAt.getTime()) &&
      quotePayload?.scheduled_pickup_at ===
        scheduledPickupAt.toISOString()
    : quotePayload?.scheduled_pickup_at == null;

      const quoteMatchesRoute =
      quotePayload &&
      quoteMatchesPickupTime &&
      sameCoordinate(quotePayload.pickup_lat, pickupLat) &&
      sameCoordinate(quotePayload.pickup_lng, pickupLng) &&
      sameCoordinate(quotePayload.dropoff_lat, destinationLat) &&
      sameCoordinate(quotePayload.dropoff_lng, destinationLng) &&
      String(quotePayload.pickup_area || "") === String(pickup_area || "") &&
      String(quotePayload.dropoff_area || "") === String(dropoff_area || "") &&
      quotePayload.ride_type === ride_type;

    if (!quoteMatchesRoute) {
      return res.status(409).json({
        quote_expired: true,
        error:
          "Your fare quote has expired or no longer matches this route. Please review a refreshed fare before booking again.",
      });
    }

    verifiedFare = quotePayload.fare;
    const quotedFare = Number(fare_amount);
    const baseFare = Number(verifiedFare.fare);

    if (!Number.isFinite(baseFare) || baseFare <= 0) {
      return res
        .status(400)
        .json({ error: "The fare could not be verified. Please try again." });
    }

    if (Math.abs(quotedFare - baseFare) > 0.01) {
      return res.status(409).json({
        fare_changed: true,
        error:
          "The fare does not match the signed quote. Please review the updated fare and submit your booking again.",
        fare: baseFare,
        base_fare: verifiedFare.base_fare,
        pickup_surcharge: verifiedFare.pickup_surcharge,
        pickup_distance_km: verifiedFare.pickup_distance_km,
        out_of_town_fee: verifiedFare.out_of_town_fee,
        distance_km: verifiedFare.distance_km,
        fare_quote_token,
      });
    }

    let discountAmount = 0;

    if (promo_code && promo_code.trim().toUpperCase() === "WELCOME20") {
      // Check if this passenger has already used WELCOME20
      const existingPassengerPromo = await pool.query(
        `
    SELECT id
    FROM trip_bookings
    WHERE passenger_id = $1
      AND UPPER(TRIM(promo_code)) = 'WELCOME20'
      AND discount_amount > 0
    LIMIT 1
    `,
        [passenger_id],
      );

      // Check how many times WELCOME20 has been used in total
      const totalPromoUses = await pool.query(
        `
    SELECT COUNT(*)::int AS total
    FROM trip_bookings
    WHERE UPPER(TRIM(promo_code)) = 'WELCOME20'
      AND discount_amount > 0
    `,
      );

      const promoUses = totalPromoUses.rows[0]?.total || 0;

      if (existingPassengerPromo.rows.length > 0) {
        return res.status(400).json({
          error: "You have already used WELCOME20.",
        });
      }
      if (promoUses >= 10) {
        return res.status(400).json({
          error: "WELCOME20 has reached its 10-person limit.",
        });
      }

      // Apply discount only if:
      // 1. Passenger has never used it
      // 2. Fewer than 10 people have used it
      if (existingPassengerPromo.rows.length === 0 && promoUses < 10) {
        discountAmount = 20;
      }
    }

    const passengerAmount = Math.max(0, baseFare - discountAmount);

    console.log("Base Fare:", baseFare);
    console.log("Discount:", discountAmount);
    console.log("Passenger Pays:", passengerAmount);
    console.log("Driver Fare:", baseFare);

    console.log("Original Fare:", fare_amount);
    console.log("Promo Code:", promo_code);
    console.log("Passenger Pays:", passengerAmount);

    // -----------------------------------------------------
    // CREATE EXACTLY ONE ACTIVE BOOKING PER PASSENGER
    // -----------------------------------------------------
    // The transaction + advisory lock prevents two nearly simultaneous
    // POST /bookings requests from creating duplicate active bookings.
    const bookingClient = await pool.connect();
    let newBooking;

    try {
      await bookingClient.query("BEGIN");

      // Lock booking creation for this passenger for this transaction.
      await bookingClient.query("SELECT pg_advisory_xact_lock($1)", [
        Number(passenger_id),
      ]);

      // Expire any old waiting request before checking for an active ride.
      await bookingClient.query(
        `
    UPDATE trip_bookings
    SET
      booking_status = 'Expired',
      trip_status = 'Expired'
    WHERE passenger_id = $1
      AND booking_status = 'Waiting'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
    `,
        [passenger_id],
      );

      // A passenger may only have one live ride request at a time.
      let activeBookingResult;

      if (isScheduledRide) {
        // A current Ride Now must NOT prevent the passenger
        // from booking a future scheduled ride.
        //
        // Only check for another future scheduled booking.
        activeBookingResult = await bookingClient.query(
          `
    SELECT
      id,
      booking_status,
      trip_status,
      ride_type,
      scheduled_pickup_at
    FROM trip_bookings
    WHERE passenger_id = $1
      AND ride_type = 'scheduled'
      AND trip_status IN ('Scheduled', 'Waiting', 'Accepted', 'In Progress')
    ORDER BY scheduled_pickup_at ASC
    LIMIT 1
    `,
          [passenger_id],
        );

        if (activeBookingResult.rows.length > 0) {
          await bookingClient.query("ROLLBACK");

          return res.status(409).json({
            error: "You already have an upcoming scheduled RouteX ride.",
            booking: activeBookingResult.rows[0],
          });
        }
      } else {
        // Ride Now:
        // prevent multiple simultaneous immediate rides,
        // but ignore future Scheduled rides.
        activeBookingResult = await bookingClient.query(
          `
    SELECT
      id,
      booking_status,
      trip_status,
      ride_type
    FROM trip_bookings
    WHERE passenger_id = $1
      AND COALESCE(ride_type, 'now') = 'now'
      AND trip_status IN ('Waiting', 'Accepted', 'In Progress')
    ORDER BY id DESC
    LIMIT 1
    `,
          [passenger_id],
        );

        if (activeBookingResult.rows.length > 0) {
          await bookingClient.query("ROLLBACK");

          return res.status(409).json({
            error: "You already have an active RouteX ride.",
            booking: activeBookingResult.rows[0],
          });
        }
      }
      const bookingResult = await bookingClient.query(
        `
      INSERT INTO trip_bookings
      (
        passenger_id,
        fare_amount,
        discount_amount,
        passenger_amount,
        promo_code,
        pickup_address,
        dropoff_address,
        travel_date,
        trip_status,
        booking_status,
        pickup_lat,
        pickup_lng,
        destination_lat,
        destination_lng,
        expires_at,
        ride_type,
        scheduled_pickup_at,
        matching_opens_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18
      )
      RETURNING *
    `,
        [
          passenger_id,
          baseFare,
          discountAmount,
          passengerAmount,
          promo_code || null,
          pickup_address,
          dropoff_address,
          travel_date,
          isScheduledRide ? "Scheduled" : "Waiting",
          isScheduledRide ? "Scheduled" : "Waiting",
          pickupLat,
          pickupLng,
          destinationLat,
          destinationLng,
          isScheduledRide ? null : new Date(Date.now() + 10 * 60 * 1000),
          isScheduledRide ? "scheduled" : "now",
          isScheduledRide ? scheduledPickupAt : null,
          isScheduledRide ? matchingOpensAt : null,
        ],
      );

      newBooking = bookingResult.rows[0];
      await bookingClient.query("COMMIT");
    } catch (bookingError) {
      await bookingClient.query("ROLLBACK");
      throw bookingError;
    } finally {
      bookingClient.release();
    }

    // RouteX address learning: save only after booking creation succeeds.
    // These records are private and are NOT added to public.addresses.
    // Failure must never prevent a valid booking from succeeding.
    try {
      const saveLocation = async (role, label, lat, lng) => {
        const latitude = Number(lat);
        const longitude = Number(lng);
        const safeLabel = String(label || "").trim().slice(0, 500);
        if (
          !safeLabel || /^(current location|gps pickup|gps destination)$/i.test(safeLabel) ||
          !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
        ) return;

        // Deduplicate within approximately 40 metres for the same passenger.
        // Keep the first saved label/coordinates as the stable reference.
        await pool.query(`
          INSERT INTO public.passenger_saved_locations
            (passenger_id, booking_id, label, full_address, latitude, longitude,
             location_role, source, is_public)
          SELECT $1, $2, $3, $3, $4, $5, $6, 'confirmed_booking', FALSE
          WHERE NOT EXISTS (
            SELECT 1 FROM public.passenger_saved_locations
            WHERE passenger_id = $1
              AND (6371000 * 2 * ASIN(LEAST(1, SQRT(
                POWER(SIN(RADIANS(latitude - $4) / 2), 2) +
                COS(RADIANS($4)) * COS(RADIANS(latitude)) *
                POWER(SIN(RADIANS(longitude - $5) / 2), 2)
              )))) < 40
          )
        `, [passenger_id, newBooking.id, safeLabel, latitude, longitude, role]);
      };
      await saveLocation('pickup', pickup_address, pickupLat, pickupLng);
      await saveLocation('destination', dropoff_address, destinationLat, destinationLng);
    } catch (locationSaveError) {
      console.error('PRIVATE ADDRESS LEARNING SKIPPED:', locationSaveError.message);
    }

    if (!isScheduledRide) {
      try {
        console.log("LOOKING FOR NEARBY DRIVERS FOR WHATSAPP");

        const nearbyDrivers = await pool.query(
          `
  SELECT
    id,
    full_name,
    phone
  FROM drivers
  WHERE status = 'Available'
    AND is_online = true
    AND phone IS NOT NULL
  `,
        );
        console.log(`FOUND ${nearbyDrivers.rows.length} NEARBY DRIVERS`);

        await Promise.allSettled(
          nearbyDrivers.rows.map((driver) => {
            console.log(`SENDING WHATSAPP TO DRIVER: ${driver.full_name}`);

            return sendWhatsAppBookingAlert(
              driver.phone,
              newBooking.pickup_address || newBooking.pickup_area,
              newBooking.dropoff_address || newBooking.dropoff_area,
              Number(newBooking.fare_amount).toFixed(2),
            );
          }),
        );

        console.log("WHATSAPP DRIVER ALERTS FINISHED");
      } catch (whatsappError) {
        console.error("WHATSAPP ALERTS SKIPPED:", whatsappError.message);
      }
    }

    res.status(201).json({
      message: "Booking created",
      fare: baseFare,
      discount: discountAmount,
      passenger_amount: passengerAmount,
      pricing_method: verifiedFare.pricing_method,
      distance_km: verifiedFare.distance_km,
      out_of_town_fee: verifiedFare.out_of_town_fee,
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
// ============================================================
// CONFIRM SCHEDULED RIDE PICKUP GPS
// ============================================================
//
// Passenger confirms their actual physical pickup position
// before a scheduled ride.
//
// IMPORTANT:
// This updates navigation coordinates ONLY.
// It must NOT change:
// - pickup_lat
// - pickup_lng
// - fare_amount
// ============================================================

app.post("/bookings/:id/confirm-pickup-location", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const { lat, lng } = req.body;

    const confirmedLat = Number(lat);
    const confirmedLng = Number(lng);

    // --------------------------------------------------------
    // Validate GPS coordinates
    // --------------------------------------------------------

    if (!Number.isFinite(confirmedLat) || !Number.isFinite(confirmedLng)) {
      return res.status(400).json({
        error: "Valid pickup GPS coordinates are required.",
      });
    }

    // --------------------------------------------------------
    // Confirm that this is an existing scheduled ride
    // --------------------------------------------------------

    const bookingResult = await pool.query(
      `
      SELECT
        id,
        ride_type,
        booking_status,
        fare_amount,
        pickup_lat,
        pickup_lng
      FROM trip_bookings
      WHERE id = $1
      LIMIT 1
      `,
      [bookingId],
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        error: "Booking not found.",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.ride_type !== "scheduled") {
      return res.status(400).json({
        error: "Pickup confirmation is only available for scheduled rides.",
      });
    }

    // --------------------------------------------------------
    // Save confirmed GPS for DRIVER NAVIGATION ONLY
    // --------------------------------------------------------

    const result = await pool.query(
      `
      UPDATE trip_bookings
      SET
        confirmed_pickup_lat = $1,
        confirmed_pickup_lng = $2,
        pickup_location_confirmed_at = NOW()
      WHERE id = $3
      RETURNING
        id,
        ride_type,
        booking_status,
        fare_amount,
        pickup_lat,
        pickup_lng,
        confirmed_pickup_lat,
        confirmed_pickup_lng,
        pickup_location_confirmed_at
      `,
      [confirmedLat, confirmedLng, bookingId],
    );

    console.log("SCHEDULED PICKUP GPS CONFIRMED:", {
      booking_id: bookingId,
      confirmed_pickup_lat: confirmedLat,
      confirmed_pickup_lng: confirmedLng,
    });

    return res.json({
      success: true,
      message: "Pickup location confirmed.",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("CONFIRM SCHEDULED PICKUP GPS ERROR:", error);

    return res.status(500).json({
      error: "Could not confirm pickup location.",
    });
  }
});
/* =========================================================
   SCHEDULED RIDES - PROTOTYPE
   =========================================================
   Scheduled -> Waiting 30 minutes before pickup.
   Once released, the normal 10-minute Waiting window applies.
========================================================= */
async function releaseScheduledBookings() {
  try {
    // =====================================================
    // 1. RELEASE SCHEDULED RIDES INTO DRIVER MATCHING
    // =====================================================

    const released = await pool.query(
      `
        UPDATE trip_bookings
        SET
          booking_status = 'Waiting',
          trip_status = 'Waiting',
          expires_at = LEAST(
            scheduled_pickup_at,
            NOW() + INTERVAL '10 minutes'
          )
        WHERE booking_status = 'Scheduled'
          AND trip_status = 'Scheduled'
          AND matching_opens_at IS NOT NULL
          AND matching_opens_at <= NOW()
          AND scheduled_pickup_at > NOW()
        RETURNING *
      `,
    );

    if (released.rows.length > 0) {
      console.log(
        `RELEASED ${released.rows.length} SCHEDULED BOOKING(S) FOR DRIVER MATCHING`,
      );

      // =====================================================
      // SEND WHATSAPP ALERTS TO AVAILABLE DRIVERS
      // =====================================================

      try {
        const availableDrivers = await pool.query(
          `
            SELECT
              id,
              full_name,
              phone
            FROM drivers
            WHERE status = 'Available'
              AND is_online = true
              AND phone IS NOT NULL
          `,
        );

        console.log(
          `FOUND ${availableDrivers.rows.length} AVAILABLE DRIVER(S) FOR SCHEDULED RIDES`,
        );

        for (const ride of released.rows) {
          console.log(
            `SENDING SCHEDULED RIDE WHATSAPP ALERTS FOR BOOKING ${ride.id}`,
          );

          await Promise.allSettled(
            availableDrivers.rows.map((driver) => {
              console.log(
                `SENDING SCHEDULED RIDE WHATSAPP TO DRIVER: ${driver.full_name}`,
              );

              return sendWhatsAppBookingAlert(
                driver.phone,
                ride.pickup_address || ride.pickup_area,
                ride.dropoff_address || ride.dropoff_area,
                Number(ride.fare_amount).toFixed(2),
              );
            }),
          );
        }

        console.log("SCHEDULED RIDE WHATSAPP DRIVER ALERTS FINISHED");
      } catch (whatsappError) {
        console.error(
          "SCHEDULED RIDE WHATSAPP ALERTS SKIPPED:",
          whatsappError.message,
        );
      }
    }

    // =====================================================
    // 2. EXPIRE SCHEDULED RIDES WHOSE PICKUP TIME PASSED
    // =====================================================

    const missed = await pool.query(
      `
        UPDATE trip_bookings
        SET
          booking_status = 'Expired',
          trip_status = 'Expired',
          expires_at = NOW()
        WHERE ride_type = 'scheduled'
          AND scheduled_pickup_at IS NOT NULL
          AND scheduled_pickup_at <= NOW()
          AND booking_status IN ('Scheduled', 'Waiting')
          AND trip_status IN ('Scheduled', 'Waiting')
        RETURNING *
      `,
    );

    if (missed.rows.length > 0) {
      console.log(`EXPIRED ${missed.rows.length} MISSED SCHEDULED BOOKING(S)`);
    }

    return released.rows;
  } catch (error) {
    console.error("SCHEDULED BOOKING RELEASE ERROR:", error);

    throw error;
  }
}

// Passenger scheduled rides.
app.get("/passenger-scheduled-bookings/:passengerId", async (req, res) => {
  try {
    const { passengerId } = req.params;

    await releaseScheduledBookings();

    const result = await pool.query(
      `
        SELECT
          tb.*,

          d.full_name AS driver_name,
          d.phone AS driver_phone,
          d.vehicle_type,
          d.vehicle_color,
          d.license_plate,
          d.profile_image AS driver_profile_image

        FROM trip_bookings tb

        LEFT JOIN drivers d
          ON d.id = tb.assigned_driver_id

        WHERE tb.passenger_id = $1
          AND tb.ride_type = 'scheduled'
          AND tb.trip_status IN (
            'Scheduled',
            'Waiting',
            'Accepted',
            'In Progress',
            'Completed'
          )

        ORDER BY tb.scheduled_pickup_at ASC
      `,
      [passengerId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("PASSENGER SCHEDULED BOOKINGS ERROR:", error);

    res.status(500).json({
      error: "Failed to load scheduled bookings.",
    });
  }
});
// Driver preview of future scheduled rides.
// Scheduled rows are visible before matching opens, but are not yet acceptable.
app.get("/scheduled-rides", async (req, res) => {
  try {
    await releaseScheduledBookings();

    const result = await pool.query(
      `
       SELECT
        tb.*,
        p.full_name AS passenger_name,
        p.phone AS passenger_phone,
        p.profile_image AS passenger_profile_image
      FROM trip_bookings tb
        LEFT JOIN passengers p
          ON p.id = tb.passenger_id
        WHERE tb.ride_type = 'scheduled'
          AND tb.trip_status IN ('Scheduled', 'Waiting')
          AND tb.scheduled_pickup_at > NOW()
        ORDER BY tb.scheduled_pickup_at ASC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("SCHEDULED RIDES ERROR:", error);
    res.status(500).json({
      error: "Failed to load scheduled rides.",
    });
  }
});

// Scheduled rides can be cancelled while still Scheduled or Waiting.
app.patch("/scheduled-bookings/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE trip_bookings
        SET
          booking_status = 'Cancelled',
          trip_status = 'Cancelled',
          expires_at = NULL
        WHERE id = $1
          AND ride_type = 'scheduled'
          AND trip_status IN ('Scheduled', 'Waiting')
          AND assigned_driver_id IS NULL
        RETURNING *
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Scheduled booking cannot be cancelled.",
      });
    }

    res.json({
      message: "Scheduled booking cancelled",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("CANCEL SCHEDULED BOOKING ERROR:", error);
    res.status(500).json({
      error: "Failed to cancel scheduled booking.",
    });
  }
});

app.get("/test-route", (req, res) => {
  res.json({ message: "NEW CODE IS RUNNING" });
});

app.get("/admin/passengers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, phone
      FROM passengers
      ORDER BY full_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("PASSENGERS ERROR:", error);
    res.status(500).json({ error: "Failed to load passengers" });
  }
});

app.post("/passenger-register", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      password,
      referral_code,
      acceptedTerms,
      acceptedPrivacy,
    } = req.body;

    // =========================================
    // REQUIRE LEGAL ACCEPTANCE
    // =========================================
    if (acceptedTerms !== true || acceptedPrivacy !== true) {
      return res.status(400).json({
        error: "Terms & Conditions and Privacy Policy must be accepted.",
      });
    }

    // =========================================
    // CREATE PASSENGER
    // =========================================
    const passengerResult = await pool.query(
      `
      INSERT INTO passengers
      (
        full_name,
        phone,
        email,
        referral_code,
        terms_accepted_at,
        terms_version,
        privacy_accepted_at,
        privacy_version
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        NOW(),
        $5,
        NOW(),
        $6
      )
      RETURNING *
      `,
      [full_name, phone, email, referral_code, "2026-09-14", "2026-09-14"],
    );

    // =========================================
    // CREATE LOGIN ACCOUNT
    // =========================================
    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query(
      `
      INSERT INTO users
      (
        full_name,
        email,
        password,
        role
      )
      VALUES ($1,$2,$3,$4)
      `,
      [full_name, email, hashedPassword, "passenger"],
    );

    res.status(201).json({
      message: "Passenger registered successfully",
      passenger: passengerResult.rows[0],
    });
  } catch (error) {
    console.error("PASSENGER REGISTRATION ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/trips/:id/occupancy", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          t.id,
          t.route_name,
          v.capacity,
          COUNT(tb.id) AS passengers_assigned,
          v.capacity - COUNT(tb.id) AS seats_available
      FROM trips t
      JOIN vehicles v
          ON t.vehicle_id = v.id
      LEFT JOIN trip_bookings tb
          ON t.id = tb.trip_id
      WHERE t.id = $1
      GROUP BY
          t.id,
          t.route_name,
          v.capacity
      `,
      [tripId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.post("/auto-assign/:passengerId", async (req, res) => {
  try {
    const passengerId = req.params.passengerId;

    const tripId = tripResult.rows[0].id;

    const existingBooking = await pool.query(
      `
      SELECT *
      FROM trip_bookings
      WHERE passenger_id = $1
      `,
      [passengerId],
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({
        message: "Passenger already assigned",
      });
    }

    const bookingResult = await pool.query(
      `
      INSERT INTO trip_bookings
      (
        trip_id,
        passenger_id
      )
      VALUES ($1,$2)
      RETURNING *
      `,
      [tripId, passengerId],
    );
    const occupancyCheck = await pool.query(
      `
  SELECT
      v.capacity,
      COUNT(tb.id) AS passenger_count
  FROM trips t
  JOIN vehicles v
      ON t.vehicle_id = v.id
  LEFT JOIN trip_bookings tb
      ON tb.trip_id = t.id
  WHERE t.id = $1
  GROUP BY v.capacity
  `,
      [tripId],
    );

    const capacity = Number(occupancyCheck.rows[0].capacity);

    const passengerCount = Number(occupancyCheck.rows[0].passenger_count);

    if (passengerCount >= capacity) {
      await pool.query(
        `
    UPDATE trips
    SET status = 'READY_TO_DEPART'
    WHERE id = $1
    `,
        [tripId],
      );
    }

    res.json({
      message: "Passenger assigned",
      trip_id: tripId,
      booking: bookingResult.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/manifest", async (req, res) => {
  try {
    const tripId = req.params.id;

    const tripResult = await pool.query(
      `
      SELECT
          t.id,
          t.route_name,
          t.departure_date,
          d.full_name AS driver_name,
          v.registration,
          v.capacity
      FROM trips t
      JOIN drivers d
          ON t.driver_id = d.id
      JOIN vehicles v
          ON t.vehicle_id = v.id
      WHERE t.id = $1
      `,
      [tripId],
    );

    const passengerResult = await pool.query(
      `
      SELECT
          p.id,
          p.full_name,
          p.phone,
          p.pickup_town,
          p.dropoff_town
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      WHERE tb.trip_id = $1
      `,
      [tripId],
    );

    res.json({
      trip: tripResult.rows[0],
      passengers: passengerResult.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.patch("/bookings/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    // If the waiting window has already ended, expire this booking first.
    await pool.query(
      `
      UPDATE trip_bookings
      SET
        booking_status = 'Expired',
        trip_status = 'Expired'
      WHERE id = $1
        AND booking_status = 'Waiting'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
      `,
      [id],
    );

    const result = await pool.query(
      `
      UPDATE trip_bookings
      SET
        booking_status = 'Cancelled',
        trip_status = 'Cancelled'
      WHERE id = $1
        AND booking_status = 'Waiting'
        AND (expires_at IS NULL OR expires_at > NOW())
      RETURNING *
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Booking cannot be cancelled.",
      });
    }

    res.json({
      message: "Booking cancelled",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("CANCEL BOOKING ERROR:", error);

    res.status(500).json({
      error: "Failed to cancel booking.",
    });
  }
});
app.get("/trips/:id/drop-order", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          p.full_name,
          p.dropoff_town,
          t.route_position
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      JOIN town_order t
          ON p.dropoff_town = t.town_name
      WHERE tb.trip_id = $1
      ORDER BY t.route_position
      `,
      [tripId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/route-manifest", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          p.full_name,
          p.phone,
          p.pickup_town,
          p.dropoff_town,
          t.route_position
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      JOIN town_order t
          ON p.dropoff_town = t.town_name
      WHERE tb.trip_id = $1
      ORDER BY t.route_position
      `,
      [tripId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
// =====================================================
// GEOAPIFY ADDRESS AUTOCOMPLETE
// =====================================================

async function searchGeoapifyAddress(searchText) {
  try {
    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
      console.log("GEOAPIFY_API_KEY NOT CONFIGURED");
      return [];
    }

    const url =
      "https://api.geoapify.com/v1/geocode/autocomplete" +
      `?text=${encodeURIComponent(searchText)}` +
      "&format=json" +
      "&filter=countrycode:za" +
      "&limit=6" +
      `&apiKey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.log("GEOAPIFY ERROR:", response.status);
      return [];
    }

    const data = await response.json();

    return Array.isArray(data.results) ? data.results : [];
  } catch (error) {
    console.error("GEOAPIFY SEARCH FAILED:", error.message);
    return [];
  }
}

async function searchGeoapifyPlaces(searchText) {
  try {
    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) return [];

    const url =
      "https://api.geoapify.com/v1/geocode/search" +
      `?text=${encodeURIComponent(searchText + ", Upington, South Africa")}` +
      "&format=json" +
      "&filter=countrycode:za" +
      "&limit=10" +
      `&apiKey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.log("GEOAPIFY PLACES ERROR:", response.status);
      return [];
    }

    const data = await response.json();

    return Array.isArray(data.results) ? data.results : [];
  } catch (error) {
    console.error("GEOAPIFY PLACES SEARCH FAILED:", error.message);
    return [];
  }
}

app.get("/addresses/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (query.length < 2) {
      return res.json([]);
    }

    const getRoadType = (value) => {
      const text = String(value || "").toLowerCase();

      if (/\b(street|st|straat)\b\.?/i.test(text)) {
        return "street";
      }

      if (/\b(road|rd|weg)\b\.?/i.test(text)) {
        return "road";
      }

      if (/\b(avenue|ave|laan)\b\.?/i.test(text)) {
        return "avenue";
      }

      if (/\b(crescent|singel)\b/i.test(text)) {
        return "crescent";
      }

      if (/\b(drive|dr|rylaan)\b\.?/i.test(text)) {
        return "drive";
      }

      return null;
    };
    console.log("ADDRESS SEARCH:", query);
    // =====================================================
    // ROUTEX LOCAL SEARCH NORMALIZATION
    // =====================================================

    // Remove a leading house number.
    // Example: "11B Schroder Street" -> "Schroder Street"
    const localQueryWithoutHouseNumber = query
      .replace(/^\s*\d+[A-Za-z]?\s+/, "")
      .trim();

    // Afrikaans -> English road terminology.
    const localEnglishVariant = localQueryWithoutHouseNumber
      .replace(/\bsingel\b/gi, "Crescent")
      .replace(/\bstraat\b/gi, "Street")
      .replace(/\bweg\b/gi, "Road")
      .replace(/\blaan\b/gi, "Avenue")
      .replace(/\brylaan\b/gi, "Drive")
      .trim();

    // English -> Afrikaans road terminology.
    const localAfrikaansVariant = localQueryWithoutHouseNumber
      .replace(/\bcrescent\b/gi, "Singel")
      .replace(/\bstreet\b/gi, "Straat")
      .replace(/\broad\b/gi, "Weg")
      .replace(/\bavenue\b/gi, "Laan")
      .replace(/\bdrive\b/gi, "Rylaan")
      .trim();

    // Remove road terminology completely.
    // Example: "Saturnus Avenue" -> "Saturnus"
    const localBareStreet = localQueryWithoutHouseNumber
      .replace(
        /\b(avenue|ave|laan|street|st|straat|road|rd|weg|crescent|singel|drive|dr|rylaan)\b\.?/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();

    const localSearchVariants = [
      query,
      localQueryWithoutHouseNumber,
      localEnglishVariant,
      localAfrikaansVariant,
      localBareStreet,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.findIndex(
            (other) => other.toLowerCase() === value.toLowerCase(),
          ) === index,
      );

    const knownAreas = [
      "Augrabies Park",
      "Bellvue",
      "Blydeville",
      "Die Rand",
      "Flora Park",
      "Hillside",
      "Keidebees",
      "Klippunt",
      "Laboria",
      "Lemoendraai",
      "Louisvale Weg",
      "Louisvale",
      "Middelpos",
      "Morning Glory",
      "Mountain View",
      "Nuwerus",
      "Olyfvenhoudtsdrift",
      "Oosterville",
      "Paballelo",
      "Progress",
      "Raaswater",
      "Rosedale",
      "Ses Brugge",
      "Straussburg",
      "Swartkop",
      "Upington Central",
      "Vaalkroek",
    ];
    const isUpingtonGeoResult = (item) => {
      const searchableLocation = [
        item.city,
        item.town,
        item.suburb,
        item.district,
        item.county,
        item.formatted,
        item.address_line1,
        item.address_line2,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableLocation.includes("upington");
    };

    const geoResultMatchesStreet = (item, searchQuery) => {
  const roadTypes = {
    street: "street",
    st: "street",
    straat: "street",
    road: "road",
    rd: "road",
    weg: "road",
    avenue: "avenue",
    ave: "avenue",
    laan: "avenue",
    crescent: "crescent",
    singel: "crescent",
    drive: "drive",
    dr: "drive",
    rylaan: "drive",
    lane: "lane",
    ln: "lane",
  };

  const roadTypePattern =
    /\b(street|straat|st|road|rd|weg|avenue|ave|laan|crescent|singel|drive|dr|rylaan|lane|ln)\b\.?/gi;

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^\s*\d+[a-z]?\s+/, "")
      .replace(/[.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getRoadType = (value) => {
    const words = normalize(value).split(" ");

    for (const word of words) {
      const type = roadTypes[word];
      if (type) return type;
    }

    return null;
  };

  const getStreetName = (value) =>
    normalize(value)
      .replace(roadTypePattern, " ")
      .replace(/\s+/g, " ")
      .trim();

  const queryName = getStreetName(searchQuery);

  const candidates = [
    item.street,
    item.address_line1,
  ].filter(Boolean);

  if (queryName.length < 3) {
    return false;
  }

  return candidates.some((candidate) => {
    const resultName = getStreetName(candidate);

    if (resultName.length < 3) {
      return false;
    }

    const nameMatches =
      resultName === queryName ||
      resultName.startsWith(queryName + " ") ||
      queryName.startsWith(resultName + " ");

    if (!nameMatches) {
      return false;
    }

    const requestedType = getRoadType(searchQuery);
    const returnedType = getRoadType(candidate);

    if (
      requestedType &&
      returnedType &&
      requestedType !== returnedType &&
      !(["street", "road"].includes(requestedType) &&
        ["street", "road"].includes(returnedType))
    ) {
      return false;
    }

    return true;
  });
};
    // =====================================================
    // 1. SEARCH ROUTEX LOCAL DATABASE FIRST
    // =====================================================

    const localResult = await pool.query(
      `
    SELECT
      id,
      address,
      full_address,
      area_name,
      latitude,
      longitude,
      place_type,

      GREATEST(
        similarity(LOWER(address), LOWER($2)),
        similarity(LOWER(address), LOWER($3)),
        similarity(LOWER(address), LOWER($4)),
        similarity(
  LOWER(
    regexp_replace(
      address,
      '\s+(avenue|ave|laan|street|st|straat|road|rd|weg|crescent|singel|drive|dr|rylaan)\.?$',
      '',
      'i'
    )
  ),
  LOWER($5)
),
        similarity(
          LOWER(COALESCE(full_address, '')),
          LOWER($2)
        )
      ) AS similarity_score

    FROM public.addresses

    WHERE
  -- Direct match against what the passenger actually typed
  address ILIKE $1
  OR full_address ILIKE $1

  -- English/Afrikaans variants are useful, but only when
  -- they contain enough characters to be meaningful.
  OR (
    LENGTH($3) >= 5
    AND address ILIKE '%' || $3 || '%'
  )

  OR (
    LENGTH($4) >= 5
    AND address ILIKE '%' || $4 || '%'
  )

  -- Bare street-name matching.
  OR (
    LENGTH($5) >= 5
    AND address ILIKE '%' || $5 || '%'
  )

  -- Fuzzy matching must be reasonably strong.
  OR similarity(
    LOWER(address),
    LOWER($2)
  ) > 0.65

  OR (
    LENGTH($3) >= 5
    AND similarity(
      LOWER(address),
      LOWER($3)
    ) > 0.65
  )

  OR (
    LENGTH($4) >= 5
    AND similarity(
      LOWER(address),
      LOWER($4)
    ) > 0.65
  )

  OR (
    LENGTH($5) >= 5
    AND similarity(
      LOWER(
        regexp_replace(
          address,
          '\s+(avenue|ave|laan|street|st|straat|road|rd|weg|crescent|singel|drive|dr|rylaan)\.?$',
          '',
          'i'
        )
      ),
      LOWER($5)
    ) > 0.65
  )

    ORDER BY
      CASE
        WHEN LOWER(address) = LOWER($2) THEN 0

        WHEN LOWER(address) = LOWER($3)
          OR LOWER(address) = LOWER($4) THEN 1

        WHEN LOWER(address) LIKE LOWER($2 || '%') THEN 2

        WHEN address ILIKE $1 THEN 3

        ELSE 4
      END,

      similarity_score DESC,
      address

    LIMIT 10
  `,
      [
        `%${query}%`,
        query,
        localEnglishVariant,
        localAfrikaansVariant,
        localBareStreet,
      ],
    );
    // Return usable local matches immediately.
    const localWithCoordinates = localResult.rows.filter((item) => {
      if (item.latitude === null || item.longitude === null) {
        return false;
      }

      const score = Number(item.similarity_score || 0);

      const address = String(item.address || "").toLowerCase();

      const originalQuery = query.toLowerCase();

      const englishVariant = localEnglishVariant.toLowerCase();

      const afrikaansVariant = localAfrikaansVariant.toLowerCase();

      const bareVariant = localBareStreet.toLowerCase();

      const directMatch =
        address.includes(originalQuery) ||
        originalQuery.includes(address) ||
        address.includes(englishVariant) ||
        address.includes(afrikaansVariant) ||
        (bareVariant.length >= 4 && address.includes(bareVariant));

      // Make sure different road types are not confused.
      // Examples:
      // Quarry Street != Quarry Road
      // Saturnus Laan == Saturnus Avenue
      // Hantam Singel == Hantam Crescent

      const requestedRoadType = getRoadType(query);
      const resultRoadType = getRoadType(item.address);

      if (
        requestedRoadType &&
        resultRoadType &&
        requestedRoadType !== resultRoadType &&
        !(["street", "road"].includes(requestedRoadType) &&
          ["street", "road"].includes(resultRoadType))
      ) {
        return false;
      }

      // Only show genuinely relevant local results.
      return directMatch || score >= 0.75;
    });

    if (localWithCoordinates.length > 0) {
      console.log("LOCAL ADDRESS RESULTS:", localWithCoordinates.length);

      return res.json(
        localWithCoordinates.map((item) => ({
          address: item.address,
          full_address: item.full_address || item.address,
          area_name: item.area_name || "",
          place_type: item.place_type,
          lat: Number(item.latitude),
          lng: Number(item.longitude),
          source: "local",
        })),
      );
    }

    // =====================================================
    // NAMED PLACES: schools, shops, offices, clinics, buildings
    // =====================================================
    // Forward geocoding may resolve named POIs, but is not a complete
    // business directory. Require a matching name and an Upington location.
    const roadWords = /\b(street|st|straat|road|rd|weg|avenue|ave|laan|crescent|singel|drive|dr|rylaan|lane|ln)\b/i;
    const hasHouseNumber = /^\s*\d+[a-z]?\s+/i.test(query);
    const normalizePlaceName = (value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    if (!roadWords.test(query) && !hasHouseNumber && query.length >= 4) {
      const placeCandidates = await searchGeoapifyPlaces(query);
      const wanted = normalizePlaceName(query);
      const namedPlaces = placeCandidates.filter((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        const name = normalizePlaceName(item.name || "");
        const type = String(item.result_type || "").toLowerCase();
        const isNamedPlace = name.length >= 4 &&
          (name === wanted || name.startsWith(wanted + " ") ||
           name.includes(" " + wanted + " ") || name.endsWith(" " + wanted));
        return Number.isFinite(lat) && Number.isFinite(lng) &&
          isUpingtonGeoResult(item) && isNamedPlace &&
          !["city", "county", "state", "country", "street", "postcode"].includes(type);
      });

      if (namedPlaces.length > 0) {
        return res.json(namedPlaces.slice(0, 6).map((item) => {
          const locationText = [item.suburb, item.district, item.formatted]
            .filter(Boolean).join(" ").toLowerCase();
          const area = knownAreas.find((name) => locationText.includes(name.toLowerCase()));
          return {
            address: item.name,
            full_address: item.formatted || item.name,
            area_name: area || item.suburb || "Upington",
            place_type: item.result_type || "place",
            lat: Number(item.lat),
            lng: Number(item.lon),
            source: "geoapify-place",
          };
        }));
      }
    }

    // =====================================================
    // GEOAPIFY FAST AUTOCOMPLETE
    // =====================================================
    // Clean location information that RouteX already adds itself.
    // Example:
    // "3 Mouton St, Upington, 8801"
    // becomes:
    // "3 Mouton St"

    const cleanedQuery = query
      .replace(/,\s*upington\b/gi, "")
      .replace(/,\s*8\d{3}\b/g, "")
      .replace(/,\s*south africa\b/gi, "")
      .replace(/\s+/g, " ")
      .replace(/,\s*$/, "")
      .trim();

    // Remove leading house number for fallback searches.
    // "11B Schroder Street" -> "Schroder Street"
    // "06 Hantam Singel"    -> "Hantam Singel"
    const queryWithoutHouseNumber = cleanedQuery
      .replace(/^\s*\d+[A-Za-z]?\s+/, "")
      .trim();

    // Afrikaans -> English street terminology fallback.
    const translatedStreetQuery = queryWithoutHouseNumber
      .replace(/\bsingel\b/gi, "Crescent")
      .replace(/\bstraat\b/gi, "Street")
      .replace(/\bweg\b/gi, "Road")
      .replace(/\blaan\b/gi, "Avenue")
      .replace(/\brylaan\b/gi, "Drive")
      .replace(/\bst\.?\b/gi, "Street")
      .replace(/\brd\.?\b/gi, "Road")
      .replace(/\bave\.?\b/gi, "Avenue")
      .replace(/\bdr\.?\b/gi, "Drive");

    // English -> Afrikaans street terminology fallback.
    // Some Upington streets are mapped under their Afrikaans road type.
    const afrikaansStreetQuery = queryWithoutHouseNumber
      .replace(/\bcrescent\b/gi, "Singel")
      .replace(/\bstreet\b/gi, "Straat")
      .replace(/\broad\b/gi, "Weg")
      .replace(/\bavenue\b/gi, "Laan")
      .replace(/\bdrive\b/gi, "Rylaan")
      .trim();

    // Street name without the road type.
    // Example: "Saturnus Avenue" -> "Saturnus"
    const bareStreetQuery = queryWithoutHouseNumber
      .replace(
        /\b(avenue|laan|street|straat|road|weg|crescent|singel|drive|rylaan)\b/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();
    // -----------------------------------------------------
    // First try exactly what the passenger entered
    // -----------------------------------------------------

    let geoResults = await searchGeoapifyAddress(
      `${query}, Upington, South Africa`,
    );
    console.log(
      "RAW GEOAPIFY RESULTS:",
      query,
      geoResults.map((item) => ({
        address_line1: item.address_line1,
        street: item.street,
        formatted: item.formatted,
        suburb: item.suburb,
        district: item.district,
        city: item.city,
        result_type: item.result_type,
        lat: item.lat,
        lon: item.lon,
      })),
    );

    // -----------------------------------------------------
    // Check whether Geoapify returned a useful location
    // Do NOT accept a city-only result.
    // -----------------------------------------------------

   let usefulGeoResults = geoResults.filter((item) => {
  const lat = Number(item.lat);
  const lng = Number(item.lon);

  const normalized = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const searchName = normalized(queryWithoutHouseNumber);

  const placeNames = [
    item.name,
    item.address_line1,
  ]
    .filter(Boolean)
    .map(normalized);

  const landmarkMatches =
    searchName.length >= 4 &&
    !/\b(street|st|straat|road|rd|weg|avenue|ave|laan|crescent|singel|drive|dr|rylaan|lane|ln)\b/i.test(queryWithoutHouseNumber) &&
    placeNames.some(
      (name) =>
        name === searchName ||
        name.startsWith(searchName + " ") ||
        name.includes(" " + searchName)
    );

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    isUpingtonGeoResult(item) &&
    !["city", "county", "state", "country"].includes(
      String(item.result_type || "").toLowerCase()
    ) &&
    (
      geoResultMatchesStreet(item, queryWithoutHouseNumber) ||
      landmarkMatches
    )
  );
});

    // -----------------------------------------------------
    // If exact search failed, try our RouteX normalization.
    //
    // Example:
    // 06 Hantam Singel
    //        Γåô
    // Hantam Crescent
    // -----------------------------------------------------

    // -----------------------------------------------------
    // ROUTEX SMART GEOAPIFY FALLBACKS
    // -----------------------------------------------------

    const geoapifyFallbackQueries = [
      queryWithoutHouseNumber,
      translatedStreetQuery,
      afrikaansStreetQuery,
      bareStreetQuery,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.findIndex(
            (other) => other.toLowerCase() === value.toLowerCase(),
          ) === index,
      );

    if (usefulGeoResults.length === 0) {
      for (const fallbackQuery of geoapifyFallbackQueries) {
        // Exact passenger query was already attempted above.
        if (fallbackQuery.toLowerCase() === query.toLowerCase()) {
          continue;
        }

        console.log("GEOAPIFY SMART FALLBACK:", query, "->", fallbackQuery);

        const fallbackResults = await searchGeoapifyAddress(
          `${fallbackQuery}, Upington, South Africa`,
        );

        const validFallbackResults = fallbackResults.filter((item) => {
          const lat = Number(item.lat);
          const lng = Number(item.lon);

          return (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            isUpingtonGeoResult(item) &&
           (
  geoResultMatchesStreet(item, fallbackQuery) ||
  (
    fallbackQuery.trim().length >= 4 &&
    [item.name, item.address_line1]
      .filter(Boolean)
      .some((value) => {
        const normalize = (text) =>
          String(text)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

        const name = normalize(value);
        const search = normalize(fallbackQuery);

        return (
          name === search ||
          name.startsWith(search + " ") ||
          name.includes(" " + search)
        );
      })
  )
) &&
            !["city", "county", "state", "country"].includes(
              String(item.result_type || "").toLowerCase(),
            )
          );
        });

        if (validFallbackResults.length > 0) {
          geoResults = fallbackResults;
          usefulGeoResults = validFallbackResults;

          console.log(
            "GEOAPIFY FALLBACK SUCCESS:",
            fallbackQuery,
            validFallbackResults.length,
          );

          break;
        }
      }
    }

    // -----------------------------------------------------
    // Return Geoapify suggestions immediately when useful.
    // -----------------------------------------------------

    if (usefulGeoResults.length > 0) {
      const formattedGeoResults = usefulGeoResults.slice(0, 6).map((item) => ({
        // Keep what the passenger typed when we had
        // to normalize the address.
        address: item.address_line1 || query,

        full_address: item.formatted || item.address_line1 || query,

        area_name: (() => {
          const locationText = [
            item.suburb,
            item.district,
            item.city,
            item.town,
            item.address_line1,
            item.address_line2,
            item.formatted,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          // Prefer RouteX's known passenger-facing area names.
          for (const knownArea of knownAreas) {
            if (locationText.includes(knownArea.toLowerCase())) {
              return knownArea;
            }
          }

          // Geoapify sometimes returns municipal wards instead
          // of a useful suburb name.
          const rawArea = item.suburb || item.district || "";

          if (/ward\s*\d+/i.test(rawArea) || /khara hais ward/i.test(rawArea)) {
            return "Upington";
          }

          return rawArea || "Upington";
        })(),

        place_type: item.result_type || null,

        lat: Number(item.lat),
        lng: Number(item.lon),

        source: "geoapify",

        confidence: item.rank?.confidence ?? null,

        confidence_building: item.rank?.confidence_building_level ?? null,
      }));

      console.log("GEOAPIFY RESULTS:", query, formattedGeoResults.length);

      // =====================================================
      // CACHE GOOD GEOAPIFY RESULTS IN ROUTEX
      // =====================================================

      for (const result of formattedGeoResults) {
        try {
          // Safety check: never cache unusable coordinates.
          if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) {
            continue;
          }

          // Check whether RouteX already knows this location.
          const existing = await pool.query(
            `
        SELECT id
        FROM public.addresses
        WHERE
          LOWER(TRIM(address)) = LOWER(TRIM($1))
          AND ABS(latitude - $2) < 0.0001
          AND ABS(longitude - $3) < 0.0001
        LIMIT 1
      `,
            [result.address, result.lat, result.lng],
          );

          if (existing.rows.length > 0) {
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
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
      `,
            [
              result.address,
              result.full_address,
              result.area_name || "",
              result.lat,
              result.lng,
              result.place_type,
            ],
          );

          console.log(
            "CACHED GEOAPIFY ADDRESS:",
            result.address,
            result.area_name || "",
            result.lat,
            result.lng,
          );
        } catch (cacheError) {
          // A caching failure must never stop a passenger
          // from receiving valid search results.
          console.error(
            "FAILED TO CACHE GEOAPIFY ADDRESS:",
            result.address,
            cacheError.message,
          );
        }
      }

      return res.json(formattedGeoResults);
    }
    // =====================================================
    // 2. TRY TO GEOCODE LOCAL MATCHES WITHOUT COORDINATES
    // =====================================================

    const localWithoutCoordinates = localResult.rows.filter((item) => {
      const missingCoordinates =
        item.latitude === null || item.longitude === null;

      if (!missingCoordinates) {
        return false;
      }

      const score = Number(item.similarity_score || 0);

      const address = String(item.address || "").toLowerCase();

      const originalQuery = query.toLowerCase();

      const englishVariant = localEnglishVariant.toLowerCase();

      const afrikaansVariant = localAfrikaansVariant.toLowerCase();

      const bareVariant = localBareStreet.toLowerCase();

      const directMatch =
        address.includes(originalQuery) ||
        originalQuery.includes(address) ||
        address.includes(englishVariant) ||
        address.includes(afrikaansVariant) ||
        (bareVariant.length >= 4 && address.includes(bareVariant));

      // Only geocode genuinely relevant local records.
      return directMatch || score >= 0.75;
    });

    for (const place of localWithoutCoordinates) {
      const geocodeQueries = [
        place.full_address ? `${place.full_address}, South Africa` : null,

        place.area_name
          ? `${place.address}, ${place.area_name}, Upington, South Africa`
          : null,

        `${place.address}, Upington, South Africa`,
      ].filter(Boolean);

      for (const geocodeQuery of geocodeQueries) {
        try {
          const geocodeUrl =
            `https://nominatim.openstreetmap.org/search` +
            `?q=${encodeURIComponent(geocodeQuery)}` +
            `&format=jsonv2` +
            `&addressdetails=1` +
            `&namedetails=1` +
            `&limit=3` +
            `&countrycodes=za`;

          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              "User-Agent": "RouteX/1.0",
              "Accept-Language": "en",
            },
          });

          if (!geocodeResponse.ok) {
            continue;
          }

          const geocodeData = await geocodeResponse.json();

          if (!geocodeData.length) {
            continue;
          }

          // Prefer a result that is actually around Upington.
          const match =
            geocodeData.find((item) =>
              String(item.display_name || "")
                .toLowerCase()
                .includes("upington"),
            ) || geocodeData[0];

          const lat = Number(match.lat);
          const lng = Number(match.lon);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            continue;
          }

          await pool.query(
            `
            UPDATE public.addresses
            SET
              latitude = $1,
              longitude = $2,
              full_address = COALESCE(
                NULLIF(full_address, ''),
                $3
              )
            WHERE id = $4
            `,
            [lat, lng, match.display_name, place.id],
          );

          console.log("GEOCODED LOCAL PLACE:", place.address, lat, lng);

          return res.json([
            {
              address: place.address,
              full_address:
                place.full_address || match.display_name || place.address,
              area_name: place.area_name || "",
              place_type:
                place.place_type || match.type || match.category || null,
              lat,
              lng,
              source: "local-geocoded",
            },
          ]);
        } catch (geocodeError) {
          console.error(
            "LOCAL GEOCODING ATTEMPT FAILED:",
            geocodeError.message,
          );
        }
      }
    }

    // IMPORTANT:
    // If a local result exists but still has no coordinates,
    // DO NOT return it.
    // Continue to the wider OSM search.

    // =====================================================
    // 3. OPENSTREETMAP / NOMINATIM SEARCH
    // =====================================================

    // Remove a leading house number for fallback searching.
    // Examples:
    // "11B Schroder Street" -> "Schroder Street"
    // "06 Hantam Single"    -> "Hantam Single"
    // =====================================================
    // ADDRESS SEARCH FALLBACKS
    // =====================================================

    // Build our different search attempts
    const searchQueries = [
      // 1. Exact passenger address
      `${query}, Upington, South Africa`,
      `${query}, Upington`,

      // 2. Without house number
      `${queryWithoutHouseNumber}, Upington, South Africa`,
      `${queryWithoutHouseNumber}, Upington`,

      // 3. Afrikaans -> English road terminology
      `${translatedStreetQuery}, Upington, South Africa`,
      `${translatedStreetQuery}, Upington`,

      // 4. English -> Afrikaans road terminology
      `${afrikaansStreetQuery}, Upington, South Africa`,
      `${afrikaansStreetQuery}, Upington`,

      // 5. Street name only
      `${bareStreetQuery}, Upington, South Africa`,
      `${bareStreetQuery}, Upington`,

      // 6. Wider fallbacks
      `${query}, Northern Cape, South Africa`,
      query,
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.findIndex(
            (other) => other.toLowerCase() === value.toLowerCase(),
          ) === index,
      );
    const allOsmResults = [];

    for (const searchQuery of searchQueries) {
      try {
        console.log("OSM SEARCH:", searchQuery);

        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(searchQuery)}` +
          `&format=jsonv2` +
          `&addressdetails=1` +
          `&namedetails=1` +
          `&limit=8` +
          `&countrycodes=za`;

        const response = await fetch(url, {
          headers: {
            "User-Agent": "RouteX/1.0",
            "Accept-Language": "en",
          },
        });

        if (response.status === 429) {
          console.log("Nominatim rate limited");

          break;
        }

        if (!response.ok) {
          console.log("Nominatim search failed:", response.status);

          continue;
        }

        const data = await response.json();

        for (const item of data) {
          const displayName = String(item.display_name || "");

          // We only want results relevant to Upington.
          if (!displayName.toLowerCase().includes("upington")) {
            continue;
          }

          const duplicate = allOsmResults.some(
            (existing) =>
              String(existing.osm_type) === String(item.osm_type) &&
              String(existing.osm_id) === String(item.osm_id),
          );

          if (!duplicate) {
            allOsmResults.push(item);
          }
        }

        // Once we have enough useful results,
        // don't keep hitting Nominatim.
        if (allOsmResults.length >= 6) {
          break;
        }
      } catch (searchError) {
        console.error("OSM SEARCH ATTEMPT FAILED:", searchError.message);
      }
    }

    // =====================================================
    // 4. FORMAT RESULTS
    // =====================================================

    const results = [];

    for (const item of allOsmResults) {
      const address = item.address || {};
      const namedetails = item.namedetails || {};

      let areaName =
        address.suburb ||
        address.neighbourhood ||
        address.residential ||
        address.village ||
        address.quarter ||
        address.city_district ||
        address.town ||
        "";

      let normalizedArea = areaName;

      for (const knownArea of knownAreas) {
        if (
          String(item.display_name || "")
            .toLowerCase()
            .includes(knownArea.toLowerCase())
        ) {
          normalizedArea = knownArea;
          break;
        }
      }

      const fullAddress = String(item.display_name || "").toLowerCase();

      if (
        fullAddress.includes("extension 1") ||
        fullAddress.includes("extension 2")
      ) {
        normalizedArea = "Rosedale";
      }

      if (areaName === "Louisvale - Upington") {
        normalizedArea = "Louisvale";
      }

      // Upington business/POI results do not
      // always expose a suburb.
      if (!normalizedArea) {
        normalizedArea = "Upington Central";
      }

      const street = address.road || address.pedestrian || "";

      const houseNumber = address.house_number || "";

      const streetAddress =
        houseNumber && street ? `${houseNumber} ${street}` : street;

      // Prefer actual POI/business names.
      const placeName =
        namedetails.name ||
        namedetails["name:en"] ||
        address.shop ||
        address.amenity ||
        address.office ||
        address.tourism ||
        address.healthcare ||
        address.leisure ||
        item.name ||
        "";

      // For numbered address searches, prefer the actual
      // house number + street returned by OSM.
      // This prevents POI names such as schools from being
      // learned as fake residential addresses.

      const passengerEnteredHouseNumber = /^\s*\d+[A-Za-z]?\s+/.test(query);

      let shortAddress;

      if (passengerEnteredHouseNumber && streetAddress) {
        shortAddress = streetAddress;
      } else {
        shortAddress = placeName || streetAddress || query;
      }

      // If we had to fall back by removing the house number,
      // keep the customer's original typed address.
      // Example:
      // Search coordinates using "Schroder Street"
      // Display/save "11B Schroder Street"
      // If RouteX had to use either:
      // - a house-number fallback, or
      // - an Afrikaans/English street-name fallback,
      // keep the passenger's original typed address.
      //
      // Example:
      // Passenger types: "06 Hantam Singel"
      // Coordinates found using: "Hantam Crescent"
      // Address saved/displayed: "06 Hantam Singel"

      if (
        queryWithoutHouseNumber !== query ||
        translatedStreetQuery.toLowerCase() !==
          queryWithoutHouseNumber.toLowerCase()
      ) {
        shortAddress = query;
      }

      // If Nominatim doesn't expose item.name,
      // display_name's first section is often`
      // the POI/business name.
      if (!passengerEnteredHouseNumber && !placeName && item.display_name) {
        const firstPart = item.display_name.split(",")[0].trim();

        if (firstPart) {
          shortAddress = firstPart;
        }
      }

      const lat = Number(item.lat);
      const lng = Number(item.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        continue;
      }

      const result = {
        address: shortAddress,
        full_address: item.display_name || shortAddress,
        area_name: normalizedArea,
        place_type: item.type || item.category || null,
        lat,
        lng,
        source: "osm",
      };

      results.push(result);

      // ===================================================
      // 5. CACHE RESULT IN ROUTEX DATABASE
      // ===================================================

      try {
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
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          ON CONFLICT DO NOTHING
          `,
          [
            result.address,
            result.full_address,
            result.area_name,
            result.lat,
            result.lng,
            result.place_type,
          ],
        );
      } catch (saveError) {
        console.error("FAILED TO CACHE ADDRESS:", saveError.message);
      }
    }

    console.log("ADDRESS SEARCH RESULTS:", query, results.length);

    return res.json(results.slice(0, 10));
  } catch (error) {
    console.error("ADDRESS SEARCH ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/addresses/reverse", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
      });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Geoapify API key is not configured",
      });
    }

    const url =
      `https://api.geoapify.com/v1/geocode/reverse` +
      `?lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&apiKey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("GEOAPIFY REVERSE ERROR:", data);

      return res.status(502).json({
        error: "Could not resolve pickup address",
      });
    }

    const feature = data?.features?.[0];
    const properties = feature?.properties;

    if (!properties) {
      return res.json({
        address: "Current Location",
        area_name: null,
      });
    }

    const address =
      properties.formatted || properties.address_line1 || "Current Location";

    const areaName =
      properties.suburb || properties.district || properties.city || null;

    res.json({
      address,
      area_name: areaName,
      lat: Number(lat),
      lng: Number(lng),
    });
  } catch (error) {
    console.error("REVERSE ADDRESS ERROR:", error);

    res.status(500).json({
      error: "Could not resolve pickup address",
    });
  }
});
app.get("/dashboard", async (req, res) => {
  try {
    const passengerCount = await pool.query("SELECT COUNT(*) FROM passengers");

    const vehicleCount = await pool.query("SELECT COUNT(*) FROM vehicles");

    const driverCount = await pool.query("SELECT COUNT(*) FROM drivers");

    const tripCount = await pool.query("SELECT COUNT(*) FROM trips");

    res.json({
      passengers: passengerCount.rows[0].count,
      vehicles: vehicleCount.rows[0].count,
      drivers: driverCount.rows[0].count,
      trips: tripCount.rows[0].count,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/summary", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          t.id,
          t.route_name,
          d.full_name AS driver_name,
          v.registration,
          v.capacity,
          COUNT(tb.id) AS passengers_assigned,
          v.capacity - COUNT(tb.id) AS seats_available
      FROM trips t
      JOIN drivers d
          ON t.driver_id = d.id
      JOIN vehicles v
          ON t.vehicle_id = v.id
      LEFT JOIN trip_bookings tb
          ON tb.trip_id = t.id
      WHERE t.id = $1
      GROUP BY
          t.id,
          t.route_name,
          d.full_name,
          v.registration,
          v.capacity
      `,
      [tripId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/status", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          t.id,
          t.route_name,
          v.capacity,
          COUNT(tb.id) AS passengers_assigned,
          CASE
            WHEN COUNT(tb.id) >= v.capacity
            THEN 'FULL'
            ELSE 'OPEN'
          END AS trip_status
      FROM trips t
      JOIN vehicles v
          ON t.vehicle_id = v.id
      LEFT JOIN trip_bookings tb
          ON tb.trip_id = t.id
      WHERE t.id = $1
      GROUP BY
          t.id,
          t.route_name,
          v.capacity
      `,
      [tripId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trip-capacity", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          t.id,
          t.route_name,
          v.registration,
          v.capacity,
          COUNT(tb.id) AS passengers_assigned,
          v.capacity - COUNT(tb.id) AS seats_available
      FROM trips t
      JOIN vehicles v
          ON t.vehicle_id = v.id
      LEFT JOIN trip_bookings tb
          ON tb.trip_id = t.id
      GROUP BY
          t.id,
          t.route_name,
          v.registration,
          v.capacity
      ORDER BY t.id
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
    t.id,
    t.route_name,
    t.status,
    d.full_name AS driver_name,
    v.registration,
    v.capacity,
    COUNT(tb.id) AS passengers_assigned
      FROM trips t
      JOIN drivers d
          ON t.driver_id = d.id
      JOIN vehicles v
          ON t.vehicle_id = v.id
      LEFT JOIN trip_bookings tb
          ON tb.trip_id = t.id
      GROUP BY
          t.id,
          t.route_name,
          t.status,
          d.full_name,
          v.registration,
          v.capacity
      ORDER BY t.id
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/passengers", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          p.id,
          p.full_name,
          p.phone,
          p.pickup_town,
          p.dropoff_town
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      WHERE tb.trip_id = $1
      ORDER BY p.full_name
      `,
      [tripId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/pickup-order", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          p.full_name,
          p.pickup_town,
          p.dropoff_town,
          pickup.route_position
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      JOIN town_order pickup
          ON p.pickup_town = pickup.town_name
      WHERE tb.trip_id = $1
      ORDER BY pickup.route_position
      `,
      [tripId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/pickup-stops", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
  SELECT
      p.pickup_town,
      COUNT(*) AS passenger_count,
      t.route_position
  FROM trip_bookings tb
  JOIN passengers p
      ON tb.passenger_id = p.id
  JOIN town_order t
      ON p.pickup_town = t.town_name
  WHERE tb.trip_id = $1
  GROUP BY
      p.pickup_town,
      t.route_position
  ORDER BY
      t.route_position
  `,
      [tripId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/dropoff-stops", async (req, res) => {
  try {
    const tripId = req.params.id;

    const result = await pool.query(
      `
      SELECT
          p.dropoff_town,
          COUNT(*) AS passenger_count,
          t.route_position
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      JOIN town_order t
          ON p.dropoff_town = t.town_name
      WHERE tb.trip_id = $1
      GROUP BY
          p.dropoff_town,
          t.route_position
      ORDER BY
          t.route_position
      `,
      [tripId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trips/:id/driver-manifest", async (req, res) => {
  try {
    const tripId = req.params.id;
    const tripInfo = await pool.query(
      `
  SELECT
      t.id,
      t.route_name,
      t.status,
      d.full_name AS driver_name,
      v.registration,
      v.capacity
  FROM trips t
  JOIN drivers d
      ON t.driver_id = d.id
  JOIN vehicles v
      ON t.vehicle_id = v.id
  WHERE t.id = $1
  `,
      [tripId],
    );

    const pickupStops = await pool.query(
      `
      SELECT
          p.pickup_town,
          COUNT(*) AS passenger_count,
          t.route_position
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      JOIN town_order t
          ON p.pickup_town = t.town_name
      WHERE tb.trip_id = $1
      GROUP BY
          p.pickup_town,
          t.route_position
      ORDER BY
          t.route_position
      `,
      [tripId],
    );

    const dropoffStops = await pool.query(
      `
      SELECT
          p.dropoff_town,
          COUNT(*) AS passenger_count,
          t.route_position
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      JOIN town_order t
          ON p.dropoff_town = t.town_name
      WHERE tb.trip_id = $1
      GROUP BY
          p.dropoff_town,
          t.route_position
      ORDER BY
          t.route_position
      `,
      [tripId],
    );

    res.json({
      trip: tripInfo.rows[0],
      pickup_stops: pickupStops.rows,
      dropoff_stops: dropoffStops.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/available-vehicles", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM vehicles
      WHERE status = 'Available'
      ORDER BY id
      `,
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/trip-bookings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          tb.id,
          p.full_name,
          t.id AS trip_id,
          t.route_name
      FROM trip_bookings tb
      JOIN passengers p
          ON tb.passenger_id = p.id
      JOIN trips t
          ON tb.trip_id = t.id
      ORDER BY tb.id
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.post("/trips/:id/depart", async (req, res) => {
  try {
    const tripId = req.params.id;

    await pool.query(
      `
      UPDATE trips
      SET status = 'IN_TRANSIT'
      WHERE id = $1
      `,
      [tripId],
    );

    res.json({
      message: "Trip departed",
      trip_id: tripId,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.post("/trips/:id/complete", async (req, res) => {
  try {
    const tripId = req.params.id;

    const tripResult = await pool.query(
      `
      SELECT
          vehicle_id,
          driver_id
      FROM trips
      WHERE id = $1
      `,
      [tripId],
    );

    const vehicleId = tripResult.rows[0].vehicle_id;
    const driverId = tripResult.rows[0].driver_id;

    await pool.query(
      `
      UPDATE trips
      SET status = 'COMPLETED'
      WHERE id = $1
      `,
      [tripId],
    );

    await pool.query(
      `
      UPDATE vehicles
      SET status = 'Available'
      WHERE id = $1
      `,
      [vehicleId],
    );

    await pool.query(
      `
      UPDATE drivers
      SET status = 'Available'
      WHERE id = $1
      `,
      [driverId],
    );

    res.json({
      message: "Trip completed",
      trip_id: tripId,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
      AND password = $2
      `,
      [email, password],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: result.rows[0].id,
        full_name: result.rows[0].full_name,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/revenue-summary", async (req, res) => {
  try {
    const totalRevenue = await pool.query(`
      SELECT
        COALESCE(SUM(fare), 0) AS revenue
      FROM passengers
      WHERE payment_status = 'Paid'
    `);

    const outstandingPayments = await pool.query(`
      SELECT
        COALESCE(SUM(fare), 0) AS outstanding
      FROM passengers
      WHERE payment_status = 'Pending'
    `);

    res.json({
      revenue: totalRevenue.rows[0].revenue,
      outstanding: outstandingPayments.rows[0].outstanding,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.post("/passengers/:id/pay", async (req, res) => {
  try {
    const passengerId = req.params.id;

    await pool.query(
      `
      UPDATE passengers
      SET payment_status = 'Paid'
      WHERE id = $1
      `,
      [passengerId],
    );

    res.json({
      message: "Payment recorded",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/trip-requests", async (req, res) => {
  try {
    // Expire overdue waiting requests before drivers receive the queue.
    await pool.query(`
      UPDATE trip_bookings
      SET
        booking_status = 'Expired',
        trip_status = 'Expired'
      WHERE booking_status = 'Waiting'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
    `);

    const result = await pool.query(`
  SELECT
      tb.id,
      tb.passenger_id,
      tb.trip_id,
      tb.fare_amount,
      tb.discount_amount,
      tb.passenger_amount,
      tb.promo_code,
      p.full_name,
      p.phone,
      p.profile_image AS passenger_profile_image,
      tb.pickup_address,
      tb.dropoff_address,
      tb.pickup_lat,
      tb.pickup_lng,
      tb.destination_lat,
      tb.destination_lng,
      tb.travel_date,
      tb.trip_status,
      tb.expires_at
  FROM trip_bookings tb
  JOIN passengers p
      ON tb.passenger_id = p.id
 WHERE tb.booking_status = 'Waiting'
AND tb.assigned_driver_id IS NULL
AND tb.ride_type = 'now'
AND (tb.expires_at IS NULL OR tb.expires_at > NOW())
  ORDER BY tb.id DESC
`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.post("/trip-requests/:id/accept", authenticateDriver, async (req, res) => {
  const client = await pool.connect();

  try {
    const bookingId = req.params.id;
    const { driverId } = req.body;
    if (String(driverId) !== req.authenticatedDriverId) {
  return res.status(403).json({
    error: "You are not authorized to accept rides for another driver.",
  });
}

    if (!driverId) {
      return res.status(400).json({
        error: "Driver ID is required.",
      });
    }

    await client.query("BEGIN");

    // Lock this driver to prevent simultaneous acceptances.
    const driverResult = await client.query(
      `
      SELECT id
      FROM drivers
      WHERE id = $1
        AND status = 'Available'
        AND is_online = true
      FOR UPDATE
      `,
      [driverId],
    );

    if (driverResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "You are not available to accept another ride.",
      });
    }

    // Expire an outdated waiting request.
    await client.query(
      `
      UPDATE trip_bookings
      SET booking_status = 'Expired',
          trip_status = 'Expired'
      WHERE id = $1
        AND booking_status = 'Waiting'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
      `,
      [bookingId],
    );

    // Only one driver can claim a waiting booking.
    const result = await client.query(
      `
      UPDATE trip_bookings
      SET booking_status = 'Accepted',
          trip_status = 'Accepted',
          assigned_driver_id = $2
      WHERE id = $1
        AND booking_status = 'Waiting'
        AND assigned_driver_id IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      RETURNING *
      `,
      [bookingId, driverId],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This trip is no longer available.",
      });
    }

    const booking = result.rows[0];

    await client.query(
      `
      UPDATE drivers
      SET status = 'Busy',
          is_online = true
      WHERE id = $1
      `,
      [driverId],
    );

    await client.query(
      `
      INSERT INTO notifications
        (recipient_type, recipient_id, title, message)
      VALUES ($1, $2, $3, $4)
      `,
      [
        "passenger",
        booking.passenger_id,
        "Driver Assigned",
        "Your driver is on the way to collect you.",
      ],
    );

    await client.query("COMMIT");

    console.log(`DRIVER ${driverId} STATUS -> BUSY`);

    return res.json({
      message: "Trip accepted",
      booking,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("ACCEPT ROLLBACK ERROR:", rollbackError);
    }

    console.error("ACCEPT TRIP ERROR:", error);

    return res.status(500).json({
      error: "Could not accept trip. Please try again.",
    });
  } finally {
    client.release();
  }
});

app.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT *
        FROM notifications
        WHERE recipient_type = 'passenger'
        AND recipient_id = $1
        ORDER BY created_at DESC
      `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("NOTIFICATIONS ERROR:", error);
    res.status(500).json({
      error: "Failed to load notifications",
    });
  }
});

app.post("/trip-requests/:id/start", authenticateDriver, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { driverId } = req.body;
if (String(driverId) !== req.authenticatedDriverId) {
  return res.status(403).json({
    error: "You are not authorized to start rides for another driver.",
  });
}

    if (!driverId) {
      return res.status(400).json({
        error: "Driver ID is required.",
      });
    }

    const result = await pool.query(
      `
        UPDATE trip_bookings
        SET
          booking_status = 'In Progress',
          trip_status = 'In Progress',
          assigned_driver_id = assigned_driver_id,
          started_at = NOW()
        WHERE id = $1
          AND trip_status = 'Accepted'
          AND assigned_driver_id = $2
        RETURNING *
        `,
      [bookingId, driverId],
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: "This ride cannot be started by this driver.",
      });
    }

    res.json({
      message: "Trip started",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("START RIDE ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
app.post("/trip-requests/:id/complete", authenticateDriver, async (req, res) => {
  const client = await pool.connect();

  try {
    const bookingId = req.params.id;
    const { driverId } = req.body;
    if (String(driverId) !== req.authenticatedDriverId) {
  return res.status(403).json({
    error: "You are not authorized to complete rides for another driver.",
  });
}

    if (!driverId) {
      return res.status(400).json({
        error: "Driver ID is required.",
      });
    }

    await client.query("BEGIN");

    // Find the assigned driver without changing the booking yet.
    const bookingResult = await client.query(
      `
      SELECT id, assigned_driver_id
      FROM trip_bookings
      WHERE id = $1
        AND trip_status = 'In Progress'
        AND assigned_driver_id = $2
      `,
      [bookingId, driverId],
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This trip cannot be completed by this driver.",
      });
    }

    // Lock the driver before changing the booking.
    const driverResult = await client.query(
      `
      SELECT id
      FROM drivers
      WHERE id = $1
      FOR UPDATE
      `,
      [driverId],
    );

    if (driverResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Assigned driver could not be found.",
      });
    }

    const result = await client.query(
      `
      UPDATE trip_bookings
      SET booking_status = 'Completed',
          trip_status = 'Completed',
          completed_at = NOW()
      WHERE id = $1
        AND trip_status = 'In Progress'
        AND assigned_driver_id = $2
      RETURNING *
      `,
      [bookingId, driverId],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "This trip has already been completed or changed.",
      });
    }

    const booking = result.rows[0];

    await client.query(
      `
      UPDATE drivers
      SET status = 'Available',
          is_online = true
      WHERE id = $1
      `,
      [driverId],
    );

    await client.query("COMMIT");

    console.log(`DRIVER ${driverId} STATUS -> AVAILABLE`);

    return res.json({
      message: "Trip completed",
      booking,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("COMPLETE ROLLBACK ERROR:", rollbackError);
    }

    console.error("COMPLETE TRIP ERROR:", error);

    return res.status(500).json({
      error: "Could not complete trip. Please try again.",
    });
  } finally {
    client.release();
  }
});
app.get("/accepted-trips", async (req, res) => {
  try {
    const result = await pool.query(`
 SELECT
  tb.*,
  p.full_name,
  p.phone,
  p.full_name AS passenger_name,
  p.phone AS passenger_phone,
  p.profile_image AS passenger_profile_image,
  d.full_name AS driver_name,
d.phone AS driver_phone,
d.profile_image AS driver_profile_image,
d.vehicle_type,
d.vehicle_color,
d.license_plate
  FROM trip_bookings tb
  JOIN passengers p
    ON tb.passenger_id = p.id
  LEFT JOIN drivers d
    ON tb.assigned_driver_id = d.id
  WHERE tb.trip_status = 'Accepted'
  ORDER BY tb.id DESC
`);

    res.json(result.rows);
  } catch (error) {
    console.error("ACCEPTED-TRIPS ERROR:", error);
    res.json([]);
  }
});

app.get("/in-progress-trips", async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT
  tb.*,
  p.full_name,
  p.phone,
  p.full_name AS passenger_name,
  p.phone AS passenger_phone,
  p.profile_image AS passenger_profile_image,
  d.full_name AS driver_name,
d.phone AS driver_phone,
d.profile_image AS driver_profile_image,
d.vehicle_type,
d.vehicle_color,
d.license_plate
  FROM trip_bookings tb
  JOIN passengers p
    ON tb.passenger_id = p.id
  LEFT JOIN drivers d
    ON tb.assigned_driver_id = d.id
  WHERE tb.trip_status = 'In Progress'
  ORDER BY tb.id DESC
`);

    res.json(result.rows);
  } catch (error) {
    console.error("IN-PROGRESS-TRIPS ERROR:", error);
    res.json([]);
  }
});
// Driver-only earnings summary. Gross completed fares include RouteX-funded promos.
app.get("/drivers/me/earnings", authenticateDriver, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(
               TO_CHAR(completed_at AT TIME ZONE 'Africa/Johannesburg', 'YYYY-MM'),
               TO_CHAR(created_at, 'YYYY-MM')
             ) AS month,
             COUNT(*)::integer AS trips,
             COALESCE(SUM(fare_amount), 0)::numeric AS gross_fares,
             COALESCE(SUM(passenger_amount), 0)::numeric AS passenger_portion,
             COALESCE(SUM(discount_amount), 0)::numeric AS promo_portion
      FROM trip_bookings
      WHERE assigned_driver_id = $1
        AND trip_status = 'Completed'
        AND (completed_at IS NOT NULL OR created_at IS NOT NULL)
      GROUP BY 1
      ORDER BY month DESC
    `, [req.authenticatedDriverId]);
    return res.json({ months: result.rows });
  } catch (error) {
    console.error("DRIVER EARNINGS ERROR:", error);
    return res.status(500).json({ error: "Could not load earnings" });
  }
});

app.get("/completed-trips", async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT
  tb.*,
  p.full_name,
  p.phone,
  p.full_name AS passenger_name,
  p.phone AS passenger_phone,
  p.profile_image AS passenger_profile_image,
  d.full_name AS driver_name,
  d.phone AS driver_phone,
  d.profile_image AS driver_profile_image,
  d.vehicle_type,
  d.vehicle_color,
  d.license_plate
  FROM trip_bookings tb
  JOIN passengers p
    ON tb.passenger_id = p.id
  LEFT JOIN drivers d
    ON tb.assigned_driver_id = d.id
  WHERE tb.trip_status = 'Completed'
  ORDER BY tb.id DESC
`);

    res.json(result.rows);
  } catch (error) {
    console.error("COMPLETED-TRIPS ERROR:", error);
    res.json([]);
  }
});
app.get("/driver-list", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, status
      FROM drivers
      ORDER BY full_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("DRIVER LIST ERROR:", error);
    res.json([]);
  }
});

app.get("/online-drivers", async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT COUNT(*) AS total
  FROM drivers
  WHERE status = 'Available'
    AND is_online = true
`);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/available-drivers", async (req, res) => {
  try {
    const { pickup_lat, pickup_lng } = req.query;

    if (!pickup_lat || !pickup_lng) {
      return res.status(400).json({
        error: "Pickup location is required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        split_part(full_name, ' ', 1) AS first_name,
        phone,
        profile_image,
        vehicle_type,
        vehicle_color,
        license_plate,
       ROUND(
  (
    6371 * ACOS(
      LEAST(
        1,
        GREATEST(
          -1,
          COS(RADIANS($1)) *
          COS(RADIANS(current_lat)) *
          COS(
            RADIANS(current_lng) -
            RADIANS($2)
          ) +
          SIN(RADIANS($1)) *
          SIN(RADIANS(current_lat))
        )
      )
    )
  )::numeric,
  1
) AS distance_km
      FROM drivers
  WHERE status = 'Available'
  AND is_online = true
  AND current_lat IS NOT NULL
  AND current_lng IS NOT NULL
  AND (
    6371 * ACOS(
      LEAST(
        1,
        GREATEST(
          -1,
          COS(RADIANS($1)) *
          COS(RADIANS(current_lat)) *
          COS(
            RADIANS(current_lng) -
            RADIANS($2)
          ) +
          SIN(RADIANS($1)) *
          SIN(RADIANS(current_lat))
        )
      )
    )
  ) <= 30
ORDER BY distance_km ASC
      `,
      [Number(pickup_lat), Number(pickup_lng)],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("AVAILABLE DRIVERS ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
// =====================================
// DRIVER SET INITIAL PASSWORD
// =====================================

app.post("/driver-set-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Token and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      UPDATE drivers
      SET
        password = $1,
        password_setup_token = NULL,
        password_setup_expires = NULL
      WHERE password_setup_token = $2
        AND password_setup_expires > NOW()
      RETURNING id
      `,
      [hashedPassword, token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "This password setup link is invalid or has expired",
      });
    }

    return res.json({
      message: "Password created successfully",
    });
  } catch (error) {
    console.error("DRIVER SET PASSWORD ERROR:", error);

    return res.status(500).json({
      error: "Unable to create password",
    });
  }
});
app.post("/driver-login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        error: "Phone and password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM drivers
      WHERE phone = $1
      LIMIT 1
      `,
      [phone],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const driver = result.rows[0];

    let passwordMatches = false;

    // Driver already has a bcrypt password
    if (driver.password?.startsWith("$2")) {
      passwordMatches = await bcrypt.compare(password, driver.password);
    } else {
      // Temporary support for existing plaintext passwords
      passwordMatches = password === driver.password;

      // Upgrade existing driver password after successful login
      if (passwordMatches) {
        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.query(
          `
          UPDATE drivers
          SET password = $1
          WHERE id = $2
          `,
          [hashedPassword, driver.id],
        );

        console.log(`DRIVER PASSWORD UPGRADED: ${driver.id}`);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

   // Never send the password back to the frontend
const { password: _password, ...safeDriver } = driver;

const secret = process.env.DRIVER_JWT_SECRET;

if (!secret) {
  console.error("DRIVER_JWT_SECRET is not configured");
  return res.status(503).json({
    error: "Driver authentication is temporarily unavailable",
  });
}

const token = jwt.sign(
  {
    driverId: driver.id,
    role: "driver",
  },
  secret,
  {
    expiresIn: "7d",
    algorithm: "HS256",
  }
);

res.json({
  ...safeDriver,
  token,
});

  } catch (error) {
    console.error("DRIVER LOGIN ERROR:", error);

    res.status(500).json({
      error: "Unable to log in",
    });
  }
});

app.post("/auth/verify-reset-code", async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and verification code are required",
      });
    }

    // Normalize South African mobile number
    const normalizedPhone = phone.replace(/\D/g, "");

    let phoneVariants = [normalizedPhone];

    if (normalizedPhone.startsWith("27")) {
      phoneVariants.push("0" + normalizedPhone.substring(2));
    }

    if (normalizedPhone.startsWith("0")) {
      phoneVariants.push("27" + normalizedPhone.substring(1));
    }

    // Find passenger
    const passengerResult = await pool.query(
      `SELECT u.id, u.email, u.role
       FROM public.users u
       JOIN public.passengers p ON p.email = u.email
       WHERE REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g') = ANY($1)
         AND u.role = 'passenger'
       LIMIT 1`,
      [phoneVariants],
    );

    if (passengerResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const user = passengerResult.rows[0];

    const resetResult = await pool.query(
      `SELECT id, code_hash, expires_at, used
       FROM password_reset_codes
       WHERE user_id = $1
         AND role = 'passenger'
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id],
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const resetCode = resetResult.rows[0];
    const codeHash = hashResetCode(code.toString());

    if (codeHash !== resetCode.code_hash) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    await pool.query(
      `UPDATE password_reset_codes
       SET verified_at = NOW()
       WHERE id = $1`,
      [resetCode.id],
    );

    return res.json({
      success: true,
      message: "Verification code confirmed",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify code",
    });
  }
});

app.post("/auth/reset-password", async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number, verification code and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Normalize South African mobile number
    const normalizedPhone = phone.replace(/\D/g, "");

    let phoneVariants = [normalizedPhone];

    if (normalizedPhone.startsWith("27")) {
      phoneVariants.push("0" + normalizedPhone.substring(2));
    }

    if (normalizedPhone.startsWith("0")) {
      phoneVariants.push("27" + normalizedPhone.substring(1));
    }

    // Find passenger
    const passengerResult = await pool.query(
      `SELECT u.id, u.email, u.role
       FROM public.users u
       JOIN public.passengers p ON p.email = u.email
       WHERE REGEXP_REPLACE(p.phone, '[^0-9]', '', 'g') = ANY($1)
         AND u.role = 'passenger'
       LIMIT 1`,
      [phoneVariants],
    );

    if (passengerResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to reset password",
      });
    }

    const user = passengerResult.rows[0];

    // Find verified reset code
    const resetResult = await pool.query(
      `SELECT id, code_hash, expires_at, verified_at
       FROM password_reset_codes
       WHERE user_id = $1
         AND role = 'passenger'
         AND used = FALSE
         AND verified_at IS NOT NULL
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id],
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Verification has expired. Please request a new code.",
      });
    }

    const resetCode = resetResult.rows[0];
    const codeHash = hashResetCode(code.toString());

    if (codeHash !== resetCode.code_hash) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE public.users
       SET password = $1
       WHERE id = $2
         AND role = 'passenger'`,
      [hashedPassword, user.id],
    );

    await pool.query(
      `UPDATE password_reset_codes
       SET used = TRUE
       WHERE id = $1`,
      [resetCode.id],
    );

    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
});

app.post("/drivers/:id/status", authenticateDriver, async (req, res) => {
  try {
    const driverId = req.params.id;
    const { status, current_lat, current_lng } = req.body;
    if (String(driverId) !== req.authenticatedDriverId) {
  return res.status(403).json({
    error: "You are not authorized to change another driver's status.",
  });
}
    const goingOnline = status === "Available";

    const result = await pool.query(
      `
      UPDATE drivers
      SET
  status = $1,
  is_online = $2,
  current_lat = $3,
  current_lng = $4,
  last_online_at = CASE
    WHEN $2 = true THEN NOW()
    ELSE last_online_at
  END
      WHERE id = $5
      RETURNING *
      `,
      [status, goingOnline, current_lat ?? null, current_lng ?? null, driverId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Driver not found." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("DRIVER STATUS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// DRIVER DASHBOARD STATS
// =============================================

/* =========================
   DRIVER LIVE LOCATION
========================= */

app.post("/drivers/:id/heartbeat", authenticateDriver, async (req, res) => {
  try {
    const driverId = req.params.id;
if (String(driverId) !== req.authenticatedDriverId) {
  return res.status(403).json({
    error: "You are not authorized to update another driver's heartbeat.",
  });
}
    const result = await pool.query(
      `
      UPDATE drivers
      SET last_online_at = NOW()
      WHERE id = $1
        AND is_online = true
      RETURNING id, last_online_at
      `,
      [driverId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Driver is not online.",
      });
    }

    res.json({
      success: true,
      last_online_at: result.rows[0].last_online_at,
    });
  } catch (error) {
    console.error("DRIVER HEARTBEAT ERROR:", error);

    res.status(500).json({
      error: "Unable to update driver activity",
    });
  }
});

app.post("/drivers/:id/location", authenticateDriver, async (req, res) => {
  try {
    const driverId = req.params.id;
    const { latitude, longitude } = req.body;
if (String(driverId) !== req.authenticatedDriverId) {
  return res.status(403).json({
    error: "You are not authorized to update another driver's location.",
  });
}
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        error: "Invalid driver location",
      });
    }

    const result = await pool.query(
      `
      UPDATE drivers
      SET
        current_lat = $1,
        current_lng = $2
      WHERE id = $3
      RETURNING id, current_lat, current_lng
      `,
      [lat, lng, driverId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }

    res.json({
      success: true,
      location: result.rows[0],
    });
  } catch (error) {
    console.error("DRIVER LOCATION ERROR:", error);

    res.status(500).json({
      error: "Unable to update driver location",
    });
  }
});
app.post("/ambassador-login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    console.log("AMBASSADOR PHONE:", phone);
    console.log("AMBASSADOR PASSWORD:", password);

    const result = await pool.query(
      `
      SELECT *
      FROM ambassadors
      WHERE phone = $1
      AND password = $2
      `,
      [phone, password],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/ambassador/:code/stats", async (req, res) => {
  try {
    const referralCode = req.params.code;

    const registrations = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM passengers
      WHERE referral_code = $1
      `,
      [referralCode],
    );
    const bookings = await pool.query(
      `
  SELECT COUNT(*) AS total
  FROM trip_bookings tb
  JOIN passengers p
    ON tb.passenger_id = p.id
  WHERE p.referral_code = $1
  `,
      [referralCode],
    );

    res.json({
      registrations: Number(registrations.rows[0].total),
      bookings: Number(bookings.rows[0].total),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/ambassador/:code/referrals", async (req, res) => {
  try {
    const referralCode = req.params.code;

    const result = await pool.query(
      `
  SELECT
    p.full_name,
    p.phone,
    CASE
      WHEN COUNT(tb.id) > 0 THEN TRUE
      ELSE FALSE
    END AS booked
  FROM passengers p
  LEFT JOIN trip_bookings tb
    ON tb.passenger_id = p.id
  WHERE p.referral_code = $1
  GROUP BY
    p.id,
    p.full_name,
    p.phone
  ORDER BY p.full_name
  `,
      [referralCode],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Private learned-address search: the signed token, not a supplied passenger ID,
// determines whose saved locations may be returned.
app.get("/passenger/saved-locations", async (req, res) => {
  const secret = process.env.PASSENGER_JWT_SECRET;
  const match = /^Bearer (.+)$/i.exec(String(req.headers.authorization || ""));
  if (!secret || !match) return res.status(401).json({ error: "Passenger sign-in required" });
  let identity;
  try {
    identity = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
    if (identity.role !== "passenger" || !Number.isSafeInteger(Number(identity.passengerId))) {
      return res.status(403).json({ error: "Passenger access required" });
    }
  } catch (_) {
    return res.status(401).json({ error: "Passenger session expired. Please sign in again." });
  }
  const q = String(req.query.q || "").trim().slice(0, 120);
  if (q.length < 3) return res.json([]);
  try {
    const result = await pool.query(`
      SELECT label AS address, COALESCE(full_address, label) AS full_address,
             area_name, latitude AS lat, longitude AS lng,
             'saved' AS place_type, 'private' AS source
      FROM public.passenger_saved_locations
      WHERE passenger_id = $1
        AND (label ILIKE $2 OR full_address ILIKE $2 OR area_name ILIKE $2)
      ORDER BY created_at DESC
      LIMIT 12
    `, [Number(identity.passengerId), '%' + q.replace(/[\%_]/g, '\\$&') + '%']);
    return res.json(result.rows);
  } catch (error) {
    console.error("SAVED LOCATION SEARCH ERROR:", error);
    return res.status(500).json({ error: "Saved address search unavailable" });
  }
});

app.post("/passenger-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find passenger account by email only.
    // Never compare the password inside the SQL query.
    const result = await pool.query(
      `
      SELECT id, email, password, role
      FROM users
      WHERE email = $1
        AND role = 'passenger'
      LIMIT 1
      `,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const user = result.rows[0];
    let passwordMatches = false;

    // New bcrypt password
    if (user.password?.startsWith("$2")) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      // Temporary support for existing plaintext accounts
      passwordMatches = password === user.password;

      // Automatically upgrade the password after successful login
      if (passwordMatches) {
        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.query(
          `
          UPDATE users
          SET password = $1
          WHERE id = $2
          `,
          [hashedPassword, user.id],
        );

        console.log(`PASSENGER PASSWORD UPGRADED: ${user.id}`);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const passengerResult = await pool.query(
      `
      SELECT *
      FROM passengers
      WHERE email = $1
      LIMIT 1
      `,
      [email],
    );

    if (passengerResult.rows.length === 0) {
      return res.status(404).json({
        error: "Passenger profile not found",
      });
    }

    // Issue a signed passenger session for private address access.
    const passengerSecret = process.env.PASSENGER_JWT_SECRET;
    if (!passengerSecret) {
      console.error("PASSENGER_JWT_SECRET is not configured");
      return res.status(503).json({ error: "Passenger login temporarily unavailable" });
    }
    const passenger = passengerResult.rows[0];
    const passengerToken = jwt.sign(
      { passengerId: passenger.id, role: "passenger" },
      passengerSecret,
      { expiresIn: "7d", algorithm: "HS256" }
    );
    res.json({ ...passenger, token: passengerToken });
  } catch (error) {
    console.error("PASSENGER LOGIN ERROR:", error);

    res.status(500).json({
      error: "Unable to log in",
    });
  }
});

app.post(
  "/driver-application",
  upload.fields([
    { name: "vehicle_photo", maxCount: 1 },
    { name: "profile_photo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        full_name,
        phone,
        vehicle_type,
        vehicle_color,
        license_plate,
        referral_code,
        acceptedDriverTerms,
        acceptedPrivacy,
        residential_address,
        id_passport_number,
      } = req.body;
      if (
        !full_name?.trim() ||
        !phone?.trim() ||
        !residential_address?.trim() ||
        !id_passport_number?.trim() ||
        !vehicle_type?.trim() ||
        !vehicle_color?.trim() ||
        !license_plate?.trim()
      ) {
        return res.status(400).json({
          error: "Please complete all required driver information.",
        });
      }

      if (!req.files?.vehicle_photo?.[0]) {
        return res.status(400).json({
          error: "A vehicle photo is required.",
        });
      }

      if (!req.files?.profile_photo?.[0]) {
        return res.status(400).json({
          error: "A profile photo is required.",
        });
      }

      // =========================================
      // REQUIRE LEGAL ACCEPTANCE
      // =========================================
      if (acceptedDriverTerms !== "true" || acceptedPrivacy !== "true") {
        return res.status(400).json({
          error: "Driver Terms and Privacy Policy must be accepted.",
        });
      }

      console.log("DRIVER APPLICATION FILES:", req.files);
      // =========================================
      // UPLOAD DRIVER PHOTOS TO SUPABASE STORAGE
      // =========================================

      let vehicleImage = null;
      let profileImage = null;

      // Vehicle photo
      const vehicleFile = req.files?.vehicle_photo?.[0];

      if (vehicleFile) {
        const fileExtension = vehicleFile.originalname.split(".").pop();

        const fileName = `vehicle-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("vehicle-photos")
          .upload(fileName, vehicleFile.buffer, {
            contentType: vehicleFile.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("VEHICLE PHOTO UPLOAD ERROR:", uploadError);

          return res.status(500).json({
            error: "Unable to upload vehicle photo",
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from("vehicle-photos")
          .getPublicUrl(fileName);

        vehicleImage = publicUrlData?.publicUrl || null;
      }

      // Profile photo
      const profileFile = req.files?.profile_photo?.[0];

      if (profileFile) {
        const fileExtension = profileFile.originalname.split(".").pop();

        const fileName = `driver-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, profileFile.buffer, {
            contentType: profileFile.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("PROFILE PHOTO UPLOAD ERROR:", uploadError);

          return res.status(500).json({
            error: "Unable to upload profile photo",
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(fileName);

        profileImage = publicUrlData?.publicUrl || null;
      }

      const result = await pool.query(
        `
        INSERT INTO driver_applications
        (
          full_name,
          phone,
           residential_address,
          id_passport_number,
          vehicle_type,
          vehicle_color,
          license_plate,
          referral_code,
          vehicle_image,
          profile_image,
          driver_terms_accepted_at,
          driver_terms_version,
          privacy_accepted_at,
          privacy_version
        )
        VALUES
(
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  NOW(),
  $11,
  NOW(),
  $12
)
RETURNING *
`,
        [
          full_name,
          phone,
          residential_address,
          id_passport_number,
          vehicle_type,
          vehicle_color,
          license_plate,
          referral_code,
          vehicleImage,
          profileImage,
          "2026-09-14",
          "2026-09-14",
        ],
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error("DRIVER APPLICATION ERROR:", error);

      res.status(500).json({
        error: error.message,
      });
    }
  },
);

app.get("/admin/bookings", async (req, res) => {
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  const provided = req.get("X-RouteX-Admin-Key") || "";

  if (!expected || !provided) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(provided);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: "Admin access denied" });
  }

  try {
    const result = await pool.query(`
      SELECT
        tb.id,
        tb.passenger_id,
        tb.pickup_address,
        tb.dropoff_address,
        tb.booking_status,
        tb.trip_status,
        tb.assigned_driver_id,
        d.full_name AS driver_name
      FROM trip_bookings tb
      LEFT JOIN drivers d
        ON tb.assigned_driver_id = d.id
      ORDER BY tb.id DESC
      LIMIT 200
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("ADMIN BOOKINGS ERROR:", error);
    return res.status(500).json({
      error: "Unable to load booking history",
    });
  }
});

// ROUTEX ADMIN DRIVER DIRECTORY ΓÇö add before app.get("/admin/stats", ...)
// Set ADMIN_DASHBOARD_KEY as a strong, private Render environment variable.
app.get("/admin/driver-directory", async (req, res) => {
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  const provided = req.get("X-RouteX-Admin-Key") || "";
  if (!expected || !provided)
    return res.status(403).json({ error: "Admin access required" });
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(403).json({ error: "Admin access denied" });
  try {
    const result = await pool.query(`
      SELECT id, full_name, vehicle_type, vehicle_color, license_plate,
             status, is_online, last_online_at
      FROM drivers ORDER BY full_name ASC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("ADMIN DRIVER DIRECTORY ERROR:", error);
    return res.status(500).json({ error: "Unable to load driver directory" });
  }
});
// ADMIN: Generate a password reset link for an existing driver
app.post("/admin/drivers/:id/reset-password", async (req, res) => {
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  const provided = req.get("X-RouteX-Admin-Key") || "";

  if (!expected || !provided) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(provided);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: "Admin access denied" });
  }

  const driverId = Number(req.params.id);

  if (!Number.isSafeInteger(driverId) || driverId <= 0) {
    return res.status(400).json({ error: "Invalid driver ID" });
  }

  try {
    const resetToken = crypto.randomBytes(32).toString("hex");

    const result = await pool.query(
      `
      UPDATE drivers
      SET
        password_setup_token = $1,
        password_setup_expires = NOW() + INTERVAL '15 minutes'
      WHERE id = $2
      RETURNING id, full_name
      `,
      [resetToken, driverId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const driver = result.rows[0];

    const resetLink =
      `https://routex-frontend.onrender.com/driver-set-password?token=${resetToken}`;

    res.set("Cache-Control", "no-store");

    return res.json({
      message: "Password reset link generated",
      driver_id: driver.id,
      driver_name: driver.full_name,
      reset_link: resetLink,
      expires_in_minutes: 15,
    });
  } catch (error) {
    console.error("ADMIN DRIVER PASSWORD RESET ERROR:", error);

    return res.status(500).json({
      error: "Unable to generate password reset link",
    });
  }
});
app.get("/admin/stats", async (req, res) => {
  try {
    const passengers = await pool.query(
      "SELECT COUNT(*) AS total FROM passengers",
    );

    const drivers = await pool.query("SELECT COUNT(*) AS total FROM drivers");

    const bookings = await pool.query(
      "SELECT COUNT(*) AS total FROM trip_bookings",
    );

    const onlineDrivers = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM drivers
      WHERE status = 'Available'
        AND is_online = true
      `,
    );

    const applications = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM driver_applications
      WHERE status = 'Pending'
      `,
    );

    res.json({
      passengers: Number(passengers.rows[0].total),
      drivers: Number(drivers.rows[0].total),
      bookings: Number(bookings.rows[0].total),
      onlineDrivers: Number(onlineDrivers.rows[0].total),
      pendingApplications: Number(applications.rows[0].total),
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);

    res.status(500).json({
      error: "Unable to load admin statistics",
    });
  }
});

// =====================================================
// AVAILABLE DRIVER COUNT
// =====================================================
app.get("/drivers/available-count", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM drivers
      WHERE status = 'Available'
        AND is_online = true
      `,
    );

    res.json({
      onlineDrivers: Number(result.rows[0].total),
    });
  } catch (error) {
    console.error("AVAILABLE DRIVER COUNT ERROR:", error);

    res.status(500).json({
      error: "Unable to load available driver count",
    });
  }
});

app.get("/admin/applications", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM driver_applications
      WHERE status = 'Pending'
      ORDER BY created_at DESC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/admin/applications/:id/approve", async (req, res) => {
  try {
    const applicationId = req.params.id;

    const application = await pool.query(
      `
      SELECT *
      FROM driver_applications
      WHERE id = $1
      `,
      [applicationId],
    );

    if (application.rows.length === 0) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    const appData = application.rows[0];

    // Create a secure one-time password setup token
    const setupToken = crypto.randomBytes(32).toString("hex");

    // Token expires after 24 hours
    const setupExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `
  INSERT INTO drivers
  (
    full_name,
    phone,
    status,
    password,
    role,
    vehicle_type,
    vehicle_color,
    license_plate,
    referral_code,
    profile_image,
    residential_address,
    id_passport_number,
    password_setup_token,
    password_setup_expires
  )
  VALUES
  (
    $1,
    $2,
    'Offline',
    NULL,
    'driver',
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11
  )
  `,
      [
        appData.full_name,
        appData.phone,
        appData.vehicle_type,
        appData.vehicle_color,
        appData.license_plate,
        appData.referral_code,
        appData.profile_image,
        appData.residential_address,
        appData.id_passport_number,
        setupToken,
        setupExpires,
      ],
    );
    await pool.query(
      `
      UPDATE driver_applications
      SET status = 'Approved'
      WHERE id = $1
      `,
      [applicationId],
    );

    const setupLink = `https://routex-frontend.onrender.com/driver-set-password?token=${setupToken}`;

    // Send the approved driver their RouteX account setup link
    try {
      await sendWhatsAppDriverApproved(
        appData.phone,
        appData.full_name,
        setupLink,
      );

      console.log(`DRIVER APPROVAL WHATSAPP SENT TO: ${appData.full_name}`);
    } catch (whatsappError) {
      console.error("DRIVER APPROVAL WHATSAPP FAILED:", whatsappError);
    }

    res.json({
      message: "Application approved",
      setup_link: setupLink,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/admin/applications/:id/reject", async (req, res) => {
  try {
    const applicationId = req.params.id;

    await pool.query(
      `
      UPDATE driver_applications
      SET status = 'Rejected'
      WHERE id = $1
      `,
      [applicationId],
    );

    res.json({
      message: "Application rejected",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/calculate-fare", async (req, res) => {
  console.log("FARE INPUT:", {
    pickup_area: req.query.pickup_area,
    dropoff_area: req.query.dropoff_area,
    pickup_lat: req.query.pickup_lat,
    pickup_lng: req.query.pickup_lng,
    dropoff_lat: req.query.dropoff_lat,
    dropoff_lng: req.query.dropoff_lng,
  });
  try {
    const pickupLat = Number(req.query.pickup_lat);
    const pickupLng = Number(req.query.pickup_lng);
    const dropoffLat = Number(req.query.dropoff_lat);
    const dropoffLng = Number(req.query.dropoff_lng);

    if (
      !Number.isFinite(pickupLat) ||
      pickupLat < -90 ||
      pickupLat > 90 ||
      !Number.isFinite(pickupLng) ||
      pickupLng < -180 ||
      pickupLng > 180 ||
      !Number.isFinite(dropoffLat) ||
      dropoffLat < -90 ||
      dropoffLat > 90 ||
      !Number.isFinite(dropoffLng) ||
      dropoffLng < -180 ||
      dropoffLng > 180
    ) {
      return res.status(400).json({
        error: "Valid pickup and destination coordinates are required.",
      });
    }

    const routeFare = await calculateRouteXFare({
      pickup_area: req.query.pickup_area,
      dropoff_area: req.query.dropoff_area,
      pickup_lat: req.query.pickup_lat,
      pickup_lng: req.query.pickup_lng,
      dropoff_lat: req.query.dropoff_lat,
      dropoff_lng: req.query.dropoff_lng,
    });

    const rideType = String(req.query.ride_type || "now");
    if (rideType !== "now" && rideType !== "scheduled") {
      return res.status(400).json({ error: "Invalid ride type." });
    }
// Determine pickup time for RouteX night pricing.
let farePickupAt = new Date();

if (rideType === "scheduled") {
  const travelDate = String(req.query.travel_date || "");
  const pickupTime = String(req.query.pickup_time || "");

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(travelDate) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)
  ) {
    return res.status(400).json({
      error: "A valid scheduled pickup date and time are required.",
    });
  }

  farePickupAt = new Date(
    `${travelDate}T${pickupTime}:00+02:00`
  );

  if (
    Number.isNaN(farePickupAt.getTime()) ||
    farePickupAt <= new Date()
  ) {
    return res.status(400).json({
      error: "Scheduled pickup time must be in the future.",
    });
  }
}

const nightPricing = calculateRouteXNightFare(
  Number(routeFare.fare),
  farePickupAt
);
    // Scheduled fares do not depend on a driver being online today.
    // Ride Now retains the existing live-driver pickup surcharge.
    const pickupEstimate =
      rideType === "now"
        ? await calculateRouteXPickupDistance(pickupLat, pickupLng)
        : null;
    // Long out-of-town rides already include a distance allowance.
    // Do not add a second driver-pickup surcharge to these rides.
    // Keep the normal surcharge for local and shorter out-of-town rides.
    const isLongOutOfTownRide =
      routeFare.pricing_method === "distance" &&
      Number(routeFare.out_of_town_fee) > 0 &&
      Number(routeFare.distance_km) > 20;
    const pickupSurcharge = isLongOutOfTownRide
      ? 0
      : (pickupEstimate?.surcharge ?? 0);
 const fare = {
  ...routeFare,

  // Night pricing
  night_surcharge: nightPricing.night_surcharge,
  night_percentage: nightPricing.night_percentage,
  night_minimum_fare: nightPricing.night_minimum_fare,
  journey_fare: nightPricing.journey_fare,

  // Driver pickup fee — Ride Now only
  pickup_surcharge: pickupSurcharge,
  pickup_distance_km: pickupEstimate?.distance_km ?? null,
  pickup_driver_id: pickupEstimate?.driver_id ?? null,

  // Final passenger fare
  fare: nightPricing.journey_fare + pickupSurcharge,
};

   const quotePayload = {
  pickup_area: String(req.query.pickup_area || ""),
  dropoff_area: String(req.query.dropoff_area || ""),
  pickup_lat: pickupLat,
  pickup_lng: pickupLng,
  dropoff_lat: dropoffLat,
  dropoff_lng: dropoffLng,
  fare,
  ride_type: rideType,

  // Lock scheduled pickup time into the signed quote.
  scheduled_pickup_at:
    rideType === "scheduled"
      ? farePickupAt.toISOString()
      : null,

  expires_at: Date.now() + ROUTEX_FARE_QUOTE_TTL_MS,
};
    const fare_quote_token = signRouteXFareQuote(quotePayload);
    console.log("RouteX fare quote:", {
      ...fare,
      pickup_driver_id: pickupEstimate?.driver_id ?? null,
      quote_expires_at: quotePayload.expires_at,
    });
    return res.json({
      ...fare,
      fare_quote_token,
      quote_expires_at: quotePayload.expires_at,
    });
  } catch (error) {
    console.error("CALCULATE FARE ERROR:", error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : "Fare calculation is temporarily unavailable. Please try again later.",
    });
  }
});

app.get("/passenger-trips/:id", async (req, res) => {
  try {
    const passengerId = req.params.id;

    const result = await pool.query(
      `
      SELECT *
      FROM trip_bookings
      WHERE passenger_id = $1
      ORDER BY id DESC
      `,
      [passengerId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("PASSENGER TRIPS ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/passenger-bookings/:id", async (req, res) => {
  try {
    const passengerId = req.params.id;

    // Mark waiting bookings as expired after 10 minutes
    await pool.query(
      `
      UPDATE trip_bookings
      SET
        booking_status = 'Expired',
        trip_status = 'Expired'
      WHERE passenger_id = $1
        AND booking_status = 'Waiting'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
      `,
      [passengerId],
    );

    // Load passenger booking history
    const result = await pool.query(
      `
       SELECT
  tb.*,
  d.full_name AS driver_name,
  d.phone AS driver_phone,
  d.profile_image AS driver_profile_image,
  d.vehicle_type,
  d.vehicle_color,
  d.license_plate,

  (
    SELECT ROUND(AVG(dr.rating)::numeric, 1)
    FROM driver_reviews dr
    WHERE dr.driver_id = d.id
  ) AS average_rating,

  (
    SELECT COUNT(*)::integer
    FROM driver_reviews dr
    WHERE dr.driver_id = d.id
  ) AS review_count
,
EXISTS (
  SELECT 1
  FROM driver_reviews dr
  WHERE dr.booking_id = tb.id
) AS has_reviewed
FROM trip_bookings tb
      LEFT JOIN drivers d
        ON tb.assigned_driver_id = d.id
      WHERE tb.passenger_id = $1
      ORDER BY tb.id DESC
      `,
      [passengerId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("PASSENGER BOOKINGS ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/* =========================
   PASSENGER LIVE DRIVER TRACKING
========================= */

app.get(
  "/passenger-bookings/:passengerId/:bookingId/driver-location",
  async (req, res) => {
    try {
      const { passengerId, bookingId } = req.params;

      const result = await pool.query(
        `
        SELECT
          tb.id AS booking_id,
          tb.trip_status,
          tb.booking_status,
          tb.pickup_lat,
          tb.pickup_lng,

          d.id AS driver_id,
          split_part(d.full_name, ' ', 1) AS driver_name,
          d.profile_image AS driver_profile_image,
          d.vehicle_type,
          d.vehicle_color,
          d.license_plate,
          d.current_lat AS driver_lat,
          d.current_lng AS driver_lng

        FROM trip_bookings tb

        JOIN drivers d
          ON d.id = tb.assigned_driver_id

        WHERE tb.id = $1
          AND tb.passenger_id = $2
          AND tb.assigned_driver_id IS NOT NULL
          AND tb.trip_status IN ('Accepted', 'In Progress')

        LIMIT 1
        `,
        [bookingId, passengerId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Active trip not found",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("PASSENGER DRIVER LOCATION ERROR:", error);

      res.status(500).json({
        error: "Unable to load driver location",
      });
    }
  },
);
const PORT = process.env.PORT || 5000;

app.post("/driver-reviews", async (req, res) => {
  try {
    const { booking_id, passenger_id, rating, review_text } = req.body;

    // Check that this was a completed trip
    // belonging to this passenger and that a driver was assigned.
    const bookingResult = await pool.query(
      `
      SELECT id, passenger_id, assigned_driver_id, trip_status
      FROM trip_bookings
      WHERE id = $1
        AND passenger_id = $2
        AND trip_status = 'Completed'
        AND assigned_driver_id IS NOT NULL
      `,
      [booking_id, passenger_id],
    );

    if (bookingResult.rows.length === 0) {
      return res.status(400).json({
        error: "Only completed trips can be reviewed.",
      });
    }

    const booking = bookingResult.rows[0];

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO driver_reviews
        (
          booking_id,
          driver_id,
          passenger_id,
          rating,
          review_text
        )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        booking.id,
        booking.assigned_driver_id,
        passenger_id,
        numericRating,
        review_text?.trim() || null,
      ],
    );

    res.status(201).json({
      message: "Review submitted successfully.",
      review: result.rows[0],
    });
  } catch (error) {
    console.error("DRIVER REVIEW ERROR:", error);

    // booking_id is UNIQUE, so prevent a second review.
    if (error.code === "23505") {
      return res.status(409).json({
        error: "You have already reviewed this trip.",
      });
    }

    res.status(500).json({
      error: "Failed to submit review.",
    });
  }
});

app.get("/drivers/:id/rating", async (req, res) => {
  try {
    const driverId = req.params.id;

    const result = await pool.query(
      `
      SELECT
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        COUNT(*)::integer AS review_count
      FROM driver_reviews
      WHERE driver_id = $1
      `,
      [driverId],
    );

    res.json({
      average_rating: result.rows[0].average_rating
        ? Number(result.rows[0].average_rating)
        : null,
      review_count: Number(result.rows[0].review_count) || 0,
    });
  } catch (error) {
    console.error("DRIVER RATING ERROR:", error);

    res.json({ average_rating: null, review_count: 0 });
  }
});

app.get("/drivers/:id/reviews", async (req, res) => {
  try {
    const driverId = req.params.id;

    const result = await pool.query(
      `
      SELECT
        dr.id,
        dr.rating,
        dr.review_text,
        dr.created_at
      FROM driver_reviews dr
      WHERE dr.driver_id = $1
      ORDER BY dr.created_at DESC
      `,
      [driverId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("DRIVER REVIEWS ERROR:", error);

    res.json([]);
  }
});

setInterval(async () => {
  try {
    await pool.query(`
      UPDATE drivers
      SET
        is_online = false,
        status = 'Offline'
      WHERE is_online = true
        AND last_online_at IS NOT NULL
        AND last_online_at < NOW() - INTERVAL '30 minutes'
    `);
  } catch (error) {
    console.error("DRIVER ONLINE CLEANUP ERROR:", error);
  }
}, 60 * 1000);


// ============================================================
// MONTHLY SHARED TRANSPORT - driver route management (phase 2)
// Independent of Ride Now and Scheduled Rides.
// ============================================================
const monthlyDaysValid = (days) => Array.isArray(days) && days.length > 0 && days.length <= 7 && days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7) && new Set(days).size === days.length;
const monthlyTimeValid = (time) => typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
const monthlyLabelValid = (value) => typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 180;
const monthlyCoordinateValid = (value, max) => value == null || (typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= max);

app.get("/monthly-transport/my-routes", authenticateDriver, async (req, res) => {
  try {
   const result = await pool.query(`
  SELECT
    r.*,
    a.occupied_seats,
    a.available_seats,
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', s.id,
          'stop_label', s.stop_label,
          'latitude', s.latitude,
          'longitude', s.longitude,
          'stop_order', s.stop_order,
          'driver_approved', s.driver_approved
        )
        ORDER BY s.stop_order, s.id
      )
      FROM public.monthly_route_stops s
      WHERE s.route_id = r.id
    ), '[]'::json) AS stops
  FROM public.monthly_routes r
  JOIN public.monthly_route_availability a ON a.route_id = r.id
  WHERE r.driver_id = $1
  ORDER BY r.created_at DESC
`, [req.authenticatedDriverId]);
    res.json(result.rows);
  } catch (error) {
    console.error("MONTHLY MY ROUTES ERROR:", error);
    res.status(500).json({ error: "Unable to load monthly routes." });
  }
});

app.post("/monthly-transport/my-routes", authenticateDriver, async (req, res) => {
  try {
    const {
      route_name, origin_label, destination_label,
      origin_lat = null, origin_lng = null,
      destination_lat = null, destination_lng = null,
      morning_departure, afternoon_return,
      operating_days = [1,2,3,4,5], seat_capacity, monthly_fare
    } = req.body || {};
    const seats = Number(seat_capacity);
    const fare = Number(monthly_fare);
    if (![route_name, origin_label, destination_label].every(monthlyLabelValid) ||
        !monthlyTimeValid(morning_departure) || !monthlyTimeValid(afternoon_return) ||
        !monthlyDaysValid(operating_days) ||
        !Number.isInteger(seats) || seats < 1 || seats > 30 ||
        !Number.isFinite(fare) || fare <= 0 || fare > 100000 ||
        !monthlyCoordinateValid(origin_lat, 90) || !monthlyCoordinateValid(origin_lng, 180) ||
        !monthlyCoordinateValid(destination_lat, 90) || !monthlyCoordinateValid(destination_lng, 180)) {
      return res.status(400).json({ error: "Please provide valid route, schedule, seat and fare details." });
    }
    const result = await pool.query(`
      INSERT INTO public.monthly_routes
        (driver_id, route_name, origin_label, destination_label, origin_lat, origin_lng,
         destination_lat, destination_lng, morning_departure, afternoon_return,
         operating_days, seat_capacity, monthly_fare, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft') RETURNING *
    `, [req.authenticatedDriverId, route_name.trim(), origin_label.trim(), destination_label.trim(),
        origin_lat, origin_lng, destination_lat, destination_lng,
        morning_departure, afternoon_return, operating_days, seats, fare]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("MONTHLY CREATE ROUTE ERROR:", error);
    res.status(500).json({ error: "Unable to create monthly route." });
  }
});

app.patch("/monthly-transport/my-routes/:id/status", authenticateDriver, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['draft', 'active', 'paused', 'closed'].includes(status) || !/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid route or status." });
    }
    // A route may only be activated after its pickup points have been approved.
    if (status === 'active') {
      const stops = await pool.query(`
        SELECT COUNT(*)::int AS total FROM public.monthly_route_stops
        WHERE route_id=$1 AND driver_approved=true
      `, [req.params.id]);
      if (stops.rows[0].total < 1) {
        return res.status(409).json({ error: "Add and approve a safe pickup point before activating this route." });
      }
    }
    const result = await pool.query(`
      UPDATE public.monthly_routes SET status=$1, updated_at=now()
      WHERE id=$2 AND driver_id=$3 RETURNING *
    `, [status, req.params.id, req.authenticatedDriverId]);
    if (!result.rowCount) return res.status(404).json({ error: "Route not found." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("MONTHLY STATUS ERROR:", error);
    res.status(500).json({ error: "Unable to update monthly route." });
  }
});

app.post("/monthly-transport/my-routes/:id/stops", authenticateDriver, async (req, res) => {
  try {
    const { stop_label, latitude, longitude, stop_order, pickup_allowed = true, dropoff_allowed = true } = req.body || {};
    if (!/^\d+$/.test(req.params.id) || !monthlyLabelValid(stop_label) ||
        !monthlyCoordinateValid(latitude, 90) || latitude == null ||
        !monthlyCoordinateValid(longitude, 180) || longitude == null ||
        !Number.isInteger(stop_order) || stop_order < 0 || stop_order > 100 ||
        typeof pickup_allowed !== 'boolean' || typeof dropoff_allowed !== 'boolean') {
      return res.status(400).json({ error: "Invalid pickup point details." });
    }
    const result = await pool.query(`
      INSERT INTO public.monthly_route_stops
        (route_id, stop_label, latitude, longitude, stop_order, pickup_allowed, dropoff_allowed, driver_approved)
      SELECT r.id, $3, $4, $5, $6, $7, $8, false
      FROM public.monthly_routes r WHERE r.id=$1 AND r.driver_id=$2 AND r.status IN ('draft','paused')
      RETURNING *
    `, [req.params.id, req.authenticatedDriverId, stop_label.trim(), latitude, longitude, stop_order, pickup_allowed, dropoff_allowed]);
    if (!result.rowCount) return res.status(404).json({ error: "Draft or paused route not found." });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: "A stop with this order already exists." });
    console.error("MONTHLY STOP ERROR:", error);
    res.status(500).json({ error: "Unable to save pickup point." });
  }
});

app.patch("/monthly-transport/my-routes/:routeId/stops/:stopId/approve", authenticateDriver, async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.routeId) || !/^\d+$/.test(req.params.stopId)) return res.status(400).json({ error: "Invalid pickup point." });
    const result = await pool.query(`
      UPDATE public.monthly_route_stops s SET driver_approved=true
      FROM public.monthly_routes r
      WHERE s.id=$1 AND s.route_id=r.id AND r.id=$2 AND r.driver_id=$3
      RETURNING s.*
    `, [req.params.stopId, req.params.routeId, req.authenticatedDriverId]);
    if (!result.rowCount) return res.status(404).json({ error: "Pickup point not found." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("MONTHLY APPROVE STOP ERROR:", error);
    res.status(500).json({ error: "Unable to approve pickup point." });
  }
});

app.get("/monthly-transport/routes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.route_name, r.origin_label, r.destination_label,
             r.origin_lat, r.origin_lng, r.destination_lat, r.destination_lng,
             r.morning_departure, r.afternoon_return, r.operating_days,
             r.monthly_fare, a.available_seats, a.seat_capacity,
             COALESCE((SELECT json_agg(json_build_object(
               'id', s.id, 'label', s.stop_label, 'latitude', s.latitude,
               'longitude', s.longitude, 'pickup_allowed', s.pickup_allowed,
               'dropoff_allowed', s.dropoff_allowed) ORDER BY s.stop_order)
               FROM public.monthly_route_stops s
               WHERE s.route_id=r.id AND s.driver_approved=true), '[]'::json) AS stops
      FROM public.monthly_routes r
      JOIN public.monthly_route_availability a ON a.route_id=r.id
      WHERE r.status='active'
      ORDER BY r.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("MONTHLY PUBLIC ROUTES ERROR:", error);
    res.status(500).json({ error: "Unable to load monthly transport routes." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
