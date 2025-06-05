const express = require('express');
const router = express.Router();

const dispyoyaku = require('../model/dispyoyaku.js');

router.get('/', (req, res) => {

  const timeCur = new Date().getHours();

  dispyoyaku.findByTime(timeCur, (err, retObj) => {
    if (err) {
      throw err;
    }

    const floor = initfloorinfo();
    const yoyakus = retObj[0];

    if (yoyakus.length > 0) {

      // biome-ignore lint/complexity/noForEach: <explanation>
      yoyakus.forEach((yoyaku) => {
        if (yoyaku.no_room === 401) {
          if (floor.room401.time === '　') {
            floor.room401.time = yoyaku.time_riyou;
            floor.room401.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        } 
        if (yoyaku.no_room === 402) {
          if (floor.room402.time === '　') {
            floor.room402.time = yoyaku.time_riyou;
            floor.room402.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 500) {
          if (floor.room500.time === '　') {
            floor.room500.time = yoyaku.time_riyou;
            floor.room500.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 501) {
          if (floor.room501.time === '　') {
            floor.room501.time = yoyaku.time_riyou;
            floor.room501.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 502) {
          if (floor.room502.time === '　') {
            floor.room502.time = yoyaku.time_riyou;
            floor.room502.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 503) {
          if (floor.room503.time === '　') {
            floor.room503.time = yoyaku.time_riyou;
            floor.room503.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 504) {
          if (floor.room504.time === '　') {
            floor.room504.time = yoyaku.time_riyou;
            floor.room504.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 505) {
          if (floor.room505.time === '　') {
            floor.room505.time = yoyaku.time_riyou;
            floor.room505.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 506) {
          if (floor.room506.time === '　') {
            floor.room506.time = yoyaku.time_riyou;
            floor.room506.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        // if (yoyaku.no_room === 507) {
        //   if (floor.room507.time === '　') {
        //     floor.room507.time = yoyaku.time_riyou;
        //     floor.room507.nm_user = yoyaku.nm_disp.slice(0,20);
        //   }
        // }
        if (yoyaku.no_room === 1) {
          if (floor.room001.time === '　') {
            floor.room001.time = yoyaku.time_riyou;
            floor.room001.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 2) {
          if (floor.room002.time === '　') {
            floor.room002.time = yoyaku.time_riyou;
            floor.room002.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 3) {
          if (floor.room003.time === '　') {
            floor.room003.time = yoyaku.time_riyou;
            floor.room003.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 4) {
          if (floor.room004.time === '　') {
            floor.room004.time = yoyaku.time_riyou;
            floor.room004.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 5) {
          if (floor.room005.time === '　') {
            floor.room005.time = yoyaku.time_riyou;
            floor.room005.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 10) {
          if (floor.roomprezen.time === '　') {
            floor.roomprezen.time = yoyaku.time_riyou;
            floor.roomprezen.nm_user = yoyaku.nm_disp.slice(0,20);
          }
        }
        if (yoyaku.no_room === 11) {
          if (floor.room011.time === '　') {
            floor.room011.time = yoyaku.time_riyou;
            floor.room011.nm_user = yoyaku.nm_disp.slice(0,16);
          }
        }
        if (yoyaku.no_room === 12) {
          if (floor.room012.time === '　') {
            floor.room012.time = yoyaku.time_riyou;
            floor.room012.nm_user = yoyaku.nm_disp.slice(0,16);
          }
        }
        if (yoyaku.no_room === 13) {
          if (floor.room013.time === '　') {
            floor.room013.time = yoyaku.time_riyou;
            floor.room013.nm_user = yoyaku.nm_disp.slice(0,16);
          }
        }
        if (yoyaku.no_room === 14) {
          if (floor.room014.time === '　') {
            floor.room014.time = yoyaku.time_riyou;
            floor.room014.nm_user = yoyaku.nm_disp.slice(0,16);
          }
        }
        // if (yoyaku.no_room === 15) {
        //   if (floor.room015.time === '　') {
        //     floor.room015.time = yoyaku.time_riyou;
        //     floor.room015.nm_user = yoyaku.nm_disp.slice(0,16);
        //   }
        // }
      })
    }

    const yoyakusAll = yoyakus.filter(yoyaku => yoyaku.nm_room !== '');
    const page = Math.ceil(yoyakusAll.length / 14);
    const yoyakurowcount = yoyakusAll.length;
    const rowcount = page * 14;
    for (let i = 0; i < rowcount; i++) {
      if ((yoyakurowcount - 1) < i) {
        yoyakusAll[i] = {
          name_disp: '　',
          time_riyou: '　',
          nm_room: '　'
        }
      }
    }

    res.render('top', {
      page: page,
      yoyakus: yoyakusAll,
      floor: floor,
    });

  });

});

const initfloorinfo = () => {
  const floor =
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
    room507: {
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
  return floor;
}

module.exports = router;
