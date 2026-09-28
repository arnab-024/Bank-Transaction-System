const express = require('express');
const authMiddleware = require('../middleware/auth.middleware.js');
const accountController = require('../controllers/account.controller.js');

const router = express.Router();

router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);


//Get current user account information -Protected Route
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController);
module.exports = router;

router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController);

/*(SELECT DEPARTMENT, AVG(SALARY) AS AVG_SALARY GROUP BY DEPARTMENT HAVING AVG(SALARY) > 70000;*/