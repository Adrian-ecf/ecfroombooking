// Netlify Function backing the ECF Room Board.
// Stores all reservations as a single JSON array in Netlify Blobs.
//
// GET    /.netlify/functions/reservations           -> returns the full array
// POST   /.netlify/functions/reservations           -> body: {roomId,date,startMin,endMin,name,note}
//                                                        creates a reservation if it doesn't clash
// DELETE /.netlify/functions/reservations?id=<id>   -> removes a reservation by id
//
// All three return the full, up-to-date array of reservations on success,
// so the browser can just replace its local copy with the response.

const { getStore } = require("@netlify/blobs");

const STORE_NAME = "ecf-room-board";
const KEY = "reservations";

exports.handler = async function (event) {
  let store;
  try {
    store = getStore(STORE_NAME);
  } catch (err) {
    return respond(500, { error: "Storage isn't set up on this site yet: " + err.message });
  }

  try {
    if (event.httpMethod === "GET") {
      const current = (await store.get(KEY, { type: "json" })) || [];
      return respond(200, current);
    }

    if (event.httpMethod === "POST") {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch (e) {
        return respond(400, { error: "Invalid request body." });
      }

      const roomId = body.roomId;
      const date = body.date; // "YYYY-MM-DD"
      const startMin = Number(body.startMin);
      const endMin = Number(body.endMin);
      const name = (body.name || "").toString().trim().slice(0, 60);
      const note = (body.note || "").toString().trim().slice(0, 120);

      if (!roomId || !date || !name || !Number.isFinite(startMin) || !Number.isFinite(endMin)) {
        return respond(400, { error: "Missing or invalid fields." });
      }
      if (!(endMin > startMin)) {
        return respond(400, { error: "End time must be after the start time." });
      }

      const current = (await store.get(KEY, { type: "json" })) || [];

      const conflict = current.find(function (r) {
        return (
          r.roomId === roomId &&
          r.date === date &&
          startMin < r.endMin &&
          r.startMin < endMin
        );
      });
      if (conflict) {
        return respond(409, {
          error:
            "That clashes with " +
            conflict.name +
            "'s booking (" +
            minToLabel(conflict.startMin) +
            " – " +
            minToLabel(conflict.endMin) +
            "). Pick a different time.",
          conflict: conflict,
        });
      }

      const entry = {
        id: roomId + "_" + date + "_" + startMin + "_" + Date.now(),
        roomId: roomId,
        date: date,
        startMin: startMin,
        endMin: endMin,
        name: name,
        note: note,
      };

      const updated = current.concat([entry]);
      await store.setJSON(KEY, updated);
      return respond(200, updated);
    }

    if (event.httpMethod === "DELETE") {
      const id = (event.queryStringParameters || {}).id;
      if (!id) return respond(400, { error: "Missing reservation id." });

      const current = (await store.get(KEY, { type: "json" })) || [];
      const updated = current.filter(function (r) {
        return r.id !== id;
      });
      await store.setJSON(KEY, updated);
      return respond(200, updated);
    }

    return respond(405, { error: "Method not allowed." });
  } catch (err) {
    return respond(500, { error: err.message || "Unexpected server error." });
  }
};

function minToLabel(mins) {
  var h = Math.floor(mins / 60);
  var mm = mins % 60;
  var suffix = h >= 12 ? "PM" : "AM";
  var h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + (mm === 0 ? "" : ":" + String(mm).padStart(2, "0")) + " " + suffix;
}

function respond(statusCode, bodyObj) {
  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj),
  };
}
