// This service will house logic for preparing data for the 'top' view.

// Function to initialize floor data structure (moved from routes/top.js)
function initializeFloorData() {
  return { // Renamed from floor to be more descriptive if needed, but keeping 'floor' for consistency with original view
    room401: { time: '　', nm_user: '　' },
    room402: { time: '　', nm_user: '　' },
    room500: { time: '　', nm_user: '　' },
    room501: { time: '　', nm_user: '　' },
    room502: { time: '　', nm_user: '　' },
    room503: { time: '　', nm_user: '　' },
    room504: { time: '　', nm_user: '　' },
    room505: { time: '　', nm_user: '　' },
    room506: { time: '　', nm_user: '　' },
    room507: { time: '　', nm_user: '　' },
    room001: { time: '　', nm_user: '　' }, // Meeting Room 001
    room002: { time: '　', nm_user: '　' }, // Meeting Room 002
    room003: { time: '　', nm_user: '　' }, // Meeting Room 003
    room004: { time: '　', nm_user: '　' }, // Meeting Room 004
    room005: { time: '　', nm_user: '　' }, // Meeting Room 005
    room011: { time: '　', nm_user: '　' }, // Project Room 011
    room012: { time: '　', nm_user: '　' }, // Project Room 012
    room013: { time: '　', nm_user: '　' }, // Project Room 013
    room014: { time: '　', nm_user: '　' }, // Project Room 014
    room015: { time: '　', nm_user: '　' }, // Project Room 015
    roomprezen: { time: '　', nm_user: '　' }, // Presentation Room
  };
}

// Function to format floor data based on yoyaku records
function formatFloorData(yoyakus, floorData) {
  if (!yoyakus || yoyakus.length === 0) {
    return floorData; // Return original data if no reservations
  }

  // This is the direct move of the logic from routes/top.js
  // Consider refactoring this long if/else if chain in the future if possible.
  yoyakus.forEach((yoyaku) => {
    // Ensure yoyaku and yoyaku.no_room are valid before processing
    if (!yoyaku || typeof yoyaku.no_room === 'undefined') {
      console.warn("Skipping yoyaku with missing no_room:", yoyaku);
      return; // Skip this iteration
    }

    let roomKey = null;
    let nameLength = 20; // Default name length

    switch (yoyaku.no_room) {
      case 401: roomKey = 'room401'; break;
      case 402: roomKey = 'room402'; break;
      case 500: roomKey = 'room500'; break;
      case 501: roomKey = 'room501'; break;
      case 502: roomKey = 'room502'; break;
      case 503: roomKey = 'room503'; break;
      case 504: roomKey = 'room504'; break;
      case 505: roomKey = 'room505'; break;
      case 506: roomKey = 'room506'; break;
      case 507: roomKey = 'room507'; break;
      case 1: roomKey = 'room001'; break;    // Meeting Room 001
      case 2: roomKey = 'room002'; break;    // Meeting Room 002
      case 3: roomKey = 'room003'; break;    // Meeting Room 003
      case 4: roomKey = 'room004'; break;    // Meeting Room 004
      case 5: roomKey = 'room005'; break;    // Meeting Room 005
      case 10: roomKey = 'roomprezen'; break; // Presentation Room
      case 11: roomKey = 'room011'; nameLength = 16; break; // Project Room 011
      case 12: roomKey = 'room012'; nameLength = 16; break; // Project Room 012
      case 13: roomKey = 'room013'; nameLength = 16; break; // Project Room 013
      case 14: roomKey = 'room014'; nameLength = 16; break; // Project Room 014
      case 15: roomKey = 'room015'; nameLength = 16; break; // Project Room 015
      default:
        console.warn(`Unknown room number: ${yoyaku.no_room}`);
        return; // Skip if room number is not recognized
    }

    if (roomKey && floorData[roomKey] && floorData[roomKey].time === '　') {
      floorData[roomKey].time = yoyaku.time_riyou;
      floorData[roomKey].nm_user = yoyaku.nm_disp ? yoyaku.nm_disp.slice(0, nameLength) : '情報なし'; // Handle missing nm_disp
    }
  });

  return floorData;
}

module.exports = {
  initializeFloorData,
  formatFloorData,
};
