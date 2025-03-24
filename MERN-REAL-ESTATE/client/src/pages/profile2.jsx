import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import {
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
  updateUserFailure,
  updateUserStart,
  updateuserSuccess,
} from "../redux/user/userSlice";
import { Link } from "react-router-dom";

export default function Profile2() {
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [saved, setSaved] = useState([]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setFilePerc(progress);
      },
      () => {
        setFileUploadError(true);
        setTimeout(() => {
          setFileUploadError(false);
        }, 5000);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData({ ...formData, avatar: downloadURL });
          setFileUploadError(false);
        });
      }
    );
  };

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateuserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
  
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
  
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch("/api/auth/signout");
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleShowFavorites = async () => {
    try {
      const res = await fetch(`/api/user/favorites/${currentUser._id}`);
      const data = await res.json();
      setFavorites(data);
      setShowFavorites(!showFavorites);
      setShowSaved(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleShowSaved = async () => {
    try {
      const res = await fetch(`/api/user/bookings/${currentUser._id}`);
      const data = await res.json();
      setSaved(data);
      setShowSaved(!showSaved);
      setShowFavorites(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      const res = await fetch(`/api/user/favorites/${currentUser._id}/remove/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        console.error(data.message);
        return;
      }
      setFavorites(favorites.filter((item) => item._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveSaved = async (id) => {
    try {
      const res = await fetch(`/api/user/bookings/${currentUser._id}/remove/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        console.error(data.message);
        return;
      }
      setSaved(saved.filter((item) => item._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          onChange={(e) => setFile(e.target.files[0])}
          type="file"
          ref={fileRef}
          hidden
          accept="image/*"
        />

        <img
          onClick={() => fileRef.current.click()}
          src={formData.avatar || currentUser.avatar}
          alt="profile"
          className="rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2"
        />

        <p className="text-sm self-center">
          {fileUploadError ? (
            <span className="text-red-700">
              {" "}
              Image Upload Error (Must be less than 2MB)
            </span>
          ) : filePerc > 0 && filePerc < 100 ? (
            <span className="text-slate-700">{`Uploading ${filePerc}%`}</span>
          ) : filePerc === 100 ? (
            <span className="text-green-700">Image successfully uploaded!</span>
          ) : (
            ""
          )}
        </p>

        <input
          type="text"
          placeholder="username"
          className="border p-3 rounded-lg"
          id="username"
          defaultValue={currentUser.username}
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="email"
          className="border p-3 rounded-lg"
          id="email"
          defaultValue={currentUser.email}
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="password"
          className="border p-3 rounded-lg"
          id="password"
          defaultValue={currentUser.password}
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Loading..." : "Update"}
        </button>
      </form>

      <div className="flex justify-between mt-5">
        <span
          onClick={handleDeleteUser}
          className="text-red-700 cursor-pointer"
        >
          Delete Account
        </span>
        <span onClick={handleSignOut} className="text-red-700 cursor-pointer">
          Sign Out
        </span>
      </div>

      <div className="flex gap-4 mt-5">
        <button
          onClick={handleShowFavorites}
          className="flex-1 bg-blue-500 text-white p-3 rounded-lg uppercase hover:opacity-95 transition-all duration-300 transform hover:scale-105"
        >
          {showFavorites ? "Hide Favorites" : "Show Favorites"}
        </button>
        <button
          onClick={handleShowSaved}
          className="flex-1 bg-green-500 text-white p-3 rounded-lg uppercase hover:opacity-95 transition-all duration-300 transform hover:scale-105"
        >
          {showSaved ? "Hide Saved" : "Show Saved"}
        </button>
      </div>

      {/* Favorites Section */}
      <div className={`slide-down ${showFavorites ? 'active' : ''}`}>
        <div className={`mt-5 content-fade ${showFavorites ? 'active' : ''}`}>
          <h2 className="text-2xl font-semibold mb-4 text-slate-700">
            Your Favorites
          </h2>
          <div className="flex flex-col gap-4">
            {favorites.length > 0 ? (
              favorites.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <Link to={`/listing/${item._id}`} className="flex items-center gap-4">
                    <img
                      src={item.imageUrls[0]}
                      alt="listing"
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-semibold text-slate-700">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        ${item.regularPrice.toLocaleString('en-US')}
                        {item.type === 'rent' && ' / month'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.address}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button 
                      className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition-colors duration-200"
                      onClick={() => handleRemoveFavorite(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 italic">No favorites yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Click the heart icon on properties to add them to your favorites
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Properties Section */}
      <div className={`slide-down ${showSaved ? 'active' : ''}`}>
        <div className={`mt-5 content-fade ${showSaved ? 'active' : ''}`}>
          <h2 className="text-2xl font-semibold mb-4 text-slate-700">
            Saved Properties
          </h2>
          <div className="flex flex-col gap-4">
            {saved.length > 0 ? (
              saved.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <Link to={`/listing/${item._id}`} className="flex items-center gap-4">
                    <img
                      src={item.imageUrls[0]}
                      alt="listing"
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-semibold text-slate-700">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        ${item.regularPrice.toLocaleString('en-US')}
                        {item.type === 'rent' && ' / month'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.address}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button 
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200"
                      onClick={() => handleRemoveSaved(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 italic">No saved properties yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Click the bookmark icon on properties to save them for later
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-red-700 mt-5">{error ? error : ""}</p>
      <p className="text-green-700">
        {updateSuccess ? "User is successfully updated!" : ""}
      </p>
    </div>
  );
}
