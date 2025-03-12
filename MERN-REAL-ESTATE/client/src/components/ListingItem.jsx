import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { FaHeart, FaBookmark } from "react-icons/fa";

export default function ListingItem({ listing }) {
  const { currentUser } = useSelector((state) => state.user);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/user/favorites/${listing._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      const data = await res.json();
      console.log("Favorite added:", data);
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  };

  const handleBook = async () => {
    try {
      const res = await fetch(`/api/user/bookings/${listing._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      const data = await res.json();
      console.log("Booking added:", data);
    } catch (error) {
      console.error("Error adding booking:", error);
    }
  };

  const defaultImg = 'https://ysac.ca/wp-content/uploads/2023/06/Illustration-House-investment-growth-Real-estate-Property-value.webp'
  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px] relative">
      <Link to={`/listing/${listing._id}`}>
        <img
          src={listing.imageUrls[0] || defaultImg}
          alt="listing cover"
          className="h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-scale duration-300"
        />

        <div className="p-3 flex flex-col gap-2 w-full">
          <p className="text-lg font-semibold text-slate-700 truncate">
            {listing.name}
          </p>

          <div className="flex items-center gap-1">
            <MdLocationOn className="h-4 w-4 text-green-700" />
            <p className="text-sm text-gray-600 truncate w-full">
              {listing.address}
            </p>
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">
            {listing.description}
          </p>

          <p className="text-slate-500 mt-2 font-semibold">
            ${""}
            {listing.offer
              ? listing.discountPrice.toLocaleString("en-US")
              : listing.regularPrice.toLocaleString("en-US")}
            {listing.type === "rent" && " / month"}
          </p>

          <div className="text-slate-700 flex gap-4">
            <div className="font-bold text-xs">
              {listing.bedrooms > 1
                ? `${listing.bedrooms} beds`
                : `${listing.bedrooms} bed`}
            </div>

            <div className="font-bold text-xs">
              {listing.bathrooms > 1
                ? `${listing.bathrooms} baths`
                : `${listing.bathrooms} bath`}
            </div>
          </div>
        </div>
      </Link>
      {currentUser && currentUser.role === "tenant" && (
        <div className="absolute top-2 right-2 flex gap-2">
          <button onClick={handleLike} className="text-red-500">
            <FaHeart size={20} />
          </button>
          <button onClick={handleBook} className="text-blue-500">
            <FaBookmark size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

ListingItem.propTypes = {
  listing: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    offer: PropTypes.bool.isRequired,
    regularPrice: PropTypes.number.isRequired,
    discountPrice: PropTypes.number,
    type: PropTypes.string.isRequired,
    bedrooms: PropTypes.number.isRequired,
    bathrooms: PropTypes.number.isRequired,
    imageUrls: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};