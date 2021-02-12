var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  info = {
    page: 2,
  }
  floor = {
    room401: {
      time:'吉田テスト１０１２３４５６７８９０１２３',
      nm_user:'10:00-17:00',
    },
    room402: {
      time:'吉田テスト２',
      nm_user:'10:00-17:00',
    },
    room500: {
      time:'吉田テスト３',
      nm_user:'10:00-17:00',
    },
    room501: {
      time:'吉田テスト４',
      nm_user:'10:00-17:00',
    },
    room502: {
      time:'吉田テスト５',
      nm_user:'10:00-17:00',
    },
    room503: {
      time:'吉田テスト６',
      nm_user:'10:00-17:00',
    },
    room504: {
      time:'吉田テスト７',
      nm_user:'10:00-17:00',
    },
    room505: {
      time:'吉田テスト８',
      nm_user:'10:00-17:00',
    },
    room506: {
      time:'吉田テスト９',
      nm_user:'10:00-17:00',
    },
    room001: {
      time:'吉田テストＡ',
      nm_user:'10:00-17:00',
    },
    room002: {
      time:'吉田テストＢ',
      nm_user:'10:00-17:00',
    },
    room003: {
      time:'吉田テストＣ',
      nm_user:'10:00-17:00',
    },
    room004: {
      time:'吉田テストＤ',
      nm_user:'10:00-17:00',
    },
    room005: {
      time:'吉田テストＥ',
      nm_user:'10:00-17:00',
    },
    room011: {
      time:'吉田テストＦ０１２３４５６７８９',
      nm_user:'10:00-17:00',
    },
    room012: {
      time:'吉田テストＧ',
      nm_user:'10:00-17:00',
    },
    room013: {
      time:'吉田テストＨ',
      nm_user:'10:00-17:00',
    },
    room014: {
      time:'吉田テストＩ',
      nm_user:'10:00-17:00',
    },
    room015: {
      time:'吉田テストＪ',
      nm_user:'10:00-17:00',
    },
    roomprezen: {
      time:'吉田テストＫ',
      nm_user:'10:00-17:00',
    },
  }
  yoyakus = [
    {
      nm_user: '吉田テスト１',
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
      nm_user: '吉田テスト６',
      nm_room: '会議室500',
      time: '9:00-17:00',
    },
    {
      nm_user: '吉田テスト７',
      nm_room: '会議室501',
      time: '10:00-17:00',
    },
    {
      nm_user: '吉田テスト８',
      nm_room: '会議室502',
      time: '11:00-17:00',
    },
    {
      nm_user: '吉田テスト９',
      nm_room: '会議室503',
      time: '12:00-17:00',
    },
    {
      nm_user: '吉田テスト１０',
      nm_room: '会議室504',
      time: '13:00-17:00',
    },
    {
      nm_user: '吉田テスト１１',
      nm_room: '会議室500',
      time: '9:00-17:00',
    },
    {
      nm_user: '吉田テスト１２',
      nm_room: '会議室501',
      time: '10:00-17:00',
    },
    {
      nm_user: '吉田テスト１３',
      nm_room: '会議室502',
      time: '11:00-17:00',
    },
    {
      nm_user: '吉田テスト１４',
      nm_room: '会議室503',
      time: '12:00-17:00',
    },
  ];

  res.render('top', {
    info: info,
    yoyakus : yoyakus,
    floor: floor,
  });

});

module.exports = router;
