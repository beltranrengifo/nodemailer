const express = require('express');
const router  = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
    user=req.user
  res.render('profile',{user});
});

module.exports = router;
