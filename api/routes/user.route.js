import express from 'express';
//import { deleteteUser, testing, updateUser, getUserListing, getUser, addFavorite, addBooking, getFavorites, getBookings } from '../controllers/user.controller.js';
import { deleteUser, testing, updateUser, getUserListing, getUser, getFavorites, getBookings } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/testing', testing)

router.post('/update/:id', verifyToken, updateUser )
router.delete('/delete/:id', verifyToken, deleteUser )
router.get('/listings/:id', verifyToken, getUserListing )
router.get('/:id', verifyToken, getUser )
router.get('/favorites/:id', verifyToken, getFavorites)
router.get('/bookings/:id', verifyToken, getBookings)

export default router;