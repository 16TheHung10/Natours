const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const router = express.Router();
// router.param('id', tourController.checkID);
const {
  getAllTours,
  createTour,
  getTourById,
  updateTour,
  deleteTour,
  checkBody,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = tourController;
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);
router.route(`/`).get(authController.protect, getAllTours).post(createTour);
// .post(tourController.checkBody, createTour);
router
  .route(`/:id`)
  .get(getTourById)
  .patch(updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour
  );
module.exports = router;
