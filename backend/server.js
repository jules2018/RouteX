const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express();
app.get("/hello", (req, res) => {
  res.send("HELLO ROUTEX");
});
app.get("/hello", (req, res) => {
  res.send("HELLO ROUTEX");
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "ROUTEX BUILD 20260812",
  });
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
  license_plate
)
VALUES ($1,$2,$3,$4,$5,$6)
RETURNING *
      `,
      [
  full_name,
  phone,
  license_number,
  vehicle_type,
  vehicle_color,
  license_plate
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
      passenger_id
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO trip_bookings
      (
        trip_id,
        passenger_id
      )
      VALUES ($1,$2)
      RETURNING *
      `,
      [
        trip_id,
        passenger_id
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
    }); 

  }
});

app.post("/bookings", async (req, res) => {
  try {
    console.log("BOOKINGS ROUTE HIT");
  const {
  passenger_id,
  pickup_area,
  dropoff_area,
  pickup_address,
  dropoff_address,
  travel_date,
  fare_amount
} = req.body;
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
const pickupLat =
  pickupAreaResult.rows[0]?.latitude;

const pickupLng =
  pickupAreaResult.rows[0]?.longitude;

const destinationLat =
  dropoffAreaResult.rows[0]?.latitude;

const destinationLng =
  dropoffAreaResult.rows[0]?.longitude;

const bookingResult = await pool.query(
  `
INSERT INTO trip_bookings
(
  passenger_id,
  fare_amount,
  pickup_address,
  dropoff_address,
  travel_date,
  trip_status,
  pickup_lat,
  pickup_lng,
  destination_lat,
  destination_lng
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
RETURNING *
  `,
 [
  passenger_id,
  fare_amount,
  pickup_address,
  dropoff_address,
  travel_date,
  "Waiting",
  pickupLat,
  pickupLng,
  destinationLat,
  destinationLng
]
);

res.status(201).json({
  message: "Booking created",
  booking: bookingResult.rows[0]
});
  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.post("/passenger-register", async (req, res) => {
  try {

    const {
      full_name,
      phone,
      email,
      password,
      referral_code
    } = req.body;

    const passengerResult = await pool.query(
      `
      INSERT INTO passengers
      (
        full_name,
        phone,
        email,
        referral_code
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
     [
  full_name,
  phone,
  email,
  referral_code
]
    );

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
    password,
    "passenger"
  ]
);
    res.status(201).json({
      message: "Passenger registered successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
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
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    const result = await pool.query(
      `
      SELECT
        address,
        area_name
      FROM addresses
      WHERE address ILIKE $1
      ORDER BY address
      LIMIT 10
      `,
      [`%${query}%`]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
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
app.get("/available-drivers", async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT *
      FROM drivers
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
      p.full_name,
      p.phone,
      tb.pickup_address,
      tb.dropoff_address,
      tb.travel_date,
      tb.trip_status
  FROM trip_bookings tb
  JOIN passengers p
      ON tb.passenger_id = p.id
 WHERE tb.booking_status = 'Waiting'
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

      await pool.query(
        `
        UPDATE trip_bookings
        SET
          booking_status = 'Accepted',
          trip_status = 'Accepted',
          assigned_driver_id = $2
        WHERE id = $1
        `,
        [bookingId, driverId]
      );

      res.json({
        message: "Trip accepted"
      });

    } catch (error) {

      res.status(500).json({
        error: error.message
      });

    }
  }
);
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
app.post("/driver-login", async (req, res) => {
  try {

    const { phone, password } = req.body;

    const result = await pool.query(
      `
      SELECT *
      FROM drivers
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

app.post("/drivers/:id/status", async (req, res) => {
  try {
    console.log("STATUS ROUTE HIT");
    console.log("Driver ID:", req.params.id);
    console.log("Body:", req.body);

    const driverId = req.params.id;
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE drivers
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, driverId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: error.message,
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
        full_name,
        phone,
        created_at
      FROM passengers
      WHERE referral_code = $1
      ORDER BY created_at DESC
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

    const result = await pool.query(
  `
  SELECT *
  FROM users
  WHERE email = $1
  AND password = $2
  AND role = 'passenger'
  `,
  [email, password]
);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }
const passengerResult = await pool.query(
`
SELECT *
FROM passengers
WHERE email = $1

`,
[email]
);
   res.json(passengerResult.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.post("/passenger-register", async (req, res) => {
  try {

    const {
      full_name,
      phone,
      email,
      password
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO passengers
      (
        full_name,
        phone,
        email,
        password
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [
        full_name,
        phone,
        email,
        password
      ]
    );

    res.status(201).json({
      message: "Passenger registered successfully",
      passenger: result.rows[0]
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
const pickupCategory =
  pickupResult.rows[0].category;

const dropoffCategory =
  dropoffResult.rows[0].category;

let fare;

if (pickup_area === dropoff_area) {
  fare = 50;
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

  fare = fareResult.rows[0].fare;
}
res.json({
  pickup_category: pickupCategory,
  dropoff_category: dropoffCategory,
  fare
});
  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

app.get("/passenger-bookings/:id", async (req, res) => {
  try {

    const passengerId = req.params.id;  
    const result = await pool.query(
  `
  SELECT
    tb.id,
    tb.trip_id,
    tb.created_at,
    tb.pickup_address,
    tb.dropoff_address,
    tb.travel_date,
    tb.trip_status,
    d.full_name AS driver_name,
    d.vehicle_type,
    d.vehicle_color,
    d.license_plate

FROM trip_bookings tb
JOIN passengers p
    ON tb.passenger_id = p.id
LEFT JOIN drivers d
    ON tb.assigned_driver_id = d.id
WHERE tb.passenger_id = $1
ORDER BY tb.id DESC
  `,
  [passengerId]
);
res.json(result.rows);
  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

app.get("/passenger-trips/:id", async (req, res) => {
  try {

    const passengerId = req.params.id;

    const result = await pool.query(
  `
  SELECT
    p.*,
    d.full_name AS driver_name
  FROM passengers p
  LEFT JOIN drivers d
    ON p.assigned_driver_id = d.id
  WHERE p.id = $1
  `,
  [passengerId]
);


    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});