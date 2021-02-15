const express = require('express');
const router = express.Router();

const dispyoyaku = require('../model/dispyoyaku');

router.get('/', function (req, res) {

  const time_cur = new Date().getHours();
  dispyoyaku.findByTime(time_cur,(err, retObj) => {

    let floor = initfloorinfo();
    const yoyakus = retObj[0];

    if (yoyakus.length !== 0) {
  
      yoyakus.forEach((yoyaku) => {
        if (yoyaku.no_room === 401) {
          floor.room401.time = yoyaku.nm_disp;
          floor.room401.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 402) {
          floor.room402.time = yoyaku.nm_disp;
          floor.room402.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 500) {
          floor.room500.time = yoyaku.nm_disp;
          floor.room500.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 501) {
          floor.room501.time = yoyaku.nm_disp;
          floor.room501.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 502) {
          floor.room502.time = yoyaku.nm_disp;
          floor.room502.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 503) {
          floor.room503.time = yoyaku.nm_disp;
          floor.room503.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 504) {
          floor.room504.time = yoyaku.nm_disp;
          floor.room504.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 505) {
          floor.room505.time = yoyaku.nm_disp;
          floor.room505.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 506) {
          floor.room506.time = yoyaku.nm_disp;
          floor.room506.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 1) {
          floor.room001.time = yoyaku.nm_disp;
          floor.room001.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 2) {
          floor.room002.time = yoyaku.nm_disp;
          floor.room002.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 3) {
          floor.room003.time = yoyaku.nm_disp;
          floor.room003.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 4) {
          floor.room004.time = yoyaku.nm_disp;
          floor.room004.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 5) {
          floor.room005.time = yoyaku.nm_disp;
          floor.room005.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 10) {
          floor.roomprezen.time = yoyaku.nm_disp;
          floor.roomprezen.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 11) {
          floor.room011.time = yoyaku.nm_disp;
          floor.room011.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 12) {
          floor.room012.time = yoyaku.nm_disp;
          floor.room012.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 13) {
          floor.room013.time = yoyaku.nm_disp;
          floor.room013.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 14) {
          floor.room014.time = yoyaku.nm_disp;
          floor.room014.nm_user = yoyaku.time_riyou;
        } else if (yoyaku.no_room === 15) {
          floor.room015.time = yoyaku.nm_disp;
          floor.room015.nm_user = yoyaku.time_riyou;
        }
      })
    }

    const page = Math.ceil(yoyakus.length/14);
    const yoyakurowcount = yoyakus.length;
    const rowcount = page * 14;
    for (let i=0; i<rowcount; i++) {
      if ((yoyakurowcount -1) < i) {
        yoyakus[i] = {
          name_disp: '　',
          time_riyou: '　',
          nm_room: '　'
        }
      }
    }
  
    res.render('top', {
      page:page,
      yoyakus: yoyakus,
      floor: floor,
    });

  });

});

const initfloorinfo = () => {
  return floor =
  {
    room401: {
      time: '　',
      nm_user: '　',
    },
    room402: {
      time: '　',
      nm_user: '　',
    },
    room500: {
      time: '　',
      nm_user: '　',
    },
    room501: {
      time: '　',
      nm_user: '　',
    },
    room502: {
      time: '　',
      nm_user: '　',
    },
    room503: {
      time: '　',
      nm_user: '　',
    },
    room504: {
      time: '　',
      nm_user: '　',
    },
    room505: {
      time: '　',
      nm_user: '　',
    },
    room506: {
      time: '　',
      nm_user: '　',
    },
    room001: {
      time: '　',
      nm_user: '　',
    },
    room002: {
      time: '　',
      nm_user: '　',
    },
    room003: {
      time: '　',
      nm_user: '　',
    },
    room004: {
      time: '　',
      nm_user: '　',
    },
    room005: {
      time: '　',
      nm_user: '　',
    },
    room011: {
      time: '　',
      nm_user: '　',
    },
    room012: {
      time: '　',
      nm_user: '　',
    },
    room013: {
      time: '　',
      nm_user: '　',
    },
    room014: {
      time: '　',
      nm_user: '　',
    },
    room015: {
      time: '　',
      nm_user: '　',
    },
    roomprezen: {
      time: '　',
      nm_user: '　',
    },
  }
}

module.exports = router;
