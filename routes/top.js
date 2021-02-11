var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {

  yoyakus = [
    {
      nm_user: '吉田テスト1',
      nm_room: '会議室500',
      time: '9:00-17:00',
    },
    {
      nm_user: '吉田テスト２',
      nm_room: '会議室501',
      time: '10:00-17:00',
    },
    {
      nm_user: '吉田テスト３',
      nm_room: '会議室502',
      time: '11:00-17:00',
    },
    {
      nm_user: '吉田テスト４',
      nm_room: '会議室503',
      time: '12:00-17:00',
    },
    {
      nm_user: '吉田テスト５',
      nm_room: '会議室504',
      time: '13:00-17:00',
    },
    {
      nm_user: '吉田テスト1',
      nm_room: '会議室500',
      time: '9:00-17:00',
    },
    {
      nm_user: '吉田テスト２',
      nm_room: '会議室501',
      time: '10:00-17:00',
    },
    {
      nm_user: '吉田テスト３',
      nm_room: '会議室502',
      time: '11:00-17:00',
    },
    {
      nm_user: '吉田テスト４',
      nm_room: '会議室503',
      time: '12:00-17:00',
    },
    {
      nm_user: '吉田テスト５',
      nm_room: '会議室504',
      time: '13:00-17:00',
    },
    {
      nm_user: '吉田テスト1',
      nm_room: '会議室500',
      time: '9:00-17:00',
    },
    {
      nm_user: '吉田テスト２',
      nm_room: '会議室501',
      time: '10:00-17:00',
    },
    {
      nm_user: '吉田テスト３',
      nm_room: '会議室502',
      time: '11:00-17:00',
    },
    {
      nm_user: '吉田テスト４',
      nm_room: '会議室503',
      time: '12:00-17:00',
    },
  ];
  res.render('top', {
    yoyakus : yoyakus
  });

});

module.exports = router;
