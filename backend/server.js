const express = require("express");
const cors = require("cors");
console.log("SERVER VERSION: DISCOUNT TEST");

const pool = require("./db");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function sendWhatsAppBookingAlert(
  phone,
  pickup,
  destination,
  fare
) {
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
      }
    );

    const data = await response.json();

    console.log("WHATSAPP RESPONSE:", data);

    if (!response.ok) {
      console.error(
        "WHATSAPP ERROR:",
        response.status,
        data
      );
    }

    return data;

  } catch (error) {
    console.error("WHATSAPP SEND ERROR:", error);
  }
}

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
      cb(
        new Error("Only image files are allowed.")
      );
    }
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

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
      "SELECT * FROM passengers ORDER BY id DESC"
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
      ]
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
    const result = await pool.query(
      "SELECT * FROM vehicles ORDER BY id DESC"
    );

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
      [registration, capacity]
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
    const result = await pool.query(
      "SELECT * FROM drivers ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: error.message,
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
  license_plate
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
    "2026-09-14"
  ]
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
    const {
      route_name,
      departure_date,
      vehicle_id,
      driver_id
    } = req.body;
    const vehicleCheck = await pool.query(
  `
  SELECT *
  FROM vehicles
  WHERE id = $1
  AND status = 'Available'
  `,
  [vehicle_id]
);

if (vehicleCheck.rows.length === 0) {
  return res.status(400).json({
    message: "Vehicle not available"
  });
}

const driverCheck = await pool.query(
  `
  SELECT *
  FROM drivers
  WHERE id = $1
  AND status = 'Available'
  `,
  [driver_id]
);

if (driverCheck.rows.length === 0) {
  return res.status(400).json({
    message: "Driver not available"
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
      [
        route_name,
        departure_date,
        vehicle_id,
        driver_id
      ]
    );
await pool.query(
  `
  UPDATE vehicles
  SET status = 'Assigned'
  WHERE id = $1
  `,
  [vehicle_id]
);

await pool.query(
  `
  UPDATE drivers
  SET status = 'Assigned'
  WHERE id = $1
  `,
  [driver_id]
);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/trip-bookings", async (req, res) => {
  try {
    const {
  trip_id,
  passenger_id,
  promo_code
} = req.body;

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
      [
  trip_id,
  passenger_id,
  promo_code || null
]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
    }); 

  }
});

app.post(
  "/driver/upload-photo",
  upload.single("photo"),
  async (req, res) => {
    try {
      console.log("DRIVER UPLOAD ROUTE HIT");

      const { driverId } = req.body;

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

      const fileExt =
        req.file.originalname.split(".").pop() || "jpg";

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
        [imageUrl, driverId]
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
  }
);
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
        [passengerId]
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
        file.originalname
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const fileName =
        `passengers/${passengerId}-${Date.now()}.${extension}`;

      console.log("Uploading to Supabase:", fileName);

      // -----------------------------------------------------
      // UPLOAD TO SUPABASE STORAGE
      // -----------------------------------------------------

      const { error: uploadError } =
        await supabase.storage
          .from("profile-photos")
          .upload(
            fileName,
            file.buffer,
            {
              contentType: file.mimetype,
              upsert: true,
            }
          );

      if (uploadError) {
        console.error(
          "SUPABASE UPLOAD ERROR:",
          uploadError
        );

        return res.status(500).json({
          success: false,
          error: uploadError.message,
        });
      }

      // -----------------------------------------------------
      // GET PUBLIC PHOTO URL
      // -----------------------------------------------------

      const { data: publicUrlData } =
        supabase.storage
          .from("profile-photos")
          .getPublicUrl(fileName);

      const imageUrl =
        publicUrlData?.publicUrl;

      if (!imageUrl) {
        console.error(
          "Could not create public image URL."
        );

        return res.status(500).json({
          success: false,
          error:
            "Could not create profile photo URL.",
        });
      }

      console.log(
        "PROFILE IMAGE URL:",
        imageUrl
      );

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
        [imageUrl, passengerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Passenger not found.",
        });
      }

      console.log(
        "PASSENGER PHOTO SAVED"
      );

      // -----------------------------------------------------
      // RETURN SAVED PASSENGER + IMAGE
      // -----------------------------------------------------

      return res.json({
        success: true,

        // Makes data.image available
        image:
          result.rows[0].profile_image,

        // Also returns updated passenger
        passenger:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "PASSENGER PHOTO UPLOAD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload profile photo.",
      });
    }
  }
);

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
  fare_amount,
  promo_code
} = req.body;

// Passenger GPS is mandatory for every RouteX booking
const pickupLatNumber = Number(pickup_lat);
const pickupLngNumber = Number(pickup_lng);

if (
  pickup_lat == null ||
  pickup_lng == null ||
  !Number.isFinite(pickupLatNumber) ||
  !Number.isFinite(pickupLngNumber) ||
  pickupLatNumber < -90 ||
  pickupLatNumber > 90 ||
  pickupLngNumber < -180 ||
  pickupLngNumber > 180
) {
  return res.status(400).json({
    error:
      "A valid passenger GPS pickup location is required to create a booking.",
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
  [pickup_area]
);

const dropoffAreaResult = await pool.query(
  `
  SELECT latitude, longitude
  FROM areas
  WHERE area_name = $1
  `,
  [dropoff_area]
);
console.log(
  "Pickup Lookup:",
  pickupAreaResult.rows
);

console.log(
  "Dropoff Lookup:",
  dropoffAreaResult.rows
);
// Passenger pickup must always use their confirmed GPS position
const pickupLat = pickupLatNumber;
const pickupLng = pickupLngNumber;

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


console.log("FINAL PICKUP GPS:", {
  lat: pickupLat,
  lng: pickupLng,
});

console.log("FINAL DESTINATION GPS:", {
  lat: destinationLat,
  lng: destinationLng,
});

  const baseFare = Number(fare_amount);

let discountAmount = 0;

if (
  promo_code &&
  promo_code.trim().toUpperCase() === "WELCOME20"
) {
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
    [passenger_id]
  );

  // Check how many times WELCOME20 has been used in total
  const totalPromoUses = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM trip_bookings
    WHERE UPPER(TRIM(promo_code)) = 'WELCOME20'
      AND discount_amount > 0
    `
  );

  const promoUses = totalPromoUses.rows[0]?.total || 0;

  if (existingPassengerPromo.rows.length > 0) {
  return res.status(400).json({
    error: "You have already used WELCOME20."
  });
}
  if (promoUses >= 10) {
  return res.status(400).json({
    error: "WELCOME20 has reached its 10-person limit."
  });
}

  // Apply discount only if:
  // 1. Passenger has never used it
  // 2. Fewer than 10 people have used it
  if (
    existingPassengerPromo.rows.length === 0 &&
    promoUses < 10
  ) {
    discountAmount = 20;
  }
}

const passengerAmount = Math.max(
  0,
  baseFare - discountAmount
);

console.log("Base Fare:", baseFare);
console.log("Discount:", discountAmount);
console.log("Passenger Pays:", passengerAmount);
console.log("Driver Fare:", baseFare);



console.log("Original Fare:", fare_amount);
console.log("Promo Code:", promo_code);
console.log("Passenger Pays:", passengerAmount);

const bookingResult = await pool.query(
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
    expires_at
  )
  VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
    NOW() + INTERVAL '10 minutes'
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
    "Waiting",  // trip_status
    "Waiting",  // booking_status
    pickupLat,
    pickupLng,
    destinationLat,
    destinationLng
  ]
);

const newBooking = bookingResult.rows[0];

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
  `,
  [
    Number(newBooking.pickup_lat),
    Number(newBooking.pickup_lng),
  ]
);

console.log(
  `FOUND ${nearbyDrivers.rows.length} NEARBY DRIVERS`
);

for (const driver of nearbyDrivers.rows) {
  console.log(
    `SENDING WHATSAPP TO DRIVER: ${driver.full_name}`
  );

  await sendWhatsAppBookingAlert(
    driver.phone,
    newBooking.pickup_address || newBooking.pickup_area,
    newBooking.dropoff_address || newBooking.dropoff_area,
    Number(newBooking.fare_amount).toFixed(2)
  );
}

console.log("WHATSAPP DRIVER ALERTS FINISHED");

res.status(201).json({
  message: "Booking created",
  booking: newBooking
});

  } catch (error) {

    res.status(500).json({
      error: error.message
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
        error:
          "Terms & Conditions and Privacy Policy must be accepted.",
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
      [
        full_name,
        phone,
        email,
        referral_code,
        "2026-09-14",
        "2026-09-14",
      ]
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
      [
        full_name,
        email,
        hashedPassword,
        "passenger",
      ]
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
      [tripId]
    );
    
    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: error.message
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
      [passengerId]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({
        message: "Passenger already assigned"
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
      [tripId, passengerId]
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
  [tripId]
);

const capacity = Number(
  occupancyCheck.rows[0].capacity
);

const passengerCount = Number(
  occupancyCheck.rows[0].passenger_count
);

if (passengerCount >= capacity) {

  await pool.query(
    `
    UPDATE trips
    SET status = 'READY_TO_DEPART'
    WHERE id = $1
    `,
    [tripId]
  );

}

    res.json({
      message: "Passenger assigned",
      trip_id: tripId,
      booking: bookingResult.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [tripId]
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
      [tripId]
    );

    res.json({
      trip: tripResult.rows[0],
      passengers: passengerResult.rows
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.patch("/bookings/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE trip_bookings
      SET
        booking_status = 'Cancelled',
        trip_status = 'Cancelled'
   WHERE id = $1
  AND booking_status = 'Waiting'
  AND expires_at > NOW()
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Booking cannot be cancelled."
      });
    }

    res.json({
      message: "Booking cancelled",
      booking: result.rows[0]
    });

  } catch (error) {
    console.error("CANCEL BOOKING ERROR:", error);

    res.status(500).json({
      error: "Failed to cancel booking."
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
      [tripId]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [tripId]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/addresses/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (query.length < 2) {
      return res.json([]);
    }

    // 1. Search RouteX's own address table first
   const localResult = await pool.query(
  `
  SELECT
    id,
    address,
    full_address,
    area_name,
    latitude,
    longitude,
    place_type
  FROM public.addresses
  WHERE
    address ILIKE $1
    OR full_address ILIKE $1
  ORDER BY address
  LIMIT 10
  `,
  [`%${query}%`]
);

   if (localResult.rows.length > 0) {

  // First check whether any matching local result
  // already has coordinates
  const localWithCoordinates = localResult.rows.filter(
    (item) =>
      item.latitude !== null &&
      item.longitude !== null
  );

  if (localWithCoordinates.length > 0) {
    return res.json(
      localWithCoordinates.map((item) => ({
        address: item.address,
        full_address:
          item.full_address || item.address,
        area_name: item.area_name,
        place_type: item.place_type,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        source: "local",
      }))
    );
  }

  // A local place was found, but it has no coordinates.
  // Try to geocode its full physical address.
  const place = localResult.rows.find(
    (item) =>
      item.full_address &&
      (
        item.latitude === null ||
        item.longitude === null
      )
  );
if (place) {
  try {
    const geocodeQueries = [
      `${place.full_address}, South Africa`,
      `${place.address}, ${place.area_name}, Upington, South Africa`,
      `${place.address}, Upington, South Africa`,
    ];

    for (const geocodeQuery of geocodeQueries) {
      const geocodeUrl =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(geocodeQuery)}` +
        `&format=jsonv2` +
        `&limit=1` +
        `&countrycodes=za`;

      const geocodeResponse = await fetch(
        geocodeUrl,
        {
          headers: {
            "User-Agent": "RouteX/1.0",
            "Accept-Language": "en",
          },
        }
      );

      if (!geocodeResponse.ok) {
        continue;
      }

      const geocodeData =
        await geocodeResponse.json();

      if (geocodeData.length === 0) {
        continue;
      }

      const lat = Number(
        geocodeData[0].lat
      );

      const lng = Number(
        geocodeData[0].lon
      );

      await pool.query(
        `
        UPDATE public.addresses
        SET
          latitude = $1,
          longitude = $2
        WHERE id = $3
        `,
        [lat, lng, place.id]
      );

      console.log(
        "GEOCODED LOCAL PLACE:",
        place.address,
        lat,
        lng,
        "USING:",
        geocodeQuery
      );

      return res.json([
        {
          address: place.address,
          full_address:
            place.full_address ||
            place.address,
          area_name: place.area_name,
          place_type: place.place_type,
          lat,
          lng,
          source: "local-geocoded",
        },
      ]);
    }

    console.log(
      "COULD NOT GEOCODE LOCAL PLACE:",
      place.address
    );

    return res.json([
  {
    address: place.address,
    full_address:
      place.full_address ||
      place.address,
    area_name: place.area_name,
    place_type: place.place_type,
    lat: null,
    lng: null,
    source: "local-no-coordinates",
  },
]);

  } catch (geocodeError) {
    console.error(
      "LOCAL PLACE GEOCODING FAILED:",
      geocodeError.message
    );
  }
}
}

    // 2. Only use OpenStreetMap if local database found nothing
    const searchQuery = `${query}, Upington, South Africa`;

    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(searchQuery)}` +
      `&format=jsonv2` +
      `&addressdetails=1` +
      `&limit=6` +
      `&countrycodes=za`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "RouteX/1.0",
        "Accept-Language": "en",
      },
    });

    // If Nominatim rate-limits us, don't crash the frontend
    if (response.status === 429) {
      console.log("Nominatim rate limited");
      return res.json([]);
    }

    if (!response.ok) {
      console.log(
        "Nominatim search failed:",
        response.status
      );

      return res.json([]);
    }

    const data = await response.json();

    const results = await Promise.all(
  data.map(async (item) => {
    const address = item.address || {};

    const areaName =
      address.suburb ||
      address.neighbourhood ||
      address.residential ||
      address.village ||
      address.quarter ||
      address.city_district ||
      address.town ||
      "";

    let normalizedArea = areaName;

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

    for (const knownArea of knownAreas) {
      if (
        item.display_name
          .toLowerCase()
          .includes(knownArea.toLowerCase())
      ) {
        normalizedArea = knownArea;
        break;
      }
    }

    const fullAddress = item.display_name.toLowerCase();

    if (
      fullAddress.includes("extension 1") ||
      fullAddress.includes("extension 2")
    ) {
      normalizedArea = "Rosedale";
    }

    if (areaName === "Louisvale - Upington") {
      normalizedArea = "Louisvale";
    }

   const street =
  address.road ||
  address.pedestrian ||
  address.residential ||
  "";

const houseNumber =
  address.house_number || "";

// Named places such as Shoprite, KFC,
// doctors, restaurants, hospitals, etc.
const placeName =
  item.name ||
  address.amenity ||
  address.shop ||
  address.office ||
  address.tourism ||
  address.healthcare ||
  address.leisure ||
  "";

// Normal street address
const streetAddress = houseNumber
  ? `${houseNumber} ${street}`.trim()
  : street;

// Prefer the place name when one exists.
// Otherwise use the normal street address.
const shortAddress =
  placeName ||
  streetAddress ||
  query;

// Save recognised places/addresses locally
if (
  shortAddress &&
  normalizedArea &&
  knownAreas.includes(normalizedArea)
) {
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
VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      `,
 [
  shortAddress,
  item.display_name,
  normalizedArea,
  Number(item.lat),
  Number(item.lon),
  item.type || item.category || null
]
    );
  } catch (saveError) {
    console.error(
      "FAILED TO SAVE ADDRESS:",
      saveError.message
    );
  }
}

return {
  address: shortAddress,
  full_address: item.display_name,
  area_name: normalizedArea,
  lat: Number(item.lat),
  lng: Number(item.lon),
  source: "osm",
}; 
  })
);

    res.json(results);
  } catch (error) {
    console.error("ADDRESS SEARCH ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
app.get("/dashboard", async (req, res) => {
  try {

    const passengerCount = await pool.query(
      "SELECT COUNT(*) FROM passengers"
    );

    const vehicleCount = await pool.query(
      "SELECT COUNT(*) FROM vehicles"
    );

    const driverCount = await pool.query(
      "SELECT COUNT(*) FROM drivers"
    );

    const tripCount = await pool.query(
      "SELECT COUNT(*) FROM trips"
    );

    res.json({
      passengers: passengerCount.rows[0].count,
      vehicles: vehicleCount.rows[0].count,
      drivers: driverCount.rows[0].count,
      trips: tripCount.rows[0].count
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [tripId]
    );

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [tripId]
    );

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      error: error.message
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
      error: error.message
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
      [tripId]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [tripId]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
  [tripId]
);

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [tripId]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
  [tripId]
);;

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
      [tripId]
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
      [tripId]
    );

    res.json({
      trip: tripInfo.rows[0],
      pickup_stops: pickupStops.rows,
      dropoff_stops: dropoffStops.rows
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      `
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      error: error.message
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
      [tripId]
    );

    res.json({
      message: "Trip departed",
      trip_id: tripId
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [tripId]
    );

    const vehicleId = tripResult.rows[0].vehicle_id;
    const driverId = tripResult.rows[0].driver_id;

    await pool.query(
      `
      UPDATE trips
      SET status = 'COMPLETED'
      WHERE id = $1
      `,
      [tripId]
    );

    await pool.query(
      `
      UPDATE vehicles
      SET status = 'Available'
      WHERE id = $1
      `,
      [vehicleId]
    );

    await pool.query(
      `
      UPDATE drivers
      SET status = 'Available'
      WHERE id = $1
      `,
      [driverId]
    );

    res.json({
      message: "Trip completed",
      trip_id: tripId
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: result.rows[0].id,
        full_name: result.rows[0].full_name,
        email: result.rows[0].email,
        role: result.rows[0].role
      }
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      revenue:
        totalRevenue.rows[0].revenue,
      outstanding:
        outstandingPayments.rows[0].outstanding
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [passengerId]
    );

    res.json({
      message: "Payment recorded"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/trip-requests", async (req, res) => {
  try {

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
      tb.pickup_address,
      tb.dropoff_address,
      tb.travel_date,
      tb.trip_status,
      tb.expires_at
  FROM trip_bookings tb
  JOIN passengers p
      ON tb.passenger_id = p.id
  WHERE tb.booking_status = 'Waiting'
    AND (
      tb.expires_at IS NULL
      OR tb.expires_at > NOW()
    )
  ORDER BY tb.id DESC
`);
    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.post(
  "/trip-requests/:id/accept",
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const { driverId } = req.body;

      const result = await pool.query(
        `
        UPDATE trip_bookings
        SET
          booking_status = 'Accepted',
          trip_status = 'Accepted',
          assigned_driver_id = $2
       WHERE id = $1
        AND booking_status = 'Waiting'
        AND assigned_driver_id IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      RETURNING *
        `,
        [bookingId, driverId]
      );

      const booking = result.rows[0];
            if (!booking) {
        return res.status(409).json({
          error: "This trip has already been accepted by another driver."
        });
      }

await pool.query(
  `
  INSERT INTO notifications
  (recipient_type, recipient_id, title, message)
  VALUES ($1, $2, $3, $4)
  `,
  [
    "passenger",
    booking.passenger_id,
    "Driver Assigned",
    "Your driver is on the way to collect you."
  ]
);

      res.json({
        message: "Trip accepted",
        booking
      });

    } catch (error) {
      console.error("ACCEPT TRIP ERROR:", error);

      res.status(500).json({
        error: error.message
      });
    }
  }
);

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
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("NOTIFICATIONS ERROR:", error);
    res.status(500).json({
      error: "Failed to load notifications",
    });
  }
})

app.post(
  "/trip-requests/:id/start",
  async (req, res) => {
    try {

      const bookingId = req.params.id;

      await pool.query(
        `
        UPDATE trip_bookings
        SET trip_status = 'In Progress'
        WHERE id = $1
        `,
        [bookingId]
      );

      res.json({
        message: "Trip started"
      });

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }
  }
);
app.post(
  "/trip-requests/:id/complete",
  async (req, res) => {
    try {

      const bookingId = req.params.id;

      await pool.query(
        `
        UPDATE trip_bookings
        SET trip_status = 'Completed'
        WHERE id = $1
        `,
        [bookingId]
      );
      
      res.json({
        message: "Trip completed"
      });

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }
  }
);
app.get("/accepted-trips", async (req, res) => {
  try {

   const result = await pool.query(`
  SELECT
    tb.*,
    p.full_name,
    p.phone,
    d.full_name AS driver_name
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

    res.status(500).json({
      error: error.message
    });

  }
});

app.get("/in-progress-trips", async (req, res) => {
  try {

   const result = await pool.query(`
  SELECT
    tb.*,
    p.full_name,
    p.phone,
    d.full_name AS driver_name
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

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/completed-trips", async (req, res) => {
  try {

    const result = await pool.query(`
  SELECT
    tb.*,
    p.full_name,
    p.phone,
    d.full_name AS driver_name
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

    res.status(500).json({
      error: error.message
    });

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

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/online-drivers", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT COUNT(*) AS total
      FROM drivers
      WHERE status = 'Available'
    `);

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [
        Number(pickup_lat),
        Number(pickup_lng),
      ]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("AVAILABLE DRIVERS ERROR:", error);

    res.status(500).json({
      error: error.message,
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
      [phone]
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
      passwordMatches = await bcrypt.compare(
        password,
        driver.password
      );
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
          [hashedPassword, driver.id]
        );

        console.log(
          `DRIVER PASSWORD UPGRADED: ${driver.id}`
        );
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Never send the password back to the frontend
    const { password: _password, ...safeDriver } = driver;

    res.json(safeDriver);

  } catch (error) {
    console.error("DRIVER LOGIN ERROR:", error);

    res.status(500).json({
      error: "Unable to log in",
    });
  }
});
app.post("/drivers/:id/status", async (req, res) => {
  try {
    console.log("STATUS ROUTE HIT");
    console.log("Driver ID:", req.params.id);
    console.log("Body:", req.body);

    const driverId = req.params.id;

    const {
      status,
      current_lat,
      current_lng,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE drivers
      SET
        status = $1,
        is_online = $2,
        current_lat = $3,
        current_lng = $4
      WHERE id = $5
      RETURNING *
      `,
      [
        status,
        status === "Available",
        current_lat,
        current_lng,
        driverId,
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error("DRIVER STATUS ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* =========================
   DRIVER LIVE LOCATION
========================= */

app.post("/drivers/:id/location", async (req, res) => {
  try {
    const driverId = req.params.id;
    const { latitude, longitude } = req.body;

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
      [lat, lng, driverId]
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
      [phone, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [referralCode]
    );
    const bookings = await pool.query(
  `
  SELECT COUNT(*) AS total
  FROM trip_bookings tb
  JOIN passengers p
    ON tb.passenger_id = p.id
  WHERE p.referral_code = $1
  `,
  [referralCode]
);

   res.json({
  registrations: Number(
    registrations.rows[0].total
  ),
  bookings: Number(
    bookings.rows[0].total
  )
});

  } catch (error) {

    res.status(500).json({
      error: error.message
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
  [referralCode]
);

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

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
      [email]
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
      passwordMatches = await bcrypt.compare(
        password,
        user.password
      );
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
          [hashedPassword, user.id]
        );

        console.log(
          `PASSENGER PASSWORD UPGRADED: ${user.id}`
        );
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
      [email]
    );

    if (passengerResult.rows.length === 0) {
      return res.status(404).json({
        error: "Passenger profile not found",
      });
    }

    res.json(passengerResult.rows[0]);

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
      } = req.body;

      // =========================================
      // REQUIRE LEGAL ACCEPTANCE
      // =========================================
      if (
        acceptedDriverTerms !== "true" ||
        acceptedPrivacy !== "true"
      ) {
        return res.status(400).json({
          error:
            "Driver Terms and Privacy Policy must be accepted.",
        });
      }

      const vehicleImage =
        req.files?.vehicle_photo?.[0]?.filename || null;

      const profileImage =
        req.files?.profile_photo?.[0]?.filename || null;

      const result = await pool.query(
        `
        INSERT INTO driver_applications
        (
          full_name,
          phone,
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
          NOW(),
          $9,
          NOW(),
          $10
        )
        RETURNING *
        `,
        [
          full_name,
          phone,
          vehicle_type,
          vehicle_color,
          license_plate,
          referral_code,
          vehicleImage,
          profileImage,
          "2026-09-14",
          "2026-09-14",
        ]
      );

      res.json(result.rows[0]);

    } catch (error) {
      console.error("DRIVER APPLICATION ERROR:", error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
);
app.get("/admin/stats", async (req, res) => {
  try {

    const passengers = await pool.query(
      "SELECT COUNT(*) AS total FROM passengers"
    );

    const drivers = await pool.query(
      "SELECT COUNT(*) AS total FROM drivers"
    );

    const ambassadors = await pool.query(
      "SELECT COUNT(*) AS total FROM ambassadors"
    );

    const bookings = await pool.query(
      "SELECT COUNT(*) AS total FROM trip_bookings"
    );

    const onlineDrivers = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM drivers
      WHERE status = 'Online'
      `
    );

    const applications = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM driver_applications
      WHERE status = 'Pending'
      `
    );

    res.json({
      passengers: Number(passengers.rows[0].total),
      drivers: Number(drivers.rows[0].total),
      ambassadors: Number(ambassadors.rows[0].total),
      bookings: Number(bookings.rows[0].total),
      onlineDrivers: Number(onlineDrivers.rows[0].total),
      pendingApplications: Number(applications.rows[0].total)
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      `
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
      [applicationId]
    );

    if (application.rows.length === 0) {
      return res.status(404).json({
        error: "Application not found"
      });
    }

    const appData = application.rows[0];
    const defaultDriverPassword = "1234";

    const hashedDriverPassword = await bcrypt.hash(
      defaultDriverPassword,
      12
    );

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
  referral_code
)

     VALUES
(
  $1,
  $2,
  'Offline',
  $7,
  'driver',
  $3,
  $4,
  $5,
  $6
)
      `,
      [
  appData.full_name,
  appData.phone,
  appData.vehicle_type,
  appData.vehicle_color,
  appData.license_plate,
  appData.referral_code,
  hashedDriverPassword,
]
    );

    await pool.query(
      `
      UPDATE driver_applications
      SET status = 'Approved'
      WHERE id = $1
      `,
      [applicationId]
    );

    res.json({
      message: "Application approved"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
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
      [applicationId]
    );

    res.json({
      message: "Application rejected"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
app.get("/calculate-fare", async (req, res) => {
  try {
    const pickup_area = req.query.pickup_area;
    const dropoff_area = req.query.dropoff_area;

    const pickup_lat = Number(req.query.pickup_lat);
    const pickup_lng = Number(req.query.pickup_lng);
    const dropoff_lat = Number(req.query.dropoff_lat);
    const dropoff_lng = Number(req.query.dropoff_lng);

    const hasCoordinates =
      Number.isFinite(pickup_lat) &&
      Number.isFinite(pickup_lng) &&
      Number.isFinite(dropoff_lat) &&
      Number.isFinite(dropoff_lng);


      // Central Upington reference point
      const UPINGTON_CENTRE_LAT = -28.4575;
      const UPINGTON_CENTRE_LNG = 21.2427;

      // Calculate straight-line distance between two GPS points
function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
}
    // =========================================
    // 1. ROAD DISTANCE PRICING
    // =========================================

    if (hasCoordinates) {
      const routeUrl =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${pickup_lng},${pickup_lat};${dropoff_lng},${dropoff_lat}` +
        `?overview=false`;

      const routeResponse = await fetch(routeUrl);

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();

        if (
          routeData.code === "Ok" &&
          routeData.routes &&
          routeData.routes.length > 0
        ) {
          const distanceKm =
            routeData.routes[0].distance / 1000;

          let fare;

          if (distanceKm <= 3) {
            fare = 55;
          } else if (distanceKm <= 5) {
            fare = 65;
          } else if (distanceKm <= 7) {
            fare = 75;
          } else if (distanceKm <= 9) {
            fare = 85;
          } else if (distanceKm <= 12) {
            fare = 100;
          } else if (distanceKm <= 15) {
            fare = 115;
          } else if (distanceKm <= 20) {
            fare = 135;
          } else if (distanceKm <= 25) {
            fare = 160;
          } else {
            // Temporary rule for trips over 25 km
            fare = 160 + Math.ceil(distanceKm - 25) * 6;
          }

            // =========================================
// OUT-OF-TOWN PICKUP FEE
// =========================================

            const pickupDistanceFromUpington =
  calculateDistanceKm(
    Number(pickup_lat),
    Number(pickup_lng),
    UPINGTON_CENTRE_LAT,
    UPINGTON_CENTRE_LNG
  );

const dropoffDistanceFromUpington =
  calculateDistanceKm(
    Number(dropoff_lat),
    Number(dropoff_lng),
    UPINGTON_CENTRE_LAT,
    UPINGTON_CENTRE_LNG
  );

const isOutOfTown =
  pickupDistanceFromUpington > 20 ||
  dropoffDistanceFromUpington > 20;

const outOfTownFee = isOutOfTown ? 50 : 0;

fare += outOfTownFee;

          const discount = 0;
          const finalFare = fare - discount;

          console.log("Distance fare response", {
            distance_km: distanceKm,
            base_fare: fare,
            discount,
            fare: finalFare,
          });

       return res.json({
          pricing_method: "distance",
          distance_km: Number(distanceKm.toFixed(2)),
          base_fare: fare - outOfTownFee,
          out_of_town_fee: outOfTownFee,
          pickup_distance_from_upington: Number(
            pickupDistanceFromUpington.toFixed(2)
          ),
          discount,
          fare: finalFare,
        });
        }
      }

      console.log(
        "Road distance unavailable - using area fare fallback"
      );
    }

    // =========================================
    // 2. AREA MATRIX FALLBACK
    // =========================================

    const pickupResult = await pool.query(
      `
      SELECT category
      FROM public.areas
      WHERE area_name = $1
      `,
      [pickup_area]
    );

    const dropoffResult = await pool.query(
      `
      SELECT category
      FROM public.areas
      WHERE area_name = $1
      `,
      [dropoff_area]
    );

    if (
      pickupResult.rows.length === 0 ||
      dropoffResult.rows.length === 0
    ) {
      return res.status(400).json({
        error: "Pickup or drop-off area was not recognised",
      });
    }

    const pickupCategory =
      pickupResult.rows[0].category;

    const dropoffCategory =
      dropoffResult.rows[0].category;

    let fare;
    let baseFare;

    if (pickup_area === dropoff_area) {
      fare = 50;
      baseFare = fare;
    } else {
      const fareResult = await pool.query(
        `
        SELECT fare
        FROM public.fare_matrix
        WHERE from_category = $1
        AND to_category = $2
        `,
        [
          pickupCategory,
          dropoffCategory
        ]
      );

      if (fareResult.rows.length === 0) {
        return res.status(400).json({
          error: "Fare not configured for this route",
        });
      }

      fare = Number(fareResult.rows[0].fare);
      baseFare = fare;
    }

    const discount = 0;

    fare = fare - discount;

    console.log("Area fare response", {
      pricing_method: "area",
      pickup_category: pickupCategory,
      dropoff_category: dropoffCategory,
      base_fare: baseFare,
      discount,
      fare,
    });

    res.json({
      pricing_method: "area",
      pickup_category: pickupCategory,
      dropoff_category: dropoffCategory,
      base_fare: baseFare,
      discount,
      fare,
    });

  } catch (error) {
    console.error("CALCULATE FARE ERROR:", error);

    res.status(500).json({
      error: error.message,
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
      [passengerId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("PASSENGER TRIPS ERROR:", error);

    res.status(500).json({
      error: error.message
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
      [passengerId]
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
      [passengerId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("PASSENGER BOOKINGS ERROR:", error);

    res.status(500).json({
      error: error.message
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
        [bookingId, passengerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Active trip not found",
        });
      }

      res.json(result.rows[0]);

    } catch (error) {
      console.error(
        "PASSENGER DRIVER LOCATION ERROR:",
        error
      );

      res.status(500).json({
        error: "Unable to load driver location",
      });
    }
  }
);
const PORT = process.env.PORT || 5000;

app.post("/driver-reviews", async (req, res) => {
  try {
    const {
      booking_id,
      passenger_id,
      rating,
      review_text,
    } = req.body;

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
      [booking_id, passenger_id]
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
      ]
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
      [driverId]
    );

    res.json({
      average_rating:
        result.rows[0].average_rating
          ? Number(result.rows[0].average_rating)
          : null,
      review_count:
        Number(result.rows[0].review_count) || 0,
    });

  } catch (error) {
    console.error("DRIVER RATING ERROR:", error);

    res.status(500).json({
      error: "Failed to load driver rating.",
    });
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
      [driverId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("DRIVER REVIEWS ERROR:", error);

    res.status(500).json({
      error: "Failed to load driver reviews.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});